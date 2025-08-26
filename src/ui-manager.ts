import chalk from "chalk"
import figlet from "figlet"
import boxen from "boxen"
import Table from "cli-table3"
import ora from "ora"
import { Environment } from "./config-manager"
import { PreviewChanges } from "./port-updater"

/**
 * Gerencia a interface visual do usuário com cores e formatação atrativa.
 */
export class UIManager {

  /**
   * Exibe o banner principal da aplicação.
   */
  showBanner(): void {
    console.clear()

    const title = figlet.textSync("ENV-SYNC", {
      font: "ANSI Shadow",
      horizontalLayout: "default",
      verticalLayout: "default",
    })

    const banner = boxen(
      chalk.cyan.bold(title) +
      "\n\n" +
      chalk.white("🔧 Gerenciador de Configurações de Ambientes") +
      "\n" +
      chalk.gray("Sincronize portas de banco de dados em projetos C#"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        backgroundColor: "black"
      }
    )

    console.log(banner)
  }

  /**
   * Exibe lista de ambientes de forma visual atrativa.
   */
  showEnvironmentsList(environments: Environment[]): void {
    if (environments.length === 0) {
      const message = boxen(
        chalk.yellow("📋 Nenhum ambiente configurado"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "yellow"
        }
      )
      console.log(message)
      return
    }

    console.log(chalk.cyan.bold("\n🌍 Ambientes Disponíveis:"))
    console.log(chalk.gray("─".repeat(80)))

    const table = new Table({
      head: [
        chalk.white.bold("ID"),
        chalk.white.bold("Nome"),
        chalk.white.bold("URL"),
        chalk.white.bold("Porta"),
        chalk.white.bold("Usuário")
      ],
      colWidths: [5, 20, 25, 10, 15],
      style: {
        head: ["cyan"],
        border: ["cyan"]
      }
    })

    environments.forEach((env, index) => {
      table.push([
        chalk.cyan.bold((index + 1).toString()),
        chalk.green(env.name),
        chalk.blue(env.url),
        chalk.yellow(env.port),
        chalk.magenta(env.username)
      ])
    })

    console.log(table.toString())

    // Opções adicionais
    console.log(chalk.gray("\n📌 Opções adicionais:"))
    console.log(chalk.white("  0. ") + chalk.green("Adicionar novo ambiente"))
    console.log(chalk.white("  q. ") + chalk.red("Sair"))
    console.log()
  }

  /**
   * Exibe preview das mudanças de forma visualmente atrativa.
   */
  showPreview(preview: PreviewChanges, newPort: string): void {
    console.log(chalk.cyan.bold("\n🔍 Preview das Mudanças:"))
    console.log(chalk.gray("─".repeat(80)))

    if (Object.keys(preview).length === 0) {
      const message = boxen(
        chalk.yellow("ℹ️  Nenhuma mudança será feita") + "\n" +
        chalk.gray("(Nenhum arquivo encontrado ou portas já estão corretas)"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "yellow",
          align: "center"
        }
      )
      console.log(message)
      return
    }

    let totalChanges = 0
    Object.entries(preview).forEach(([filePath, changes]) => {
      totalChanges += changes.length

      // Header do arquivo
      console.log(chalk.blue.bold(`\n📁 ${this.getRelativePath(filePath)}`))
      console.log(chalk.gray("   " + "─".repeat(60)))

      // Lista as mudanças
      changes.forEach((change) => {
        const [keyPath, portChange] = change.split(": ")
        const [oldPort, newPortDisplay] = portChange.split(" → ")

        console.log(
          chalk.gray("   🔄 ") +
          chalk.white(keyPath) + ": " +
          chalk.red(oldPort) +
          chalk.gray(" → ") +
          chalk.green(newPortDisplay)
        )
      })
    })

    // Resumo
    const summary = boxen(
      chalk.white.bold("📊 Resumo:") + "\n" +
      chalk.cyan(`   • Arquivos a serem modificados: ${Object.keys(preview).length}`) + "\n" +
      chalk.cyan(`   • Total de mudanças: ${totalChanges}`) + "\n" +
      chalk.cyan(`   • Nova porta: ${newPort}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green"
      }
    )

    console.log(summary)
  }

  /**
   * Exibe formulário para adicionar novo ambiente.
   */
  showAddEnvironmentForm(): void {
    const header = boxen(
      chalk.yellow.bold("📝 Adicionar Novo Ambiente"),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "yellow",
        align: "center"
      }
    )
    console.log(header)
    console.log(chalk.gray("Preencha os dados do novo ambiente:\n"))
  }

  /**
   * Exibe confirmação de operação.
   */
  showConfirmation(): void {
    console.log(chalk.yellow.bold("\n⚠️  Confirmação de Operação"))
    console.log(chalk.gray("═".repeat(50)))
  }

  /**
   * Exibe progresso da operação.
   */
  showProgress(message: string): ora.Ora {
    return ora({
      text: chalk.cyan(message),
      spinner: "dots",
      color: "cyan"
    }).start()
  }

  /**
   * Exibe resumo final da operação.
   */
  showOperationSummary(updatedFiles: string[], failedFiles: string[]): void {
    console.log(chalk.cyan.bold("\n📊 Resumo da Operação"))
    console.log(chalk.gray("═".repeat(50)))

    if (updatedFiles.length > 0) {
      console.log(chalk.green.bold(`\n✅ ${updatedFiles.length} arquivo(s) atualizado(s) com sucesso:`))
      updatedFiles.forEach(file => {
        console.log(chalk.green(`   ✓ ${this.getRelativePath(file)}`))
      })
    }

    if (failedFiles.length > 0) {
      console.log(chalk.red.bold(`\n❌ ${failedFiles.length} arquivo(s) com erro:`))
      failedFiles.forEach(file => {
        console.log(chalk.red(`   ✗ ${this.getRelativePath(file)}`))
      })
    }

    if (updatedFiles.length === 0 && failedFiles.length === 0) {
      console.log(chalk.yellow("ℹ️  Nenhum arquivo foi processado."))
    }

    // Box final
    const totalFiles = updatedFiles.length + failedFiles.length
    const successRate = totalFiles > 0 ? Math.round((updatedFiles.length / totalFiles) * 100) : 0

    const finalMessage = boxen(
      chalk.white.bold("🎯 Operação Concluída") + "\n\n" +
      chalk.cyan(`Taxa de sucesso: ${successRate}%`) + "\n" +
      chalk.cyan(`Arquivos processados: ${totalFiles}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: updatedFiles.length > 0 ? "green" : "yellow",
        align: "center"
      }
    )

    console.log(finalMessage)
  }

  /**
   * Exibe mensagem de sucesso.
   */
  showSuccess(message: string): void {
    const successBox = boxen(
      chalk.green.bold("✅ " + message),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        align: "center"
      }
    )
    console.log(successBox)
  }

  /**
   * Exibe mensagem de erro.
   */
  showError(message: string): void {
    const errorBox = boxen(
      chalk.red.bold("❌ " + message),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        align: "center"
      }
    )
    console.log(errorBox)
  }

  /**
   * Exibe mensagem de aviso.
   */
  showWarning(message: string): void {
    const warningBox = boxen(
      chalk.yellow.bold("⚠️  " + message),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "yellow",
        align: "center"
      }
    )
    console.log(warningBox)
  }

  /**
   * Exibe informações de ajuda visual.
   */
  showHelp(): void {
    console.clear()

    const helpTitle = figlet.textSync("HELP", {
      font: "Small",
      horizontalLayout: "default",
    })

    console.log(chalk.cyan.bold(helpTitle))
    console.log(chalk.gray("─".repeat(80)))

    const sections = [
      {
        title: "📋 DESCRIÇÃO",
        content: "Esta ferramenta ajuda a gerenciar portas de banco de dados em múltiplos\nprojetos C# e React, permitindo trocar rapidamente entre diferentes\nambientes de desenvolvimento."
      },
      {
        title: "⚡ FUNCIONALIDADES",
        content: "• Gerenciamento de múltiplos ambientes (dev, test, prod, etc.)\n• Busca automática por arquivos databasesettings.json\n• Atualização automática de portas em connection strings\n• Backup automático dos arquivos originais\n• Preview das mudanças antes da execução"
      },
      {
        title: "🔧 COMANDOS",
        content: "npm start          - Executa a aplicação\nnpm run dev        - Executa em modo desenvolvimento\nnpm run build      - Compila TypeScript\nnpm run watch      - Compila em modo watch"
      },
      {
        title: "⌨️  CONTROLES",
        content: "s/sim/y/yes - Confirma operação\nn/não/no    - Cancela operação\nq           - Sair do programa\n0           - Adicionar novo ambiente"
      }
    ]

    sections.forEach(section => {
      console.log(chalk.cyan.bold(`\n${section.title}`))
      console.log(chalk.white(section.content))
    })

    const footer = boxen(
      chalk.gray("Para mais informações, visite: ") +
      chalk.blue("https://github.com/fabioivan/env-sync"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
        align: "center"
      }
    )

    console.log(footer)
  }

  /**
   * Converte caminho absoluto em relativo mais legível.
   */
  private getRelativePath(fullPath: string): string {
    const homePath = require("os").homedir()
    if (fullPath.startsWith(homePath)) {
      return "~" + fullPath.substring(homePath.length)
    }
    return fullPath
  }

  /**
   * Exibe ambiente selecionado.
   */
  showSelectedEnvironment(environment: Environment): void {
    const selectedBox = boxen(
      chalk.green.bold("✅ Ambiente Selecionado") + "\n\n" +
      chalk.white.bold("Nome: ") + chalk.cyan(environment.name) + "\n" +
      chalk.white.bold("URL: ") + chalk.blue(environment.url) + "\n" +
      chalk.white.bold("Porta: ") + chalk.yellow(environment.port) + "\n" +
      chalk.white.bold("Usuário: ") + chalk.magenta(environment.username),
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        align: "center"
      }
    )

    console.log(selectedBox)
  }

  /**
   * Limpa a tela.
   */
  clear(): void {
    console.clear()
  }

  /**
   * Adiciona espaçamento.
   */
  addSpacing(lines: number = 1): void {
    console.log("\n".repeat(lines - 1))
  }
}