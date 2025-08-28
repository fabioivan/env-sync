import * as readline from "node:readline"

/**
 * Classe para lidar com entrada do usuário de forma síncrona
 */
export class InputHandler {
  private rl: readline.Interface

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  /**
   * Solicita entrada do usuário com uma pergunta
   */
  async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  /**
   * Solicita confirmação do usuário (s/n)
   */
  async confirm(prompt: string): Promise<boolean> {
    while (true) {
      const answer = await this.question(prompt)
      const normalized = answer.toLowerCase()

      if (["s", "sim", "y", "yes"].includes(normalized)) {
        return true
      } else if (["n", "não", "nao", "no"].includes(normalized)) {
        return false
      } else {
        console.log("❌ Por favor, responda com 's' para sim ou 'n' para não.")
      }
    }
  }

  /**
   * Fecha a interface de entrada
   */
  close(): void {
    this.rl.close()
  }
}
