import { Command } from "commander"
import { InputHandler } from "./input-handler"
import { UIManager } from "./ui-manager"
import { ConfigManager, Environment } from "./config-manager"
import chalk from "chalk"

/**
 * Gerencia comandos interativos usando Commander.
 */
export class CommandManager {
  private program: Command
  private inputHandler: InputHandler
  private uiManager: UIManager
  private configManager: ConfigManager

  constructor(inputHandler: InputHandler, uiManager: UIManager, configManager: ConfigManager) {
    this.program = new Command()
    this.inputHandler = inputHandler
    this.uiManager = uiManager
    this.configManager = configManager
    this.setupCommands()
  }

  /**
   * Configura os comandos disponíveis.
   */
  private setupCommands(): void {
    this.program
      .name("env-sync")
      .description("🔧 Gerenciador de Configurações de Ambientes - Sincronize portas de banco de dados")
      .version("1.0.0", "-v, --version", "Exibir versão")
      .helpOption("-h, --help", "Exibir ajuda")

    this.program
      .command("start")
      .description("Iniciar o gerenciador de ambientes")
      .action(async () => {
      })

    this.program
      .command("list")
      .alias("ls")
      .description("Listar todos os ambientes configurados")
      .action(() => {
        this.listEnvironments()
      })

    this.program
      .command("add")
      .description("Adicionar novo ambiente")
      .action(async () => {
        await this.addEnvironmentInteractive()
      })

    this.program
      .command("remove <name>")
      .alias("rm")
      .description("Remover ambiente por nome")
      .action((name: string) => {
        this.removeEnvironment(name)
      })

    this.program
      .command("help")
      .description("Exibir ajuda detalhada")
      .action(() => {
        this.uiManager.showHelp()
      })
  }

  /**
   * Processa argumentos da linha de comando.
   */
  parseArguments(args: string[]): void {
    this.program.parse(args)
  }

  /**
   * Seleção interativa de ambiente com menu visual.
   */
  async selectEnvironmentInteractive(): Promise<Environment | null> {
    const environments = this.configManager.listEnvironments()

    if (environments.length === 0) {
      this.uiManager.showWarning("Nenhum ambiente configurado encontrado!")

      const shouldAdd = await this.inputHandler.confirm(
        chalk.yellow("Deseja adicionar um novo ambiente agora? (s/n): ")
      )

      if (shouldAdd) {
        const added = await this.addEnvironmentInteractive()
        if (added) {
          return this.selectEnvironmentInteractive() // Recursivo para mostrar a nova lista
        }
      }
      return null
    }

    while (true) {
      this.uiManager.addSpacing()
      this.uiManager.showEnvironmentsList(environments)

      const choice = await this.inputHandler.selectOption(
        chalk.cyan.bold("Selecione um ambiente (número): "),
        environments.length,
        true
      )

      if (choice === null) {
        this.uiManager.showWarning("Operação cancelada.")
        return null
      }

      if (choice === 0) {
        const added = await this.addEnvironmentInteractive()
        if (added) {
          return this.selectEnvironmentInteractive() // Recarrega a lista
        }
        continue
      }

      const selected = environments[choice - 1]
      this.uiManager.showSelectedEnvironment(selected)

      const confirm = await this.inputHandler.confirm(
        chalk.green("Confirma a seleção deste ambiente? (s/n): ")
      )

      if (confirm) {
        return selected
      }
    }
  }

  /**
   * Adiciona ambiente de forma interativa.
   */
  async addEnvironmentInteractive(): Promise<boolean> {
    this.uiManager.addSpacing()
    this.uiManager.showAddEnvironmentForm()

    try {
      const name = await this.inputHandler.requiredInput(
        chalk.cyan("📝 Nome do ambiente: "),
        chalk.red("❌ O nome do ambiente é obrigatório!")
      )

      // Verifica se já existe
      if (this.configManager.getEnvironment(name)) {
        this.uiManager.showError(`Ambiente '${name}' já existe!`)
        return false
      }

      const url = await this.inputHandler.requiredInput(
        chalk.cyan("🌐 URL do ambiente: "),
        chalk.red("❌ A URL do ambiente é obrigatória!")
      )

      const port = await this.inputHandler.requiredInput(
        chalk.cyan("🔌 Porta do banco: "),
        chalk.red("❌ A porta do banco é obrigatória!")
      )

      // Valida a porta
      if (!this.isValidPort(port)) {
        this.uiManager.showError("Porta inválida! Deve ser um número entre 1 e 65535.")
        return false
      }

      const username = await this.inputHandler.requiredInput(
        chalk.cyan("👤 Usuário do banco: "),
        chalk.red("❌ O usuário do banco é obrigatório!")
      )

      const password = await this.inputHandler.requiredInput(
        chalk.cyan("🔒 Senha do banco: "),
        chalk.red("❌ A senha do banco é obrigatória!")
      )

      // Mostra preview do ambiente
      console.log(chalk.yellow.bold("\n📋 Preview do novo ambiente:"))
      console.log(chalk.gray("─".repeat(40)))
      console.log(chalk.white("Nome: ") + chalk.cyan(name))
      console.log(chalk.white("URL: ") + chalk.blue(url))
      console.log(chalk.white("Porta: ") + chalk.yellow(port))
      console.log(chalk.white("Usuário: ") + chalk.magenta(username))
      console.log(chalk.white("Senha: ") + chalk.gray("*".repeat(password.length)))

      const shouldSave = await this.inputHandler.confirm(
        chalk.green("\nDeseja salvar este ambiente? (s/n): ")
      )

      if (!shouldSave) {
        this.uiManager.showWarning("Adição de ambiente cancelada.")
        return false
      }

      const success = this.configManager.addEnvironment(name, url, port, username, password)
      if (success) {
        this.uiManager.showSuccess(`Ambiente '${name}' adicionado com sucesso!`)
      }
      return success

    } catch (error) {
      this.uiManager.showError("Adição de ambiente cancelada.")
      return false
    }
  }

  /**
   * Lista todos os ambientes.
   */
  private listEnvironments(): void {
    this.uiManager.clear()
    this.uiManager.showBanner()

    const environments = this.configManager.listEnvironments()
    this.uiManager.showEnvironmentsList(environments)
  }

  /**
   * Remove um ambiente.
   */
  private removeEnvironment(name: string): void {
    const success = this.configManager.deleteEnvironment(name)
    if (success) {
      this.uiManager.showSuccess(`Ambiente '${name}' removido com sucesso!`)
    } else {
      this.uiManager.showError(`Ambiente '${name}' não encontrado!`)
    }
  }

  /**
   * Valida se uma porta é válida.
   */
  private isValidPort(port: string): boolean {
    const portNumber = parseInt(port, 10)
    return !isNaN(portNumber) && portNumber > 0 && portNumber <= 65535
  }

  /**
   * Exibe menu de confirmação estilizado.
   */
  async showConfirmationMenu(message: string): Promise<boolean> {
    this.uiManager.showConfirmation()
    console.log(chalk.white(message))
    console.log()

    return await this.inputHandler.confirm(
      chalk.yellow.bold("Confirma a operação? (s/n): ")
    )
  }

  /**
   * Obtém a instância do programa Commander.
   */
  getProgram(): Command {
    return this.program
  }
}
