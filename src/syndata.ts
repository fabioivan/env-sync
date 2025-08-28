import * as crypto from "node:crypto"

/**
 * Classe utilitária para operações MD5 (equivalente ao MD5Util do C#)
 */
class MD5Util {
  /**
   * Cria hash MD5 de uma string
   */
  static create(input: string): string {
    return crypto.createHash("md5").update(input, "utf8").digest("hex")
  }
}

/**
 * Classe utilitária para operações Base64 (equivalente ao Base64Util do C#)
 */
class Base64Util {
  /**
   * Codifica string para Base64
   */
  static encode(input: string): string {
    return Buffer.from(input, "utf8").toString("base64")
  }

  /**
   * Decodifica string de Base64
   */
  static decode(input: string): string {
    return Buffer.from(input, "base64").toString("utf8")
  }
}

/**
 * Classe para criptografia (equivalente exata ao CryptValues do C#)
 */
class CryptValues {
  private _salt: string
  private _secret: string

  constructor() {
    this._salt = "0UgQLJiESKyELbVqsgrLJsFXSIF"
    this._secret = "parangaricutirimirruaro"
  }

  /**
   * Criptografa uma string usando o mesmo algoritmo do C#
   * Formato: Base64(Base64(MD5(salt)):Base64(Base64(input)):Base64(MD5(secret)))
   */
  encrypt(input: string): string {
    try {
      const saltHash = Base64Util.encode(MD5Util.create(this._salt))
      const encodedInput = Base64Util.encode(Base64Util.encode(input))
      const secretHash = Base64Util.encode(MD5Util.create(this._secret))

      const combined = `${saltHash}:${encodedInput}:${secretHash}`
      return Base64Util.encode(combined)
    } catch (error) {
      throw new Error(`Erro ao criptografar: ${error}`)
    }
  }

  /**
   * Descriptografa uma string usando o mesmo algoritmo do C#
   */
  decrypt(input: string): string | null {
    try {
      const decoded = Base64Util.decode(input)
      const parts = decoded.split(":")

      if (parts.length !== 3) {
        return null
      }

      const saltHash = Base64Util.decode(parts[0])
      const encodedInput = Base64Util.decode(Base64Util.decode(parts[1]))
      const secretHash = Base64Util.decode(parts[2])

      const expectedSaltHash = MD5Util.create(this._salt)
      const expectedSecretHash = MD5Util.create(this._secret)

      if (
        saltHash.toUpperCase() === expectedSaltHash.toUpperCase() &&
        secretHash.toUpperCase() === expectedSecretHash.toUpperCase()
      ) {
        return encodedInput
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Método estático para criptografar
   */
  static encryptInput(input: string): string {
    return new CryptValues().encrypt(input)
  }

  /**
   * Método estático para descriptografar
   */
  static decryptInput(input: string): string | null {
    return new CryptValues().decrypt(input)
  }

  /**
   * Descriptografa e deserializa JSON
   */
  decryptJson<T>(input: string): T | null {
    const decrypted = this.decrypt(input)
    if (!decrypted || decrypted.trim() === "") {
      return null
    }

    try {
      return JSON.parse(decrypted) as T
    } catch {
      return null
    }
  }
}

/**
 * Classe SynData
 */
export class SynData {
  private synHost: string
  private synDb: string

  /**
   * Construtor
   */
  constructor(host: string, db: string) {
    this.synHost = host
    this.synDb = db
  }

  /**
   * Encripta os dados para gerar o SynData
   */
  encrypt(): string {
    const crypt = new CryptValues()
    const dataObject = {
      SynDb: this.synDb,
      SynHost: this.synHost,
    }

    const jsonString = JSON.stringify(dataObject)
    return crypt.encrypt(jsonString)
  }

  /**
   * Getter para o host
   */
  get host(): string {
    return this.synHost
  }

  /**
   * Getter para a database
   */
  get database(): string {
    return this.synDb
  }

  /**
   * Método estático para descriptografar um SynData
   */
  static decrypt(encryptedSynData: string): { SynDb: string; SynHost: string } | null {
    const crypt = new CryptValues()
    const decryptedJson = crypt.decrypt(encryptedSynData)

    if (!decryptedJson) {
      return null
    }

    try {
      return JSON.parse(decryptedJson)
    } catch {
      return null
    }
  }

  /**
   * Cria uma instância SynData a partir de dados criptografados
   */
  static fromEncrypted(encryptedSynData: string): SynData | null {
    const decrypted = SynData.decrypt(encryptedSynData)
    if (!decrypted) {
      return null
    }
    return new SynData(decrypted.SynHost, decrypted.SynDb)
  }

  /**
   * Retorna uma representação string do objeto
   */
  toString(): string {
    return `SynData { Host: ${this.synHost}, Database: ${this.synDb} }`
  }
}
