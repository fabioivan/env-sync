import { DatabaseFileFinder } from "./file-finder"
import { DockerManager } from "./docker-manager"

/**
 * Interface para o resultado da atualização de portas
 */
export interface UpdateResult {
  updatedFiles: string[]
  failedFiles: string[]
}

/**
 * Interface para a prévia de mudanças
 */
export interface PreviewChanges {
  [filePath: string]: string[]
}

/**
 * Atualiza portas em arquivos databasesettings.json.
 */
export class PortUpdater {
  private readonly fileFinder: DatabaseFileFinder
  private updatedFiles: string[] = []
  private failedFiles: string[] = []
  private synAuthUpdatedFiles: string[] = []

  constructor() {
    this.fileFinder = new DatabaseFileFinder()
  }

  /**
   * Atualiza a porta em todos os arquivos databasesettings.json encontrados.
   */
  updatePortsInAllFiles(newPort: string): UpdateResult {
    this.updatedFiles = []
    this.failedFiles = []

    // Encontra todos os arquivos databasesettings.json
    const databaseFiles = this.fileFinder.findDatabaseSettingsFiles()

    if (databaseFiles.length === 0) {
      console.log("Nenhum arquivo databasesettings.json encontrado na pasta home.")
      return { updatedFiles: [], failedFiles: [] }
    }

    console.log(`\nEncontrados ${databaseFiles.length} arquivo(s). Iniciando atualização...`)

    for (const filePath of databaseFiles) {
      if (this.updatePortInFile(filePath, newPort)) {
        this.updatedFiles.push(filePath)

        // Verifica se é arquivo do SynAuth
        if (this.isSynAuthFile(filePath)) {
          this.synAuthUpdatedFiles.push(filePath)
        }
      } else {
        this.failedFiles.push(filePath)
      }
    }

    return {
      updatedFiles: [...this.updatedFiles],
      failedFiles: [...this.failedFiles],
    }
  }

  /**
   * Atualiza a porta em um arquivo específico.
   */
  updatePortInFile(filePath: string, newPort: string): boolean {
    console.log(`\nProcessando: ${filePath}`)

    // Lê o conteúdo do arquivo
    const content = this.fileFinder.readDatabaseSettings(filePath)
    if (content === null) {
      console.error(`Erro: Não foi possível ler o arquivo ${filePath}`)
      return false
    }

    // Encontra as connection strings
    const connectionKeys = this.fileFinder.findConnectionStrings(content)

    if (connectionKeys.length === 0) {
      console.warn(`Aviso: Nenhuma connection string encontrada em ${filePath}`)
      return false
    }

    console.log(`Connection strings encontradas: ${connectionKeys.join(", ")}`)

    // Atualiza as portas
    let updated = false
    for (const keyPath of connectionKeys) {
      if (this.updatePortByKeyPath(content, keyPath, newPort)) {
        updated = true
      }
    }

    if (updated) {
      // Salva o arquivo atualizado
      if (this.fileFinder.writeDatabaseSettings(filePath, content)) {
        console.log(`✅ Arquivo atualizado com sucesso: ${filePath}`)
        return true
      } else {
        console.error(`❌ Erro ao salvar arquivo: ${filePath}`)
        return false
      }
    } else {
      console.warn(`⚠️  Nenhuma porta foi atualizada em: ${filePath}`)
      return false
    }
  }

  /**
   * Atualiza a porta em uma chave específica do JSON.
   */
  private updatePortByKeyPath(
    content: Record<string, any>,
    keyPath: string,
    newPort: string,
  ): boolean {
    const connectionString = this.fileFinder.getValueByKeyPath(content, keyPath)

    if (typeof connectionString !== "string") {
      console.warn(`Aviso: Valor em ${keyPath} não é uma string`)
      return false
    }

    // Extrai a porta atual
    const currentPort = this.fileFinder.extractPortFromConnectionString(connectionString)

    if (currentPort === null) {
      console.warn(`Aviso: Porta não encontrada na connection string de ${keyPath}`)
      return false
    }

    if (currentPort === newPort) {
      console.log(`Info: Porta em ${keyPath} já está configurada como ${newPort}`)
      return false
    }

    // Atualiza a porta
    const updatedConnectionString = this.fileFinder.updatePortInConnectionString(
      connectionString,
      newPort,
    )

    // Salva a string atualizada
    if (this.fileFinder.setValueByKeyPath(content, keyPath, updatedConnectionString)) {
      console.log(`✅ Porta atualizada em ${keyPath}: ${currentPort} → ${newPort}`)
      return true
    } else {
      console.error(`❌ Erro ao atualizar ${keyPath}`)
      return false
    }
  }

  /**
   * Mostra uma prévia das mudanças que serão feitas sem modificar os arquivos.
   */
  previewChanges(newPort: string): PreviewChanges {
    const preview: PreviewChanges = {}
    const databaseFiles = this.fileFinder.findDatabaseSettingsFiles()

    for (const filePath of databaseFiles) {
      const content = this.fileFinder.readDatabaseSettings(filePath)
      if (content === null) {
        continue
      }

      const connectionKeys = this.fileFinder.findConnectionStrings(content)
      const changes: string[] = []

      for (const keyPath of connectionKeys) {
        const connectionString = this.fileFinder.getValueByKeyPath(content, keyPath)
        if (typeof connectionString === "string") {
          const currentPort = this.fileFinder.extractPortFromConnectionString(connectionString)
          if (currentPort && currentPort !== newPort) {
            changes.push(`${keyPath}: ${currentPort} → ${newPort}`)
          }
        }
      }

      if (changes.length > 0) {
        preview[filePath] = changes
      }
    }

    return preview
  }

  /**
   * Retorna um resumo das operações realizadas.
   */
  getSummary(): string {
    const summary: string[] = []

    if (this.updatedFiles.length > 0) {
      summary.push(`✅ ${this.updatedFiles.length} arquivo(s) atualizado(s) com sucesso:`)
      for (const filePath of this.updatedFiles) {
        summary.push(`   - ${filePath}`)
      }
    }

    if (this.failedFiles.length > 0) {
      summary.push(`❌ ${this.failedFiles.length} arquivo(s) com erro:`)
      for (const filePath of this.failedFiles) {
        summary.push(`   - ${filePath}`)
      }
    }

    if (this.updatedFiles.length === 0 && this.failedFiles.length === 0) {
      summary.push("ℹ️  Nenhum arquivo foi processado.")
    }

    return summary.join("\n")
  }

  /**
   * Reseta o estado interno para uma nova operação.
   */
  reset(): void {
    this.updatedFiles = []
    this.failedFiles = []
    this.synAuthUpdatedFiles = []
  }

  /**
   * Obtém estatísticas da última operação.
   */
  getStats(): { updated: number; failed: number; total: number } {
    return {
      updated: this.updatedFiles.length,
      failed: this.failedFiles.length,
      total: this.updatedFiles.length + this.failedFiles.length,
    }
  }

  /**
   * Valida se uma porta é válida.
   */
  static isValidPort(port: string): boolean {
    const portNumber = parseInt(port, 10)
    return !isNaN(portNumber) && portNumber > 0 && portNumber <= 65535
  }

  /**
   * Verifica se um arquivo pertence ao projeto SynAuth.
   */
  private isSynAuthFile(filePath: string): boolean {
    return filePath.toLowerCase().includes("synauth")
  }

  /**
   * Verifica se houve atualizações no SynAuth.
   */
  hasSynAuthUpdates(): boolean {
    return this.synAuthUpdatedFiles.length > 0
  }

  /**
   * Obtém a lista de arquivos do SynAuth que foram atualizados.
   */
  getSynAuthUpdatedFiles(): string[] {
    return [...this.synAuthUpdatedFiles]
  }

  /**
   * Gerencia o restart automático do Docker para o SynAuth se necessário.
   * Executa o rebuild automaticamente quando detecta mudanças no SynAuth.
   */
  async handleSynAuthDockerRestart(): Promise<void> {
    if (!this.hasSynAuthUpdates()) {
      return
    }

    const dockerManager = new DockerManager()

    try {
      // Informa sobre o restart e confirma automaticamente
      dockerManager.askForSynAuthRestart()

      // Encontra o diretório do projeto SynAuth
      const synAuthFile = this.synAuthUpdatedFiles[0]
      const projectRoot = dockerManager.findSynAuthProjectRoot(synAuthFile)

      if (projectRoot) {
        await dockerManager.rebuildSynAuthContainer(projectRoot)
      } else {
        console.log("❌ Não foi possível localizar o diretório raiz do projeto SynAuth.")
      }
    } catch (error) {
      console.error(`❌ Erro ao gerenciar Docker do SynAuth: ${error}`)
    }
  }
}
