import * as readline from "readline"

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
   * Solicita entrada obrigatória do usuário
   */
  async requiredInput(prompt: string, errorMessage?: string): Promise<string> {
    while (true) {
      const input = await this.question(prompt)
      if (input) {
        return input
      }
      console.log(errorMessage || "❌ Este campo é obrigatório!")
    }
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
   * Solicita seleção de uma opção numérica
   */
  async selectOption(
    prompt: string,
    maxOption: number,
    allowZero: boolean = false,
  ): Promise<number | null> {
    while (true) {
      const input = await this.question(prompt)

      if (input.toLowerCase() === "q") {
        return null
      }

      const option = parseInt(input, 10)

      if (isNaN(option)) {
        console.log("❌ Por favor, digite um número válido!")
        continue
      }

      const minOption = allowZero ? 0 : 1
      if (option >= minOption && option <= maxOption) {
        return option
      }

      console.log("❌ Opção inválida!")
    }
  }

  /**
   * Fecha a interface de entrada
   */
  close(): void {
    this.rl.close()
  }
}
