import * as fs from "fs"
import * as path from "path"

/**
 * Gerencia operações Docker para projetos específicos.
 */
export class DockerManager {
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
   * Informa sobre o restart do container do SynAuth e confirma automaticamente.
   */
  async askForSynAuthRestart() {
    console.log("\n🐳 DOCKER - Projeto SynAuth")
    console.log("=".repeat(40))
    console.log("A porta do projeto SynAuth foi alterada.")
    console.log("É necessário rebuild do container Docker para aplicar as mudanças.")
    console.log("🔄 Executando rebuild automaticamente...")
    console.log()
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
   * Verifica informações do Docker instalado.
   */
  private async checkDockerInfo(): Promise<{
    docker: boolean
    compose: string | null
    version: string | null
  }> {
    const { execSync } = await import("child_process")

    let dockerVersion = null
    let composeCommand = null

    // Verifica se Docker está instalado
    try {
      const output = execSync("docker --version", { stdio: "pipe", encoding: "utf-8" })
      dockerVersion = output.trim()
    } catch {
      return { docker: false, compose: null, version: null }
    }

    // Verifica comando Docker Compose
    try {
      execSync("docker compose version", { stdio: "pipe" })
      composeCommand = "docker compose"
    } catch {
      try {
        execSync("docker-compose version", { stdio: "pipe" })
        composeCommand = "docker-compose"
      } catch {
        // Docker está instalado mas Compose não
      }
    }

    return {
      docker: true,
      compose: composeCommand,
      version: dockerVersion,
    }
  }

  /**
   * Verifica qual comando Docker Compose usar (docker compose vs docker-compose).
   */
  private async getDockerComposeCommand(): Promise<string> {
    const dockerInfo = await this.checkDockerInfo()

    if (!dockerInfo.docker) {
      throw new Error("Docker não está instalado ou não está no PATH")
    }

    if (!dockerInfo.compose) {
      throw new Error(
        "Docker Compose não está disponível (nem 'docker compose' nem 'docker-compose')",
      )
    }

    return dockerInfo.compose
  }

  /**
   * Tenta rebuild usando docker-compose.
   */
  private async tryDockerCompose(projectRoot: string): Promise<boolean> {
    const { execSync } = await import("child_process")

    const dockerComposePath = path.join(projectRoot, "docker-compose.yml")
    const dockerCompose2Path = path.join(projectRoot, "docker-compose.yaml")

    console.log("📁 Verificando arquivos Docker Compose...")
    console.log("   docker-compose.yml:", fs.existsSync(dockerComposePath) ? "✅" : "❌")
    console.log("   docker-compose.yaml:", fs.existsSync(dockerCompose2Path) ? "✅" : "❌")

    let composeFile = ""
    if (fs.existsSync(dockerComposePath)) {
      composeFile = dockerComposePath
    } else if (fs.existsSync(dockerCompose2Path)) {
      composeFile = dockerCompose2Path
    } else {
      return false
    }

    try {
      // Verifica informações do Docker
      const dockerInfo = await this.checkDockerInfo()
      console.log("🐳 Informações do Docker:")
      console.log(`   Versão: ${dockerInfo.version}`)
      console.log(`   Compose: ${dockerInfo.compose}`)

      // Detecta o comando Docker Compose correto
      const dockerComposeCmd = await this.getDockerComposeCommand()
      console.log(`🚀 Executando: ${dockerComposeCmd}`)

      console.log("⏹️  Parando containers...")
      // Para os containers
      execSync(`${dockerComposeCmd} -f "${composeFile}" down`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      console.log("🔄 Rebuild e reinicializando containers...")
      // Rebuild e reinicia
      execSync(`${dockerComposeCmd} -f "${composeFile}" up --build -d`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      return true
    } catch (error) {
      console.log(`❌ Erro no Docker Compose: ${error}`)
      return false
    }
  }

  /**
   * Tenta rebuild usando Dockerfile direto.
   */
  private async tryDockerfile(projectRoot: string): Promise<boolean> {
    const { execSync } = await import("child_process")

    const dockerfilePath = path.join(projectRoot, "Dockerfile")

    console.log("📁 Verificando Dockerfile...")
    console.log(`   ${dockerfilePath}:`, fs.existsSync(dockerfilePath) ? "✅" : "❌")

    if (!fs.existsSync(dockerfilePath)) {
      return false
    }

    try {
      // Verifica informações do Docker
      const dockerInfo = await this.checkDockerInfo()

      if (!dockerInfo.docker) {
        console.log("❌ Docker não está disponível")
        return false
      }

      console.log("🐳 Informações do Docker:")
      console.log(`   Versão: ${dockerInfo.version}`)

      // Nome da imagem baseado no diretório
      const imageName = `synauth-${path.basename(projectRoot).toLowerCase()}`
      console.log(`🏷️  Nome da imagem: ${imageName}`)

      console.log("🔨 Construindo imagem...")
      // Build da imagem
      execSync(`docker build -t ${imageName} .`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      console.log("⏹️  Parando container existente (se houver)...")
      // Para container existente se houver
      try {
        execSync(`docker stop ${imageName}`, { stdio: "pipe" })
        execSync(`docker rm ${imageName}`, { stdio: "pipe" })
      } catch {
        // Ignora erro se container não existir
      }

      console.log("🚀 Iniciando novo container...")
      // Inicia novo container
      execSync(`docker run -d --name ${imageName} ${imageName}`, {
        cwd: projectRoot,
        stdio: "pipe", // Não mostra output
      })

      return true
    } catch (error) {
      console.log(`❌ Erro no Docker: ${error}`)
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
