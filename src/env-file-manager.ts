import * as fs from "fs"
import * as path from "path"
import chalk from "chalk"

export interface EnvFileInfo {
  filePath: string
  currentValue: string | null
  newValue: string
}

export interface EnvUpdateResult {
  updatedFiles: string[]
  failedFiles: string[]
  previewData: EnvFileInfo[]
}

export class EnvFileManager {
  private readonly projectsPath: string

  constructor() {
    this.projectsPath = path.join(process.env.HOME || process.env.USERPROFILE || "", "projects")
  }

  /**
   * Encontra todos os arquivos .env.development na pasta projects
   */
  findEnvDevelopmentFiles(): string[] {
    const envFiles: string[] = []

    if (!fs.existsSync(this.projectsPath)) {
      console.log(chalk.yellow(`⚠️  Pasta projects não encontrada: ${this.projectsPath}`))
      return envFiles
    }

    this.searchRecursiveForEnvFiles(this.projectsPath, envFiles)
    return envFiles
  }

  /**
   * Busca recursivamente por arquivos .env.development
   */
  private searchRecursiveForEnvFiles(directory: string, envFiles: string[]): void {
    try {
      const items = fs.readdirSync(directory, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(directory, item.name)

        if (item.isDirectory()) {
          // Ignora node_modules, .git e outras pastas comuns que devem ser excluídas
          if (this.shouldSkipDirectory(item.name)) {
            continue
          }
          this.searchRecursiveForEnvFiles(fullPath, envFiles)
        } else if (item.isFile() && item.name === ".env.development") {
          envFiles.push(fullPath)
        }
      }
    } catch (error) {
      // Ignora erros de permissão silenciosamente
    }
  }

  /**
   * Verifica se o diretório deve ser ignorado
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirectories = [
      "node_modules",
      ".git",
      ".vscode",
      ".idea",
      "dist",
      "build",
      ".next",
      "coverage",
      ".nuxt",
      "vendor",
      "bin",
      "obj",
    ]

    return skipDirectories.some((skipDir) => dirName.toLowerCase().includes(skipDir.toLowerCase()))
  }

  /**
   * Lê o valor atual da variável REACT_APP_SYNDATA no arquivo
   */
  getCurrentSynData(filePath: string): string | null {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      const lines = content.split("\n")

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith("REACT_APP_SYNDATA=")) {
          return trimmedLine.substring("REACT_APP_SYNDATA=".length)
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Gera preview das mudanças que serão feitas
   */
  generatePreview(newSynData: string): EnvFileInfo[] {
    const envFiles = this.findEnvDevelopmentFiles()
    const previewData: EnvFileInfo[] = []

    for (const filePath of envFiles) {
      const currentValue = this.getCurrentSynData(filePath)
      previewData.push({
        filePath,
        currentValue,
        newValue: newSynData,
      })
    }

    return previewData
  }

  /**
   * Atualiza a variável REACT_APP_SYNDATA em todos os arquivos .env.development
   */
  updateSynDataInAllFiles(newSynData: string): EnvUpdateResult {
    const envFiles = this.findEnvDevelopmentFiles()
    const updatedFiles: string[] = []
    const failedFiles: string[] = []
    const previewData: EnvFileInfo[] = []

    for (const filePath of envFiles) {
      try {
        const currentValue = this.getCurrentSynData(filePath)
        previewData.push({
          filePath,
          currentValue,
          newValue: newSynData,
        })

        if (this.updateSynDataInFile(filePath, newSynData)) {
          updatedFiles.push(filePath)
        } else {
          failedFiles.push(filePath)
        }
      } catch (error) {
        failedFiles.push(filePath)
        console.error(chalk.red(`❌ Erro ao processar ${filePath}: ${error}`))
      }
    }

    return {
      updatedFiles,
      failedFiles,
      previewData,
    }
  }

  /**
   * Atualiza a variável REACT_APP_SYNDATA em um arquivo específico
   */
  private updateSynDataInFile(filePath: string, newSynData: string): boolean {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      const lines = content.split("\n")
      let updated = false
      let syndataFound = false

      // Procura pela linha existente e atualiza
      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim()
        if (trimmedLine.startsWith("REACT_APP_SYNDATA=")) {
          lines[i] = `REACT_APP_SYNDATA=${newSynData}`
          updated = true
          syndataFound = true
          break
        }
      }

      // Se não encontrou, adiciona no final do arquivo
      if (!syndataFound) {
        lines.push(`REACT_APP_SYNDATA=${newSynData}`)
        updated = true
      }

      // Salva o arquivo apenas se houve mudança
      if (updated) {
        fs.writeFileSync(filePath, lines.join("\n"), "utf8")
        return true
      }

      return false
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao atualizar ${filePath}: ${error}`))
      return false
    }
  }

  /**
   * Valida se a pasta projects existe
   */
  validateProjectsPath(): boolean {
    return fs.existsSync(this.projectsPath)
  }

  /**
   * Retorna o caminho da pasta projects
   */
  getProjectsPath(): string {
    return this.projectsPath
  }
}
