import * as fs from "fs"
import * as path from "path"
import { InputHandler } from "./input-handler"

/**
 * Gerencia operações Docker para projetos específicos.
 */
export class DockerManager {
  private inputHandler: InputHandler

  constructor(inputHandler: InputHandler) {
    this.inputHandler = inputHandler
  }

  /**
   * Verifica se um arquivo é do projeto SynAuth.
   */
  isSynAuthProject(filePath: string): boolean {
    return filePath.toLowerCase().includes("synauth")
  }

  /**
   * Encontra o diretório raiz do projeto SynAuth baseado no arquivo de configuração.
   */
  findSynAuthProjectRoot(filePath: string): string | null {
    if (!this.isSynAuthProject(filePath)) {
      return null
    }

    // Navega até encontrar docker-compose ou Dockerfile
    let currentDir = path.dirname(filePath)
    const maxLevels = 10 // Limite de níveis para evitar loop infinito

    for (let i = 0; i < maxLevels; i++) {
      const dockerComposePath = path.join(currentDir, "docker-compose.yml")
      const dockerCompose2Path = path.join(currentDir, "docker-compose.yaml")
      const dockerfilePath = path.join(currentDir, "Dockerfile")

      if (
        fs.existsSync(dockerComposePath) ||
        fs.existsSync(dockerCompose2Path) ||
        fs.existsSync(dockerfilePath)
      ) {
        return currentDir
      }

      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) {
        // Chegou na raiz do sistema
        break
      }
      currentDir = parentDir
    }

    // Se não encontrou, usa o diretório pai dos fontes como fallback
    const pathParts = filePath.split(path.sep)
    const synAuthIndex = pathParts.findIndex((part) => part.toLowerCase().includes("synauth"))

    if (synAuthIndex >= 0) {
      return pathParts.slice(0, synAuthIndex + 1).join(path.sep)
    }

    return null
  }

  /**
   * Pergunta ao usuário se deseja reiniciar o container do SynAuth.
   */
  async askForSynAuthRestart(): Promise<boolean> {
    console.log("\n🐳 DOCKER - Projeto SynAuth")
    console.log("=".repeat(40))
    console.log("A porta do projeto SynAuth foi alterada.")
    console.log("É necessário rebuild do container Docker para aplicar as mudanças.")
    console.log()

    return await this.inputHandler.confirm("Deseja fazer o rebuild do container SynAuth? (s/n): ")
  }

  /**
   * Executa o rebuild do container Docker do SynAuth.
   */
  async rebuildSynAuthContainer(projectRoot: string): Promise<boolean> {
    try {
      console.log("\n🔄 Iniciando rebuild do container SynAuth...")
      console.log("📁 Diretório do projeto:", projectRoot)

      // Primeiro tenta docker-compose
      if (await this.tryDockerCompose(projectRoot)) {
        console.log("✅ Container SynAuth reiniciado com sucesso!")
        return true
      }

      // Se não funcionar, tenta Dockerfile direto
      if (await this.tryDockerfile(projectRoot)) {
        console.log("✅ Container SynAuth reiniciado com sucesso!")
        return true
      }

      console.log("❌ Não foi possível encontrar configuração Docker no projeto.")
      return false
    } catch (error) {
      console.error(`❌ Erro ao reiniciar container: ${error}`)
      return false
    }
  }

  /**
   * Tenta rebuild usando docker-compose.
   */
  private async tryDockerCompose(projectRoot: string): Promise<boolean> {
    const { execSync } = await import("child_process")

    const dockerComposePath = path.join(projectRoot, "docker-compose.yml")
    const dockerCompose2Path = path.join(projectRoot, "docker-compose.yaml")

    let composeFile = ""
    if (fs.existsSync(dockerComposePath)) {
      composeFile = dockerComposePath
    } else if (fs.existsSync(dockerCompose2Path)) {
      composeFile = dockerCompose2Path
    } else {
      return false
    }

    try {
      // Para os containers
      execSync(`docker-compose -f "${composeFile}" down`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      // Rebuild e reinicia
      execSync(`docker-compose -f "${composeFile}" up --build -d`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Tenta rebuild usando Dockerfile direto.
   */
  private async tryDockerfile(projectRoot: string): Promise<boolean> {
    const { execSync } = await import("child_process")

    const dockerfilePath = path.join(projectRoot, "Dockerfile")

    if (!fs.existsSync(dockerfilePath)) {
      return false
    }

    try {
      // Nome da imagem baseado no diretório
      const imageName = `synauth-${path.basename(projectRoot)}`

      // Build da imagem
      execSync(`docker build -t ${imageName} .`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      // Para container existente se houver
      try {
        execSync(`docker stop ${imageName}`, { stdio: "pipe" })
        execSync(`docker rm ${imageName}`, { stdio: "pipe" })
      } catch {
        // Ignora erro se container não existir
      }

      // Inicia novo container
      execSync(`docker run -d --name ${imageName} ${imageName}`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Fecha o input handler (chama o método da instância passada).
   */
  close(): void {
    // O InputHandler será fechado pela instância principal
  }
}
