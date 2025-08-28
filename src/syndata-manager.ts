import chalk from "chalk"
import { DatabaseManager, DatabaseInfo } from "./database-manager"
import { SynData } from "./syndata"
import { EnvFileManager, EnvUpdateResult } from "./env-file-manager"
import { Environment } from "./config-manager"

export interface SynDataOperationResult {
  success: boolean
  message: string
  synData?: string
  envUpdateResult?: EnvUpdateResult
}

export class SynDataManager {
  private databaseManager: DatabaseManager
  private envFileManager: EnvFileManager

  constructor(environment: Environment) {
    this.databaseManager = new DatabaseManager({
      host: environment.url,
      port: parseInt(environment.port),
      user: environment.username,
      password: environment.password,
    })
    this.envFileManager = new EnvFileManager()
  }

  /**
   * Busca todas as bases hemp disponíveis
   */
  async getAvailableDatabases(): Promise<DatabaseInfo[]> {
    try {
      console.log(chalk.cyan("🔍 Buscando bases de dados disponíveis..."))

      // Testa a conexão primeiro
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
      console.error(chalk.red(`❌ Erro ao gerar SynData: ${error}`))
      throw error
    }
  }

  /**
   * Gera preview das mudanças nos arquivos .env.development
   */
  generateEnvPreview(synData: string): any[] {
    try {
      console.log(chalk.cyan("🔍 Gerando preview das mudanças..."))

      const previewData = this.envFileManager.generatePreview(synData)

      if (previewData.length === 0) {
        console.log(chalk.yellow("⚠️  Nenhum arquivo .env.development encontrado"))
        return []
      }

      console.log(chalk.green(`✅ ${previewData.length} arquivo(s) .env.development encontrado(s)`))
      return previewData
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao gerar preview: ${error}`))
      throw error
    }
  }

  /**
   * Atualiza todos os arquivos .env.development com o novo SynData
   */
  updateEnvFiles(synData: string): EnvUpdateResult {
    try {
      console.log(chalk.cyan("🔄 Atualizando arquivos .env.development..."))

      const result = this.envFileManager.updateSynDataInAllFiles(synData)

      if (result.updatedFiles.length > 0) {
        console.log(
          chalk.green(`✅ ${result.updatedFiles.length} arquivo(s) atualizado(s) com sucesso`),
        )
      }

      if (result.failedFiles.length > 0) {
        console.log(chalk.red(`❌ ${result.failedFiles.length} arquivo(s) falharam na atualização`))
      }

      return result
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao atualizar arquivos: ${error}`))
      throw error
    }
  }

  /**
   * Executa todo o fluxo de criação de SynData
   */
  async createSynData(
    environment: Environment,
    selectedDatabase: string,
  ): Promise<SynDataOperationResult> {
    try {
      // 1. Gera o SynData
      const synData = this.generateSynData(environment, selectedDatabase)

      // 2. Atualiza os arquivos .env.development
      const envUpdateResult = this.updateEnvFiles(synData)

      return {
        success: true,
        message: "SynData criado e arquivos atualizados com sucesso",
        synData,
        envUpdateResult,
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao criar SynData: ${error}`,
      }
    }
  }

  /**
   * Valida se as condições necessárias estão atendidas
   */
  validatePrerequisites(): { valid: boolean; message: string } {
    // Verifica se a pasta projects existe
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
