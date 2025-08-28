import { Command } from "commander"
import { UIManager } from "./ui-manager"
import { ConfigManager, Environment } from "./config-manager"
import chalk from "chalk"
import inquirer from "inquirer"

/**
 * Gerencia comandos interativos usando Commander e Inquirer.
 */
export class CommandManager {
  private program: Command
  private uiManager: UIManager
  private configManager: ConfigManager

  constructor(uiManager: UIManager, configManager: ConfigManager) {
    this.program = new Command()
    this.uiManager = uiManager
    this.configManager = configManager
    this.setupCommands()
  }

  /**
   * Configura os comandos disponíveis.
   */
  private setupCommands(): void {
    this.program
      .name("env-updater")
      .description(
        "🔧 Gerenciador de Configurações de Ambientes - Sincronize portas de banco de dados",
      )
      .version("1.0.0", "-v, --version", "Exibir versão")
      .helpOption("-h, --help", "Exibir ajuda")

    this.program
      .command("start")
      .description("Iniciar o gerenciador de ambientes")
      .action(async () => {})

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
   * Seleção interativa de ambiente com menu visual usando inquirer.
   */
  async selectEnvironmentInteractive(): Promise<Environment | null> {
    const environments = this.configManager.listEnvironments()

    if (environments.length === 0) {
      console.log(chalk.yellow("⚠️  Nenhum ambiente configurado encontrado!"))

      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "shouldAdd",
          message: "Deseja adicionar um novo ambiente agora?",
          default: true,
        },
      ])

      if (answer.shouldAdd) {
        const added = await this.addEnvironmentInteractive()
        if (added) {
          return this.selectEnvironmentInteractive()
        }
      }
      return null
    }

    const choices = environments.map((env, index) => ({
      name: `${env.name} - ${env.url}:${env.port}`,
      value: index,
      short: env.name,
    }))

    choices.push({
      name: chalk.green("➕ Adicionar novo ambiente"),
      value: -1,
      short: "Adicionar",
    })

    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "environmentIndex",
        message: "Selecione um ambiente:",
        choices,
        pageSize: Math.min(choices.length, 10),
      },
    ])

    if (answer.environmentIndex === -1) {
      const added = await this.addEnvironmentInteractive()
      if (added) {
        return this.selectEnvironmentInteractive()
      }
      return null
    }

    const selected = environments[answer.environmentIndex]


    console.log(chalk.cyan("\n📋 Ambiente selecionado:"))
    console.log(chalk.white(`   🌐 Nome: ${selected.name}`))
    console.log(chalk.white(`   🔗 Host: ${selected.url}`))
    console.log(chalk.white(`   🚪 Porta: ${selected.port}`))
    console.log(chalk.white(`   👤 Usuário: ${selected.username}`))

    const confirm = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Confirma a seleção deste ambiente?",
        default: true,
      },
    ])

    if (confirm.confirm) {
      return selected
    }

    return this.selectEnvironmentInteractive()
  }

  /**
   * Adiciona ambiente de forma interativa usando inquirer.
   */
  async addEnvironmentInteractive(): Promise<boolean> {
    console.log(chalk.cyan("\n🆕 Adicionar Novo Ambiente"))
    console.log(chalk.gray("─".repeat(40)))

    try {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "📝 Nome do ambiente:",
          validate: (input: string) => {
            if (!input.trim()) {
              return "O nome do ambiente é obrigatório!"
            }
            if (this.configManager.getEnvironment(input.trim())) {
              return `Ambiente '${input.trim()}' já existe!`
            }
            return true
          },
        },
        {
          type: "input",
          name: "url",
          message: "🌐 URL do ambiente:",
          validate: (input: string) => {
            return input.trim() ? true : "A URL do ambiente é obrigatória!"
          },
        },
        {
          type: "input",
          name: "port",
          message: "🔌 Porta do banco:",
          validate: (input: string) => {
            if (!input.trim()) {
              return "A porta do banco é obrigatória!"
            }
            if (!this.isValidPort(input.trim())) {
              return "Porta inválida! Deve ser um número entre 1 e 65535."
            }
            return true
          },
        },
        {
          type: "input",
          name: "username",
          message: "👤 Usuário do banco:",
          validate: (input: string) => {
            return input.trim() ? true : "O usuário do banco é obrigatório!"
          },
        },
        {
          type: "password",
          name: "password",
          message: "🔒 Senha do banco:",
          validate: (input: string) => {
            return input.trim() ? true : "A senha do banco é obrigatória!"
          },
        },
      ])

      console.log(chalk.yellow.bold("\n📋 Preview do novo ambiente:"))
      console.log(chalk.gray("─".repeat(40)))
      console.log(chalk.white("Nome: ") + chalk.cyan(answers.name))
      console.log(chalk.white("Host: ") + chalk.blue(answers.url))
      console.log(chalk.white("Porta: ") + chalk.yellow(answers.port))
      console.log(chalk.white("Usuário: ") + chalk.magenta(answers.username))
      console.log(chalk.white("Senha: ") + chalk.gray("*".repeat(answers.password.length)))

      const confirmation = await inquirer.prompt([
        {
          type: "confirm",
          name: "shouldSave",
          message: "Deseja salvar este ambiente?",
          default: true,
        },
      ])

      if (!confirmation.shouldSave) {
        console.log(chalk.yellow("⚠️  Adição de ambiente cancelada."))
        return false
      }

      const success = this.configManager.addEnvironment(
        answers.name.trim(),
        answers.url.trim(),
        answers.port.trim(),
        answers.username.trim(),
        answers.password.trim(),
      )

      if (success) {
        console.log(chalk.green(`✅ Ambiente '${answers.name}' adicionado com sucesso!`))
      }
      return success
    } catch (error) {
      console.log(chalk.yellow("⚠️  Adição de ambiente cancelada."))
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
   * Exibe menu de confirmação estilizado usando inquirer.
   */
  async showConfirmationMenu(message: string): Promise<boolean> {
    console.log(chalk.yellow("\n⚠️  Confirmação necessária"))
    console.log(chalk.gray("─".repeat(50)))
    console.log(chalk.white(message))

    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Confirma a operação?",
        default: false,
      },
    ])

    return answer.confirm
  }
}
