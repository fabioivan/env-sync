import * as fs from "fs"
import * as path from "path"
import * as os from "os"

/**
 * Interface para definir um ambiente de configuração
 */
export interface Environment {
  name: string
  url: string
  port: string
  username: string
  password: string
}

/**
 * Interface para o arquivo de configuração
 */
interface ConfigFile {
  environments: Environment[]
}

/**
 * Gerencia as configurações de ambiente para conexões de banco de dados.
 */
export class ConfigManager {
  private readonly configDir: string
  private readonly configFile: string

  constructor() {
    this.configDir = path.join(os.homedir(), ".env-sync")
    this.configFile = path.join(this.configDir, "environments.json")
    this.ensureConfigDir()
  }

  /**
   * Garante que o diretório de configuração existe.
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true })
    }
  }

  /**
   * Carrega as configurações de ambiente do arquivo JSON.
   */
  loadEnvironments(): ConfigFile {
    if (!fs.existsSync(this.configFile)) {
      return { environments: [] }
    }

    try {
      const content = fs.readFileSync(this.configFile, "utf-8")
      return JSON.parse(content) as ConfigFile
    } catch (error) {
      console.error(`Erro ao carregar configurações: ${error}`)
      return { environments: [] }
    }
  }

  /**
   * Salva as configurações de ambiente no arquivo JSON.
   */
  saveEnvironments(config: ConfigFile): void {
    try {
      const content = JSON.stringify(config, null, 4)
      fs.writeFileSync(this.configFile, content, "utf-8")
    } catch (error) {
      console.error(`Erro ao salvar configurações: ${error}`)
    }
  }

  /**
   * Adiciona um novo ambiente de configuração.
   */
  addEnvironment(
    name: string,
    url: string,
    port: string,
    username: string,
    password: string,
  ): boolean {
    const config = this.loadEnvironments()

    // Verifica se o ambiente já existe
    const existingEnv = config.environments.find((env) => env.name === name)
    if (existingEnv) {
      console.log(`Ambiente '${name}' já existe!`)
      return false
    }

    const newEnv: Environment = {
      name,
      url,
      port,
      username,
      password,
    }

    config.environments.push(newEnv)
    this.saveEnvironments(config)
    console.log(`Ambiente '${name}' adicionado com sucesso!`)
    return true
  }

  /**
   * Lista todos os ambientes configurados.
   */
  listEnvironments(): Environment[] {
    const config = this.loadEnvironments()
    return config.environments
  }

  /**
   * Obtém um ambiente específico pelo nome.
   */
  getEnvironment(name: string): Environment | undefined {
    const environments = this.listEnvironments()
    return environments.find((env) => env.name === name)
  }

  /**
   * Verifica se há ambientes configurados.
   */
  hasEnvironments(): boolean {
    const environments = this.listEnvironments()
    return environments.length > 0
  }

  /**
   * Remove um ambiente de configuração.
   */
  deleteEnvironment(name: string): boolean {
    const config = this.loadEnvironments()
    const originalCount = config.environments.length

    config.environments = config.environments.filter((env) => env.name !== name)

    if (config.environments.length < originalCount) {
      this.saveEnvironments(config)
      console.log(`Ambiente '${name}' removido com sucesso!`)
      return true
    } else {
      console.log(`Ambiente '${name}' não encontrado!`)
      return false
    }
  }

  /**
   * Atualiza um ambiente existente.
   */
  updateEnvironment(name: string, updates: Partial<Environment>): boolean {
    const config = this.loadEnvironments()
    const envIndex = config.environments.findIndex((env) => env.name === name)

    if (envIndex === -1) {
      console.log(`Ambiente '${name}' não encontrado!`)
      return false
    }

    config.environments[envIndex] = { ...config.environments[envIndex], ...updates }
    this.saveEnvironments(config)
    console.log(`Ambiente '${name}' atualizado com sucesso!`)
    return true
  }
}
