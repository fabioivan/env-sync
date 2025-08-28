import * as fs from "node:fs"
import * as path from "node:path"

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

    let currentDir = path.dirname(filePath)
    const maxLevels = 10

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
        break
      }
      currentDir = parentDir
    }

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

      if (await this.tryDockerCompose(projectRoot)) {
        console.log("✅ Container SynAuth reiniciado com sucesso!")
        return true
      }

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

    try {
      const output = execSync("docker --version", { stdio: "pipe", encoding: "utf-8" })
      dockerVersion = output.trim()
    } catch {
      return { docker: false, compose: null, version: null }
    }

    try {
      execSync("docker compose version", { stdio: "pipe" })
      composeCommand = "docker compose"
    } catch {
      try {
        execSync("docker-compose version", { stdio: "pipe" })
        composeCommand = "docker-compose"
      } catch {
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
      const dockerInfo = await this.checkDockerInfo()
      console.log("🐳 Informações do Docker:")
      console.log(`   Versão: ${dockerInfo.version}`)
      console.log(`   Compose: ${dockerInfo.compose}`)

      const dockerComposeCmd = await this.getDockerComposeCommand()
      console.log(`🚀 Executando: ${dockerComposeCmd}`)

      console.log("⏹️  Parando containers...")
      execSync(`${dockerComposeCmd} -f "${composeFile}" down`, {
        cwd: projectRoot,
        stdio: "pipe",
      })

      console.log("🔄 Rebuild e reinicializando containers...")
      execSync(`${dockerComposeCmd} -f "${composeFile}" up --build -d`, {
        cwd: projectRoot,
        stdio: "pipe",
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
      const dockerInfo = await this.checkDockerInfo()

      if (!dockerInfo.docker) {
        console.log("❌ Docker não está disponível")
        return false
      }

      console.log("🐳 Informações do Docker:")
      console.log(`   Versão: ${dockerInfo.version}`)

      const imageName = `synauth-${path.basename(projectRoot).toLowerCase()}`
      console.log(`🏷️  Nome da imagem: ${imageName}`)

      console.log("🔨 Construindo imagem...")
        execSync(`docker build -t ${imageName} .`, {
        cwd: projectRoot,
        stdio: "pipe",
      })

      console.log("⏹️  Parando container existente (se houver)...")
      try {
        execSync(`docker stop ${imageName}`, { stdio: "pipe" })
        execSync(`docker rm ${imageName}`, { stdio: "pipe" })
      } catch {
      }

      console.log("🚀 Iniciando novo container...")
      execSync(`docker run -d --name ${imageName} ${imageName}`, {
        cwd: projectRoot,
        stdio: "pipe",
      })

      return true
    } catch (error) {
      console.log(`❌ Erro no Docker: ${error}`)
      return false
    }
  }
}
