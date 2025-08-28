import inquirer from "inquirer"
import chalk from "chalk"
import { UIManager } from "./ui-manager"

export interface MenuChoice {
  name: string
  value: string
  description: string
}

export class CLIMenu {
  private uiManager: UIManager

  constructor() {
    this.uiManager = new UIManager()
  }

  /**
   * Exibe o menu principal da aplicação
   */
  async showMainMenu(): Promise<string> {
    this.uiManager.showBanner()

    console.log(chalk.cyan("\n🛠️  Selecione uma operação:"))
    console.log(chalk.gray("─".repeat(50)))

    const choices: MenuChoice[] = [
      {
        name: "🔄 Trocar Ambiente",
        value: "change_environment",
        description: "Altera a porta do banco de dados em todos os projetos",
      },
      {
        name: "🔧 Criar SynData",
        value: "create_syndata",
        description: "Gera SynData baseado no ambiente selecionado",
      },
      {
        name: "❌ Sair",
        value: "exit",
        description: "Encerra a aplicação",
      },
    ]

    // Exibe descrições das opções
    choices.forEach((choice, index) => {
      if (choice.value !== "exit") {
        console.log(chalk.white(`${index + 1}. ${choice.name}`))
        console.log(chalk.gray(`   ${choice.description}`))
        console.log("")
      }
    })

    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "operation",
        message: "Escolha uma operação:",
        choices: choices.map((choice) => ({
          name: choice.name,
          value: choice.value,
        })),
        pageSize: choices.length,
      },
    ])

    return answer.operation
  }

  /**
   * Exibe menu de seleção de base de dados
   */
  async showDatabaseMenu(
    databases: Array<{ databaseName: string; clientName: string }>,
  ): Promise<string> {
    if (databases.length === 0) {
      throw new Error("Nenhuma base de dados disponível")
    }

    console.log(chalk.cyan("\n📊 Bases de dados disponíveis:"))
    console.log(chalk.gray("─".repeat(50)))

    const choices = databases.map((db) => ({
      name: `${chalk.yellow(db.databaseName)} - ${chalk.white(db.clientName)}`,
      value: db.databaseName,
      short: db.databaseName,
    }))

    // Adiciona opção para cancelar
    choices.push({
      name: chalk.gray("❌ Cancelar operação"),
      value: "cancel",
      short: "cancel",
    })

    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "database",
        message: "Selecione a base de dados:",
        choices,
        pageSize: Math.min(choices.length, 10),
      },
    ])

    if (answer.database === "cancel") {
      throw new Error("Operação cancelada pelo usuário")
    }

    return answer.database
  }

  /**
   * Exibe confirmação para atualizar arquivos
   */
  async confirmFileUpdate(previewData: any[]): Promise<boolean> {
    if (previewData.length === 0) {
      console.log(chalk.yellow("⚠️  Nenhum arquivo para atualizar"))
      return false
    }

    console.log(chalk.cyan("\n📋 Preview das mudanças:"))
    console.log(chalk.gray("─".repeat(70)))

    // Exibe preview dos arquivos que serão modificados
    previewData.forEach((file, index) => {
      console.log(chalk.white(`${index + 1}. ${file.filePath}`))

      if (file.currentValue) {
        console.log(chalk.red(`   ❌ Atual: ${file.currentValue.substring(0, 50)}...`))
      } else {
        console.log(chalk.gray("   📝 Variável será adicionada"))
      }

      console.log(chalk.green(`   ✅ Nova:  ${file.newValue.substring(0, 50)}...`))
      console.log("")
    })

    console.log(chalk.yellow(`📊 Total: ${previewData.length} arquivo(s) serão modificados`))

    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Deseja prosseguir com as alterações?",
        default: true,
      },
    ])

    return answer.confirm
  }

  /**
   * Exibe menu de confirmação genérico
   */
  async showConfirmation(message: string, defaultValue: boolean = true): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message,
        default: defaultValue,
      },
    ])

    return answer.confirm
  }

  /**
   * Exibe mensagem de sucesso
   */
  showSuccess(message: string, details?: string[]): void {
    console.log(chalk.green.bold(`\n🎉 ${message}`))

    if (details && details.length > 0) {
      console.log(chalk.cyan("\n📊 Resumo:"))
      details.forEach((detail) => {
        console.log(chalk.white(`   • ${detail}`))
      })
    }
  }

  /**
   * Exibe mensagem de erro
   */
  showError(message: string, error?: Error): void {
    console.log(chalk.red.bold(`\n❌ ${message}`))

    if (error) {
      console.log(chalk.gray(`   Detalhes: ${error.message}`))
    }
  }

  /**
   * Exibe informações sobre o último ambiente usado
   */
  showLastEnvironmentInfo(environmentName: string, lastUsed?: Date): void {
    console.log(chalk.cyan("\n💾 Último ambiente utilizado:"))
    console.log(chalk.white(`   🌐 ${environmentName}`))

    if (lastUsed) {
      const timeAgo = this.getTimeAgo(lastUsed)
      console.log(chalk.gray(`   🕒 Usado há ${timeAgo}`))
    }

    console.log("")
  }

  /**
   * Calcula o tempo decorrido desde uma data
   */
  private getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} dia(s)`
    } else if (diffHours > 0) {
      return `${diffHours} hora(s)`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minuto(s)`
    } else {
      return "poucos segundos"
    }
  }
}
