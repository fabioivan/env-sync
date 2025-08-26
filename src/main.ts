#!/usr/bin/env node

/**
 * Env-Sync - Ferramenta para sincronização de configurações de banco de dados
 * Gerencia portas de banco de dados em múltiplos projetos C#/React
 */

import { ConfigManager } from "./config-manager"
import { PortUpdater } from "./port-updater"
import { InputHandler } from "./input-handler"
import { UIManager } from "./ui-manager"
import { CommandManager } from "./command-manager"

/**
 * Aplicação principal do Env-Sync.
 */
export class EnvSyncApp {
  private configManager: ConfigManager
  private portUpdater: PortUpdater
  private inputHandler: InputHandler
  private uiManager: UIManager
  private commandManager: CommandManager

  constructor() {
    this.configManager = new ConfigManager()
    this.portUpdater = new PortUpdater()
    this.inputHandler = new InputHandler()
    this.uiManager = new UIManager()
    this.commandManager = new CommandManager(this.inputHandler, this.uiManager, this.configManager)
  }

  /**
   * Executa a aplicação principal.
   */
  async run(): Promise<void> {
    this.uiManager.showBanner()

    try {
      // Seleção de ambiente com interface melhorada
      const environment = await this.commandManager.selectEnvironmentInteractive()
      if (!environment) {
        this.uiManager.showWarning("Nenhum ambiente selecionado.")
        return
      }

      // Mostra prévia das mudanças
      this.showPreview(environment.port)

      // Confirma a execução
      const shouldContinue = await this.commandManager.showConfirmationMenu(
        `Você está prestes a atualizar a porta para ${environment.port} em todos os arquivos encontrados.`
      )
      if (!shouldContinue) {
        this.uiManager.showWarning("Operação cancelada.")
        return
      }

      // Executa a atualização
      await this.executeUpdate(environment.port)

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
      spinner.fail("Erro durante a atualização!");
      throw error;
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
  const inputHandler = new InputHandler()
  const uiManager = new UIManager()
  const configManager = new ConfigManager()
  const commandManager = new CommandManager(inputHandler, uiManager, configManager)

  try {
    commandManager.parseArguments(process.argv)
  } finally {
    inputHandler.close()
  }
}

// Executa apenas se este arquivo for executado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error("Erro fatal:", error)
    process.exit(1)
  })
}
