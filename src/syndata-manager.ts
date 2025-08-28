import chalk from "chalk"
import { DatabaseManager, DatabaseInfo, UserInfo } from "./database-manager"
import { SynData } from "./syndata"
import { EnvFileManager, EnvUpdateResult, UserCredentials } from "./env-file-manager"
import { Environment } from "./config-manager"
import { CLIMenu } from "./cli-menu"

export interface SynDataOperationResult {
  success: boolean
  message: string
  synData?: string
  envUpdateResult?: EnvUpdateResult
}

export class SynDataManager {
  private databaseManager: DatabaseManager
  private envFileManager: EnvFileManager
  private cliMenu: CLIMenu

  constructor(environment: Environment) {
    this.databaseManager = new DatabaseManager({
      host: environment.url,
      port: parseInt(environment.port),
      user: environment.username,
      password: environment.password,
    })
    this.envFileManager = new EnvFileManager()
    this.cliMenu = new CLIMenu()
  }

  /**
   * Busca todas as bases hemp disponíveis
   */
  async getAvailableDatabases(): Promise<DatabaseInfo[]> {
    try {
      console.log(chalk.cyan("\n🔍 Buscando bases de dados disponíveis...\n"))

      const connectionTest = await this.databaseManager.testConnection()
      if (!connectionTest) {
        throw new Error(
          "Não foi possível conectar ao banco de dados. Verifique as configurações do ambiente.",
        )
      }

      const databases = await this.databaseManager.getHempDatabases()

      if (databases.length === 0) {
        console.log(chalk.yellow("⚠️  Nenhuma base hemp encontrada"))
        return []
      }

      console.log(chalk.green(`✅ ${databases.length} base(s) encontrada(s)`))
      return databases
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao buscar bases: ${error}`))
      throw error
    }
  }

  /**
   * Gera o SynData criptografado
   */
  generateSynData(environment: Environment, selectedDatabase: string): string {
    try {
      const synData = new SynData(environment.url, selectedDatabase)
      const encryptedSynData = synData.encrypt()

      console.log(chalk.green("✅ SynData gerado com sucesso"))
      console.log(chalk.cyan(`📋 Database: ${selectedDatabase}`))
      console.log(chalk.cyan(`🌐 Host: ${environment.url}`))

      return encryptedSynData
    } catch (error) {
      console.error(chalk.red(`\n❌ Erro ao gerar SynData: ${error}`))
      throw error
    }
  }

  /**
   * Gera preview das mudanças nos arquivos .env.development
   */
  generateEnvPreview(synData: string): any[] {
    try {
      console.log(chalk.cyan("\n🔍 Gerando preview das mudanças..."))

      const previewData = this.envFileManager.generatePreview(synData)

      if (previewData.length === 0) {
        console.log(chalk.yellow("\n⚠️  Nenhum arquivo .env.development encontrado"))
        return []
      }

      console.log(chalk.green(`\n✅ ${previewData.length} arquivo(s) .env.development encontrado(s)`))
      return previewData
    } catch (error) {
      console.error(chalk.red(`\n❌ Erro ao gerar preview: ${error}`))
      throw error
    }
  }

  /**
   * Atualiza todos os arquivos .env.development com o novo SynData
   */
  updateEnvFiles(synData: string): EnvUpdateResult {
    try {
      console.log(chalk.cyan("\n🔄 Atualizando arquivos .env.development..."))

      const result = this.envFileManager.updateSynDataInAllFiles(synData)

      if (result.updatedFiles.length > 0) {
        console.log(
          chalk.green(`✅ ${result.updatedFiles.length} arquivo(s) atualizado(s) com sucesso`),
        )
      }

      if (result.failedFiles.length > 0) {
        console.log(
          chalk.red(`\n❌ ${result.failedFiles.length} arquivo(s) falharam na atualização`),
        )
      }

      return result
    } catch (error) {
      console.error(chalk.red(`\n❌ Erro ao atualizar arquivos: ${error}`))
      throw error
    }
  }

  /**
   * Permite ao usuário selecionar um usuário específico da base
   */
  async selectUserFromDatabase(databaseName: string): Promise<UserInfo | null> {
    try {
      while (true) {
        const searchOptions = await this.cliMenu.showUserSearchMenu()

        if (searchOptions.action === "cancel") {
          return null
        }

        let users: UserInfo[] = []

        if (searchOptions.action === "list") {
          console.log(chalk.cyan("\n🔍 Carregando todos os usuários da base..."))
          users = await this.databaseManager.getActiveUsers(databaseName)
        } else if (searchOptions.action === "search" && searchOptions.searchTerm) {
          console.log(chalk.cyan(`\n🔍 Procurando usuários com login contendo "${searchOptions.searchTerm}"...`))
          users = await this.databaseManager.searchUsersByLogin(databaseName, searchOptions.searchTerm)
        }

        const selectedUser = await this.cliMenu.showUserSelectionMenu(users)

        if (selectedUser === "cancel") {
          return null
        } else if (selectedUser === "new_search") {
          continue
        } else if (selectedUser) {
          const confirmed = await this.cliMenu.confirmUserSelection(selectedUser)
          if (confirmed) {
            return selectedUser
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao selecionar usuário: ${error}`))
      return null
    }
  }

  /**
   * Atualiza as credenciais do usuário nos arquivos .env.development
   */
  updateUserCredentials(credentials: UserCredentials): EnvUpdateResult {
    try {
      console.log(chalk.cyan("\n🔐 Atualizando credenciais nos arquivos .env.development..."))

      const result = this.envFileManager.updateUserCredentialsInAllFiles(credentials)

      if (result.updatedFiles.length > 0) {
        console.log(
          chalk.green(`\n✅ ${result.updatedFiles.length} arquivo(s) atualizado(s) com credenciais`),
        )
      }

      if (result.failedFiles.length > 0) {
        console.log(chalk.red(`\n❌ ${result.failedFiles.length} arquivo(s) falharam na atualização de credenciais`))
      }

      return result
    } catch (error) {
      console.error(chalk.red(`\n❌ Erro ao atualizar credenciais: ${error}`))
      throw error
    }
  }

  /**
   * Valida se as condições necessárias estão atendidas
   */
  validatePrerequisites(): { valid: boolean; message: string } {
    if (!this.envFileManager.validateProjectsPath()) {
      return {
        valid: false,
        message: `Pasta projects não encontrada: ${this.envFileManager.getProjectsPath()}`,
      }
    }

    return {
      valid: true,
      message: "Pré-requisitos atendidos",
    }
  }

  /**
   * Descriptografa um SynData para verificação
   */
  static decodeSynData(encryptedSynData: string): { SynDb: string; SynHost: string } | null {
    try {
      const result = SynData.decrypt(encryptedSynData)
      if (!result) {
        console.error(chalk.red("❌ Erro ao descriptografar SynData: dados inválidos"))
        return null
      }
      return result
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao descriptografar SynData: ${error}`))
      return null
    }
  }
}
