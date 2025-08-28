#!/usr/bin/env node

/**
 * Environment-Updater - Ferramenta para sincronização de configurações de banco de dados
 * Gerencia portas de banco de dados e SynData em múltiplos projetos C#/React
 */

import { ConfigManager, Environment } from "./config-manager"
import { PortUpdater } from "./port-updater"
import { InputHandler } from "./input-handler"
import { UIManager } from "./ui-manager"
import { CommandManager } from "./command-manager"
import { CLIMenu } from "./cli-menu"
import { SynDataManager } from "./syndata-manager"
import { LastEnvironmentManager } from "./last-environment-manager"

/**
 * Aplicação principal do Environment-Updater.
 */
export class EnvironmentUpdaterApp {
  private configManager: ConfigManager
  private portUpdater: PortUpdater
  private inputHandler: InputHandler
  private uiManager: UIManager
  private commandManager: CommandManager
  private cliMenu: CLIMenu
  private lastEnvManager: LastEnvironmentManager

  constructor() {
    this.configManager = new ConfigManager()
    this.portUpdater = new PortUpdater()
    this.inputHandler = new InputHandler()
    this.uiManager = new UIManager()
    this.commandManager = new CommandManager(this.uiManager, this.configManager)
    this.cliMenu = new CLIMenu()
    this.lastEnvManager = new LastEnvironmentManager()
  }

  /**
   * Executa a aplicação principal.
   */
  async run(): Promise<void> {
    try {
      const operation = await this.cliMenu.showMainMenu()

      switch (operation) {
        case "change_environment":
          await this.handleChangeEnvironment()
          break
        case "create_syndata":
          await this.handleCreateSynData()
          break
        case "exit":
          this.uiManager.showWarning("Até logo! 👋")
          break
        default:
          this.uiManager.showError("Operação inválida")
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SIGINT") {
        this.uiManager.showWarning("Operação cancelada pelo usuário.")
      } else {
        this.uiManager.showError(`Erro inesperado: ${error}`)
      }
    } finally {
      // Fecha o input handler apenas no final, depois de todas as operações
      this.inputHandler.close()
    }
  }

  /**
   * Gerencia a operação de trocar ambiente (funcionalidade original)
   */
  private async handleChangeEnvironment(): Promise<void> {
    try {
      const environment = await this.commandManager.selectEnvironmentInteractive()
      if (!environment) {
        this.uiManager.showWarning("Nenhum ambiente selecionado.")
        return
      }

      this.lastEnvManager.saveLastEnvironment(environment)

      this.showPreview(environment.port)

      const shouldContinue = await this.commandManager.showConfirmationMenu(
        `Você está prestes a atualizar a porta para ${environment.port} em todos os arquivos encontrados.`,
      )
      if (!shouldContinue) {
        this.uiManager.showWarning("Operação cancelada.")
        return
      }

      await this.executeUpdate(environment.port)
    } catch (error) {
      this.cliMenu.showError("Erro ao trocar ambiente", error as Error)
    }
  }

  /**
   * Gerencia a operação de criar SynData
   */
  private async handleCreateSynData(): Promise<void> {
    try {
      const environment = await this.selectEnvironmentForSynData()
      if (!environment) {
        this.uiManager.showWarning("Nenhum ambiente selecionado.")
        return
      }

      const synDataManager = new SynDataManager(environment)

      const validation = synDataManager.validatePrerequisites()
      if (!validation.valid) {
        this.cliMenu.showError(validation.message)
        return
      }

      const spinner = this.uiManager.showProgress("Conectando ao banco de dados...")
      const databases = await synDataManager.getAvailableDatabases()
      spinner.succeed("Bases de dados carregadas!")

      if (databases.length === 0) {
        this.cliMenu.showError("Nenhuma base hemp encontrada")
        return
      }

      const selectedDatabase = await this.cliMenu.showDatabaseMenu(databases)

      const selectedUser = await synDataManager.selectUserFromDatabase(selectedDatabase)
      if (!selectedUser) {
        this.uiManager.showWarning("Operação cancelada: nenhum usuário selecionado.")
        return
      }

      const synData = synDataManager.generateSynData(environment, selectedDatabase)
      const previewData = synDataManager.generateEnvPreview(synData)

      const shouldUpdate = await this.cliMenu.confirmFileUpdate(previewData)
      if (!shouldUpdate) {
        this.uiManager.showWarning("Operação cancelada.")
        return
      }

      const updateSpinner = this.uiManager.showProgress("Atualizando arquivos .env.development...")
      const result = synDataManager.updateEnvFiles(synData)
      updateSpinner.succeed("Arquivos atualizados!")

      const credentialsSpinner = this.uiManager.showProgress("Atualizando credenciais do usuário...")
      const credentialsResult = synDataManager.updateUserCredentials({
        username: selectedUser.login,
        password: selectedUser.password,
      })
      credentialsSpinner.succeed("Credenciais atualizadas!")

      if (credentialsResult.failedFiles.length > 0) {
        this.uiManager.showWarning(`${credentialsResult.failedFiles.length} arquivo(s) falharam na atualização de credenciais`)
      }

      const details = [
        `${result.updatedFiles.length} arquivo(s) atualizado(s) com SynData`,
        `${credentialsResult.updatedFiles.length} arquivo(s) atualizado(s) com credenciais`,
        `Database: ${selectedDatabase}`,
        `Host: ${environment.url}:${environment.port}`,
        `Usuário: ${selectedUser.login}`,
      ]

      if (result.failedFiles.length > 0 || credentialsResult.failedFiles.length > 0) {
        const totalFailed = result.failedFiles.length + credentialsResult.failedFiles.length
        details.push(`${totalFailed} arquivo(s) falharam`)
      }

      this.cliMenu.showSuccess("SynData e credenciais criados com sucesso!", details)

      this.lastEnvManager.saveLastEnvironment(environment)
    } catch (error) {
      this.cliMenu.showError("Erro ao criar SynData", error as Error)
    }
  }

  /**
   * Seleciona ambiente para criação de SynData (com sugestão do último usado)
   */
  private async selectEnvironmentForSynData(): Promise<Environment | null> {
    const lastEnvironment = this.lastEnvManager.getLastEnvironment()

    if (lastEnvironment) {
      const lastUsed = this.lastEnvManager.getLastUsedDate()
      this.cliMenu.showLastEnvironmentInfo(lastEnvironment.name, lastUsed || undefined)

      const useLastEnvironment = await this.cliMenu.showConfirmation(
        `Usar o ambiente '${lastEnvironment.name}' para criar SynData?`,
      )

      if (useLastEnvironment) {
        return lastEnvironment
      }
    }

    return await this.commandManager.selectEnvironmentInteractive()
  }

  /**
   * Mostra uma prévia das mudanças que serão feitas.
   */
  private showPreview(newPort: string): void {
    const preview = this.portUpdater.previewChanges(newPort)
    this.uiManager.showPreview(preview, newPort)
  }

  /**
   * Executa a atualização das portas.
   */
  private async executeUpdate(newPort: string): Promise<void> {
    const spinner = this.uiManager.showProgress("Executando atualização das portas...")

    try {
      const result = this.portUpdater.updatePortsInAllFiles(newPort)
      spinner.succeed("Atualização concluída!")

      this.uiManager.addSpacing()
      this.uiManager.showOperationSummary(result.updatedFiles, result.failedFiles)
    } catch (error) {
      spinner.fail("Erro durante a atualização!")
      throw error
    }

    await this.portUpdater.handleSynAuthDockerRestart()
  }

  /**
   * Mostra informações de ajuda.
   */
  showHelp(): void {
    this.uiManager.showHelp()
  }
}

/**
 * Função principal.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === "start") {
    const app = new EnvironmentUpdaterApp()
    await app.run()
    return
  }

  const uiManager = new UIManager()
  const configManager = new ConfigManager()
  const commandManager = new CommandManager(uiManager, configManager)

  commandManager.parseArguments(process.argv)
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Erro fatal:", error)
    process.exit(1)
  })
}
