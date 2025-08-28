import * as fs from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

/**
 * Encontra e manipula arquivos databasesettings.json na pasta home do usuário.
 */
export class DatabaseFileFinder {
  private readonly homePath: string

  constructor() {
    this.homePath = os.homedir()
  }

  /**
   * Encontra todos os arquivos databasesettings.json na pasta home do usuário.
   */
  findDatabaseSettingsFiles(): string[] {
    const databaseFiles: string[] = []
    console.log("Procurando arquivos databasesettings.json...")

    this.searchRecursively(this.homePath, databaseFiles)
    return databaseFiles
  }

  /**
   * Busca recursivamente por arquivos databasesettings.json.
   */
  private searchRecursively(dirPath: string, foundFiles: string[]): void {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name)

        if (item.isDirectory()) {
          if (this.shouldSkipDirectory(item.name)) {
            continue
          }
          this.searchRecursively(fullPath, foundFiles)
        } else if (item.isFile() && item.name.toLowerCase() === "databasesettings.json") {
          if (this.shouldIgnoreFile(fullPath)) {
            this.getIgnoreReason(fullPath)
          } else {
            foundFiles.push(fullPath)
          }
        }
      }
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EACCES" &&
        (error as NodeJS.ErrnoException).code !== "EPERM"
      ) {
        console.warn(`Erro ao acessar ${dirPath}: ${error}`)
      }
    }
  }

  /**
   * Verifica se um diretório deve ser ignorado na busca.
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      "node_modules",
      "__pycache__",
      "bin",
      "obj",
      "packages",
      ".git",
      ".svn",
      ".hg",
      "Trash",
      "Downloads",
      "Desktop",
      ".npm",
      ".cache",
      ".local",
      ".config",
      "dist",
      "build",
    ]

    if (dirName.startsWith(".")) {
      return true
    }

    if (skipDirs.includes(dirName)) {
      return true
    }

    if (dirName.toLowerCase().includes("test")) {
      return true
    }

    return false
  }

  /**
   * Lê e retorna o conteúdo de um arquivo databasesettings.json.
   */
  readDatabaseSettings(filePath: string): Record<string, any> | null {
    try {
      const content = fs.readFileSync(filePath, "utf-8")
      return JSON.parse(content)
    } catch (error) {
      console.error(`Erro ao ler ${filePath}: ${error}`)
      return null
    }
  }

  /**
   * Escreve conteúdo em um arquivo databasesettings.json.
   */
  writeDatabaseSettings(filePath: string, content: Record<string, any>): boolean {
    try {
      const jsonContent = JSON.stringify(content, null, 4)
      fs.writeFileSync(filePath, jsonContent, "utf-8")
      return true
    } catch (error) {
      console.error(`Erro ao escrever ${filePath}: ${error}`)
      return false
    }
  }

  /**
   * Encontra chaves que provavelmente contêm strings de conexão.
   */
  findConnectionStrings(content: Record<string, any>): string[] {
    const connectionKeys: string[] = []
    this.searchRecursiveForConnections(content, connectionKeys)
    return connectionKeys
  }

  /**
   * Busca recursivamente por connection strings no objeto JSON.
   */
  private searchRecursiveForConnections(
    obj: any,
    connectionKeys: string[],
    currentPath: string = "",
  ): void {
    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`
          this.searchRecursiveForConnections(item, connectionKeys, newPath)
        })
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = currentPath ? `${currentPath}.${key}` : key

          if (typeof value === "string") {
            if (this.isConnectionString(key, value)) {
              connectionKeys.push(newPath)
            }
          } else if (typeof value === "object" && value !== null) {
            this.searchRecursiveForConnections(value, connectionKeys, newPath)
          }
        })
      }
    }
  }

  /**
   * Verifica se uma chave/valor pode ser uma connection string.
   */
  private isConnectionString(key: string, value: string): boolean {
    const keyWords = ["connection", "connectionstring", "database", "server", "datasource"]
    const valueKeywords = ["server=", "data source=", "initial catalog=", "database=", "port="]

    const keyContainsKeyword = keyWords.some((keyword) => key.toLowerCase().includes(keyword))

    const valueContainsKeyword = valueKeywords.some((keyword) =>
      value.toLowerCase().includes(keyword),
    )

    return keyContainsKeyword || valueContainsKeyword
  }

  /**
   * Extrai a porta de uma string de conexão.
   */
  extractPortFromConnectionString(connectionString: string): string | null {
    const patterns = [/port=(\d+)/i, /Port=(\d+)/, /:(\d+);/, /:(\d+)\//, /,(\d+);/]

    for (const pattern of patterns) {
      const match = connectionString.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Atualiza a porta em uma string de conexão.
   */
  updatePortInConnectionString(connectionString: string, newPort: string): string {
    const replacements = [
      { pattern: /(port=)\d+/i, replacement: `$1${newPort}` },
      { pattern: /(Port=)\d+/, replacement: `$1${newPort}` },
      { pattern: /(:\d+)(;)/, replacement: `:${newPort}$2` },
      { pattern: /(:\d+)(\/)/, replacement: `:${newPort}$2` },
      { pattern: /(,)\d+(;)/, replacement: `$1${newPort}$2` },
    ]

    let updatedString = connectionString

    for (const { pattern, replacement } of replacements) {
      if (pattern.test(updatedString)) {
        updatedString = updatedString.replace(pattern, replacement)
        break
      }
    }

    return updatedString
  }

  /**
   * Obtém um valor do JSON usando o caminho da chave.
   */
  getValueByKeyPath(content: Record<string, any>, keyPath: string): any {
    const keys = keyPath.split(".")
    let current: any = content

    try {
      for (const key of keys) {
        if (key.includes("[") && key.includes("]")) {
          const arrayKey = key.split("[")[0]
          const index = parseInt(key.split("[")[1].split("]")[0])
          current = current[arrayKey][index]
        } else {
          current = current[key]
        }
      }
      return current
    } catch (error) {
      return null
    }
  }

  /**
   * Define um valor no JSON usando o caminho da chave.
   */
  setValueByKeyPath(content: Record<string, any>, keyPath: string, value: any): boolean {
    const keys = keyPath.split(".")
    let current: any = content

    try {
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        if (key.includes("[") && key.includes("]")) {
          const arrayKey = key.split("[")[0]
          const index = parseInt(key.split("[")[1].split("]")[0])
          current = current[arrayKey][index]
        } else {
          current = current[key]
        }
      }

      const finalKey = keys[keys.length - 1]
      if (finalKey.includes("[") && finalKey.includes("]")) {
        const arrayKey = finalKey.split("[")[0]
        const index = parseInt(finalKey.split("[")[1].split("]")[0])
        current[arrayKey][index] = value
      } else {
        current[finalKey] = value
      }

      return true
    } catch (error) {
      console.error(`Erro ao definir valor em ${keyPath}: ${error}`)
      return false
    }
  }

  /**
   * Verifica se um arquivo deve ser ignorado (MySQL ou sem porta).
   */
  private shouldIgnoreFile(filePath: string): boolean {
    try {
      const content = this.readDatabaseSettings(filePath)
      if (!content) {
        return false
      }

      const providers = this.findProviders(content)
      const connectionStrings = this.findConnectionStrings(content)

      if (providers.some((provider) => provider.toLowerCase() === "mysql")) {
        return true
      }

      const hasPortInAnyConnection = connectionStrings.some((keyPath) => {
        const connectionString = this.getValueByKeyPath(content, keyPath)
        if (typeof connectionString === "string") {
          return this.extractPortFromConnectionString(connectionString) !== null
        }
        return false
      })

      return !hasPortInAnyConnection
    } catch (error) {
      return false
    }
  }

  /**
   * Retorna o motivo pelo qual um arquivo foi ignorado.
   */
  private getIgnoreReason(filePath: string): string {
    try {
      const content = this.readDatabaseSettings(filePath)
      if (!content) {
        return "erro na leitura"
      }

      const providers = this.findProviders(content)
      const connectionStrings = this.findConnectionStrings(content)

      if (providers.some((provider) => provider.toLowerCase() === "mysql")) {
        return "Provider MySQL"
      }

      const hasPortInAnyConnection = connectionStrings.some((keyPath) => {
        const connectionString = this.getValueByKeyPath(content, keyPath)
        if (typeof connectionString === "string") {
          return this.extractPortFromConnectionString(connectionString) !== null
        }
        return false
      })

      if (!hasPortInAnyConnection) {
        const provider = providers.length > 0 ? providers[0] : "Provider desconhecido"
        return `${provider} sem porta`
      }

      return "motivo desconhecido"
    } catch (error) {
      return "erro na análise"
    }
  }

  /**
   * Encontra todos os providers configurados no arquivo.
   */
  private findProviders(content: Record<string, any>): string[] {
    const providers: string[] = []
    this.searchRecursiveForProviders(content, providers)
    return providers
  }

  /**
   * Busca recursivamente por providers no objeto JSON.
   */
  private searchRecursiveForProviders(
    obj: any,
    providers: string[],
    currentPath: string = "",
  ): void {
    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`
          this.searchRecursiveForProviders(item, providers, newPath)
        })
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = currentPath ? `${currentPath}.${key}` : key

          if (key.toLowerCase() === "provider" && typeof value === "string") {
            providers.push(value)
          } else if (typeof value === "object" && value !== null) {
            this.searchRecursiveForProviders(value, providers, newPath)
          }
        })
      }
    }
  }
}
