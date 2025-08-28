import * as fs from "fs"
import * as path from "path"
import { Environment } from "./config-manager"

export class LastEnvironmentManager {
  private readonly lastEnvFile: string

  constructor() {
    const configDir = path.join(process.env.HOME || process.env.USERPROFILE || "", ".env-sync")
    this.lastEnvFile = path.join(configDir, "last-environment.json")

    // Garante que o diretório existe
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
  }

  /**
   * Salva o último ambiente utilizado
   */
  saveLastEnvironment(environment: Environment): void {
    try {
      const data = {
        lastUsed: new Date().toISOString(),
        environment: environment,
      }

      fs.writeFileSync(this.lastEnvFile, JSON.stringify(data, null, 2), "utf8")
    } catch (error) {
      console.error(`Erro ao salvar último ambiente: ${error}`)
    }
  }

  /**
   * Recupera o último ambiente utilizado
   */
  getLastEnvironment(): Environment | null {
    try {
      if (!fs.existsSync(this.lastEnvFile)) {
        return null
      }

      const data = JSON.parse(fs.readFileSync(this.lastEnvFile, "utf8"))

      // Verifica se o arquivo tem a estrutura esperada
      if (data.environment && data.environment.name) {
        return data.environment as Environment
      }

      return null
    } catch (error) {
      console.error(`Erro ao recuperar último ambiente: ${error}`)
      return null
    }
  }

  /**
   * Verifica se existe um último ambiente salvo
   */
  hasLastEnvironment(): boolean {
    return this.getLastEnvironment() !== null
  }

  /**
   * Remove o último ambiente salvo
   */
  clearLastEnvironment(): void {
    try {
      if (fs.existsSync(this.lastEnvFile)) {
        fs.unlinkSync(this.lastEnvFile)
      }
    } catch (error) {
      console.error(`Erro ao limpar último ambiente: ${error}`)
    }
  }

  /**
   * Obtém informações sobre quando foi usado pela última vez
   */
  getLastUsedDate(): Date | null {
    try {
      if (!fs.existsSync(this.lastEnvFile)) {
        return null
      }

      const data = JSON.parse(fs.readFileSync(this.lastEnvFile, "utf8"))

      if (data.lastUsed) {
        return new Date(data.lastUsed)
      }

      return null
    } catch (error) {
      console.error(`Erro ao recuperar data do último uso: ${error}`)
      return null
    }
  }
}
