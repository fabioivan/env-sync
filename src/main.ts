#!/usr/bin/env node

/**
 * Env-Sync - Ferramenta para sincronização de configurações de banco de dados
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
 * Aplicação principal do Env-Sync.
 */
export class EnvSyncApp {
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
      // Exibe o menu principal
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
      // Seleção de ambiente com interface melhorada
      const environment = await this.commandManager.selectEnvironmentInteractive()
      if (!environment) {
        this.uiManager.showWarning("Nenhum ambiente selecionado.")
        return
      }

      // Salva como último ambiente usado
      this.lastEnvManager.saveLastEnvironment(environment)

      // Mostra prévia das mudanças
      this.showPreview(environment.port)

      // Confirma a execução
      const shouldContinue = await this.commandManager.showConfirmationMenu(
        `Você está prestes a atualizar a porta para ${environment.port} em todos os arquivos encontrados.`,
      )
      if (!shouldContinue) {
        this.uiManager.showWarning("Operação cancelada.")
        return
      }

      // Executa a atualização
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
      // 1. Seleciona ou usa último ambiente
      const environment = await this.selectEnvironmentForSynData()
      if (!environment) {
        this.uiManager.showWarning("Nenhum ambiente selecionado.")
        return
      }

      // 2. Cria o gerenciador de SynData
      const synDataManager = new SynDataManager(environment)

      // 3. Valida pré-requisitos
      const validation = synDataManager.validatePrerequisites()
      if (!validation.valid) {
        this.cliMenu.showError(validation.message)
        return
      }

      // 4. Busca bases de dados disponíveis
      const spinner = this.uiManager.showProgress("Conectando ao banco de dados...")
      const databases = await synDataManager.getAvailableDatabases()
      spinner.succeed("Bases de dados carregadas!")

      if (databases.length === 0) {
        this.cliMenu.showError("Nenhuma base hemp encontrada")
        return
      }

      // 5. Usuário seleciona a base
      const selectedDatabase = await this.cliMenu.showDatabaseMenu(databases)

      // 6. Gera preview do SynData
      const synData = synDataManager.generateSynData(environment, selectedDatabase)
      const previewData = synDataManager.generateEnvPreview(synData)

      // 7. Confirma as mudanças
      const shouldUpdate = await this.cliMenu.confirmFileUpdate(previewData)
      if (!shouldUpdate) {
        this.uiManager.showWarning("Operação cancelada.")
        return
      }

      // 8. Executa a atualização
      const updateSpinner = this.uiManager.showProgress("Atualizando arquivos .env.development...")
      const result = synDataManager.updateEnvFiles(synData)
      updateSpinner.succeed("Arquivos atualizados!")

      // 9. Exibe resumo
      const details = [
        `${result.updatedFiles.length} arquivo(s) atualizado(s)`,
        `Database: ${selectedDatabase}`,
        `Host: ${environment.url}:${environment.port}`,
      ]

      if (result.failedFiles.length > 0) {
        details.push(`${result.failedFiles.length} arquivo(s) falharam`)
      }

      this.cliMenu.showSuccess("SynData criado com sucesso!", details)

      // 10. Salva como último ambiente usado
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

    // Se não quer usar o último ou não existe, seleciona interativamente
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

    // Verifica se houve atualizações no SynAuth e oferece restart do Docker
    // Esta chamada fica FORA do try-catch para não interromper o fluxo
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

  // Se não há argumentos ou é o comando start, executa a aplicação principal
  if (args.length === 0 || args[0] === "start") {
    const app = new EnvSyncApp()
    await app.run()
    return
  }

  // Para outros comandos, cria uma instância apenas para processar comandos
  const uiManager = new UIManager()
  const configManager = new ConfigManager()
  const commandManager = new CommandManager(uiManager, configManager)

  try {
    commandManager.parseArguments(process.argv)
  } finally {
    // Não há mais InputHandler para fechar
  }
}

// Executa apenas se este arquivo for executado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error("Erro fatal:", error)
    process.exit(1)
  })
}
