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
   * Filtra apenas projetos que contenham 'lerna-repo' ou 'lerna' no nome
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
   * Considera apenas projetos que contenham 'lerna-repo' ou 'lerna' no nome
   */
  private searchRecursiveForEnvFiles(directory: string, envFiles: string[]): void {
    try {
      const items = fs.readdirSync(directory, { withFileTypes: true })
      let lernaProjectPath: string | undefined = undefined

      for (const item of items) {
        const fullPath = path.join(directory, item.name)

        if (item.isDirectory()) {
          if (this.shouldSkipDirectory(item.name)) {
            continue
          }

          if (!this.isLernaProject(item.name)) {
            this.searchRecursiveForEnvFiles(fullPath, envFiles)
          } else {
            lernaProjectPath = fullPath
          }
        } else if (item.isFile() && item.name === ".env.development") {
          envFiles.push(fullPath)
        }
      }

      if (lernaProjectPath) {
        this.searchRecursiveForEnvFiles(lernaProjectPath, envFiles)
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao buscar arquivos .env.development: ${error}`))
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
   * Verifica se o diretório é um projeto lerna
   */
  private isLernaProject(dirName: string): boolean {
    const lowerCaseName = dirName.toLowerCase()

    return lowerCaseName.includes("lerna-repo") || lowerCaseName.includes("lerna")
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
   * Considera apenas arquivos que já contêm a variável REACT_APP_SYNDATA
   */
  generatePreview(newSynData: string): EnvFileInfo[] {
    const envFiles = this.findEnvDevelopmentFiles()
    const previewData: EnvFileInfo[] = []

    for (const filePath of envFiles) {
      const currentValue = this.getCurrentSynData(filePath)

      // Só inclui no preview se a variável já existe no arquivo
      if (currentValue !== null) {
        previewData.push({
          filePath,
          currentValue,
          newValue: newSynData,
        })
      } else {
        console.log(chalk.yellow(`⚠️  Arquivo ${filePath} não contém REACT_APP_SYNDATA, será ignorado`))
      }
    }

    return previewData
  }

  /**
   * Atualiza a variável REACT_APP_SYNDATA em todos os arquivos .env.development
   * Considera apenas arquivos que já contêm a variável REACT_APP_SYNDATA
   */
  updateSynDataInAllFiles(newSynData: string): EnvUpdateResult {
    const envFiles = this.findEnvDevelopmentFiles()
    const updatedFiles: string[] = []
    const failedFiles: string[] = []
    const previewData: EnvFileInfo[] = []

    for (const filePath of envFiles) {
      try {
        const currentValue = this.getCurrentSynData(filePath)

        if (currentValue !== null) {
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
   * Só atualiza se a variável já existir no arquivo
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

      // Se a variável não existe, não faz nada (diferente do comportamento anterior)
      if (!syndataFound) {
        console.log(chalk.yellow(`⚠️  Variável REACT_APP_SYNDATA não encontrada em ${filePath}, pulando arquivo`))
        return false
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
