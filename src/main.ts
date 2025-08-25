#!/usr/bin/env node

/**
 * Env-Sync - Ferramenta para sincronização de configurações de banco de dados
 * Gerencia portas de banco de dados em múltiplos projetos C#/React
 */

import { ConfigManager, Environment } from "./config-manager"
import { PortUpdater } from "./port-updater"
import { InputHandler } from "./input-handler"

/**
 * Aplicação principal do Env-Sync.
 */
export class EnvSyncApp {
  private configManager: ConfigManager
  private portUpdater: PortUpdater
  private inputHandler: InputHandler

  constructor() {
    this.configManager = new ConfigManager()
    this.portUpdater = new PortUpdater()
    this.inputHandler = new InputHandler()
  }

  /**
   * Executa a aplicação principal.
   */
  async run(): Promise<void> {
    console.log("=".repeat(60))
    console.log("🔧 ENV-SYNC - Gerenciador de Configurações de Ambientes")
    console.log("=".repeat(60))
    console.log()

    try {
      // Verifica se há ambientes configurados
      if (!this.configManager.hasEnvironments()) {
        console.log("📋 Nenhum ambiente configurado encontrado.")
        console.log("Vamos configurar seu primeiro ambiente!\n")

        const success = await this.setupFirstEnvironment()
        if (!success) {
          console.log("❌ Configuração cancelada.")
          return
        }
        console.log()
      }

      // Lista ambientes e permite seleção
      const environment = await this.selectEnvironment()
      if (!environment) {
        console.log("❌ Nenhum ambiente selecionado.")
        return
      }

      // Mostra prévia das mudanças
      this.showPreview(environment.port)

      // Confirma a execução
      const shouldContinue = await this.confirmExecution()
      if (!shouldContinue) {
        console.log("❌ Operação cancelada.")
        return
      }

      // Executa a atualização
      this.executeUpdate(environment.port)
    } catch (error) {
      if (error instanceof Error && error.message === "SIGINT") {
        console.log("\n❌ Operação cancelada pelo usuário.")
      } else {
        console.error(`\n❌ Erro inesperado: ${error}`)
      }
    } finally {
      this.inputHandler.close()
    }
  }

  /**
   * Configura o primeiro ambiente.
   */
  private async setupFirstEnvironment(): Promise<boolean> {
    console.log("Por favor, forneça os dados do ambiente:")

    try {
      const name = await this.inputHandler.requiredInput("Nome do ambiente: ")
      const url = await this.inputHandler.requiredInput("URL do ambiente: ")
      const port = await this.inputHandler.requiredInput("Porta do banco: ")
      const username = await this.inputHandler.requiredInput("Usuário do banco: ")
      const password = await this.inputHandler.requiredInput("Senha do banco: ")

      // Valida a porta
      if (!PortUpdater.isValidPort(port)) {
        console.log("❌ Porta inválida! Deve ser um número entre 1 e 65535.")
        return false
      }

      return this.configManager.addEnvironment(name, url, port, username, password)
    } catch (error) {
      return false
    }
  }

  /**
   * Permite ao usuário selecionar um ambiente.
   */
  private async selectEnvironment(): Promise<Environment | null> {
    const environments = this.configManager.listEnvironments()

    if (environments.length === 0) {
      console.log("❌ Nenhum ambiente encontrado!")
      return null
    }

    console.log("🌍 Ambientes disponíveis:")
    console.log("-".repeat(40))

    environments.forEach((env, index) => {
      console.log(`${index + 1}. ${env.name}`)
      console.log(`   URL: ${env.url}`)
      console.log(`   Porta: ${env.port}`)
      console.log(`   Usuário: ${env.username}`)
      console.log()
    })

    console.log("0. Adicionar novo ambiente")
    console.log("q. Sair")
    console.log()

    while (true) {
      const choice = await this.inputHandler.selectOption(
        "Selecione uma opção: ",
        environments.length,
        true,
      )

      if (choice === null) {
        return null
      }

      if (choice === 0) {
        const added = await this.addNewEnvironment()
        if (added) {
          return this.selectEnvironment() // Recarrega a lista
        }
        continue
      }

      const selected = environments[choice - 1]
      console.log(`\n✅ Ambiente selecionado: ${selected.name} (Porta: ${selected.port})`)
      return selected
    }
  }

  /**
   * Adiciona um novo ambiente.
   */
  private async addNewEnvironment(): Promise<boolean> {
    console.log("\n📝 Adicionar novo ambiente:")
    console.log("-".repeat(30))

    try {
      const name = await this.inputHandler.requiredInput("Nome do ambiente: ")
      const url = await this.inputHandler.requiredInput("URL do ambiente: ")
      const port = await this.inputHandler.requiredInput("Porta do banco: ")
      const username = await this.inputHandler.requiredInput("Usuário do banco: ")
      const password = await this.inputHandler.requiredInput("Senha do banco: ")

      // Valida a porta
      if (!PortUpdater.isValidPort(port)) {
        console.log("❌ Porta inválida! Deve ser um número entre 1 e 65535.")
        return false
      }

      return this.configManager.addEnvironment(name, url, port, username, password)
    } catch (error) {
      console.log("\n❌ Adição cancelada.")
      return false
    }
  }

  /**
   * Mostra uma prévia das mudanças que serão feitas.
   */
  private showPreview(newPort: string): void {
    console.log("\n🔍 Prévia das mudanças:")
    console.log("-".repeat(40))

    const preview = this.portUpdater.previewChanges(newPort)

    if (Object.keys(preview).length === 0) {
      console.log(
        "ℹ️  Nenhuma mudança será feita (nenhum arquivo encontrado ou portas já estão corretas).",
      )
      return
    }

    Object.entries(preview).forEach(([filePath, changes]) => {
      console.log(`\n📁 ${filePath}`)
      changes.forEach((change) => {
        console.log(`   🔄 ${change}`)
      })
    })

    console.log(`\nTotal de arquivos que serão modificados: ${Object.keys(preview).length}`)
  }

  /**
   * Confirma se o usuário quer executar a atualização.
   */
  private async confirmExecution(): Promise<boolean> {
    console.log("\n" + "=".repeat(50))
    return await this.inputHandler.confirm("Deseja continuar com a atualização? (s/n): ")
  }

  /**
   * Executa a atualização das portas.
   */
  private executeUpdate(newPort: string): void {
    console.log("\n🚀 Executando atualização...")
    console.log("=".repeat(50))

    const result = this.portUpdater.updatePortsInAllFiles(newPort)

    console.log("\n" + "=".repeat(50))
    console.log("📊 RESUMO DA OPERAÇÃO")
    console.log("=".repeat(50))
    console.log(this.portUpdater.getSummary())

    if (result.updatedFiles.length > 0) {
      console.log("\n✅ Operação concluída com sucesso!")
      console.log(`   ${result.updatedFiles.length} arquivo(s) atualizado(s)`)
    }

    if (result.failedFiles.length > 0) {
      console.log("\n⚠️  Alguns arquivos não puderam ser atualizados:")
      console.log(`   ${result.failedFiles.length} arquivo(s) com erro`)
    }
  }

  /**
   * Mostra informações de ajuda.
   */
  showHelp(): void {
    const helpText = `
🔧 ENV-SYNC - Gerenciador de Configurações de Banco
==================================================

DESCRIÇÃO:
   Esta ferramenta ajuda a gerenciar portas de banco de dados em múltiplos
   projetos C# e React, permitindo trocar rapidamente entre diferentes
   ambientes de desenvolvimento.

FUNCIONALIDADES:
   • Gerenciamento de múltiplos ambientes (dev, test, prod, etc.)
   • Busca automática por arquivos databasesettings.json
   • Atualização automática de portas em connection strings
   • Backup automático dos arquivos originais
   • Prévia das mudanças antes da execução

FORMATO DE CONNECTION STRING SUPORTADO:
   • Server=localhost;Port=5432;Database=...
   • Data Source=localhost:5432;Initial Catalog=...
   • server=localhost,5432;database=...

USO:
   npm start

COMANDOS DURANTE A EXECUÇÃO:
   s/sim/y/yes - Confirma operação
   n/não/no    - Cancela operação
   q           - Sair do programa
   0           - Adicionar novo ambiente

DESENVOLVIMENTO:
   npm run dev     - Executa em modo desenvolvimento
   npm run build   - Compila TypeScript para JavaScript
   npm run watch   - Compila em modo watch
`
    console.log(helpText)
  }
}

/**
 * Função principal.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length > 0 && ["-h", "--help", "help"].includes(args[0])) {
    const app = new EnvSyncApp()
    app.showHelp()
    return
  }

  const app = new EnvSyncApp()
  await app.run()
}

// Executa apenas se este arquivo for executado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error("Erro fatal:", error)
    process.exit(1)
  })
}
