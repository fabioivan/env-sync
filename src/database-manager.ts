import { Client } from "pg"
import chalk from "chalk"

export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database?: string
}

export interface DatabaseInfo {
  databaseName: string
  clientName: string
}

export interface UserInfo {
  id: string
  login: string
  name: string
  password: string
}

export class DatabaseManager {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  /**
   * Busca as bases que começam com 'hemp' e não terminam com 'vdi' ou 'paygw'
   */
  async getHempDatabases(): Promise<DatabaseInfo[]> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: "postgres",
    })

    try {
      await client.connect()

      const databasesQuery = `
        SELECT datname as database_name
        FROM pg_database
        WHERE datname LIKE 'hemp%'
        AND datname NOT LIKE '%vdi'
        AND datname NOT LIKE '%paygw'
        AND datistemplate = false
        ORDER BY datname;
      `

      const databasesResult = await client.query(databasesQuery)
      const databases = databasesResult.rows.map((row) => row.database_name)

      if (databases.length === 0) {
        return []
      }

      await client.end()

      const databaseInfos: DatabaseInfo[] = []

      for (const dbName of databases) {
        try {
          const dbClient = new Client({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: dbName,
          })

          await dbClient.connect()

          const clientQuery = `
            SELECT name_2 as client_name
            FROM companies
            LIMIT 1;
          `

          const clientResult = await dbClient.query(clientQuery)
          const clientName =
            clientResult.rows.length > 0
              ? clientResult.rows[0].client_name
              : "Cliente não encontrado"

          databaseInfos.push({
            databaseName: dbName,
            clientName: clientName,
          })

          await dbClient.end()
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Erro ao acessar database ${dbName}: ${error}`))
          databaseInfos.push({
            databaseName: dbName,
            clientName: "Erro ao buscar cliente",
          })
        }
      }

      return databaseInfos
    } catch (error) {
      await client.end()
      throw new Error(`Erro ao conectar no banco de dados: ${error}`)
    }
  }

  /**
   * Testa a conexão com o banco de dados
   */
  async testConnection(): Promise<boolean> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: "postgres",
    })

    try {
      await client.connect()
      await client.query("SELECT 1")
      await client.end()
      return true
    } catch (error) {
      await client.end()
      return false
    }
  }

  /**
   * Busca usuários ativos e não deletados de uma base específica
   */
  async getActiveUsers(databaseName: string): Promise<UserInfo[]> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: databaseName,
    })

    try {
      await client.connect()

      const usersQuery = `
        SELECT
          u.id,
          u.login,
          u.name,
          u.password
        FROM users u
        WHERE u.active = true
        AND u.deleted = false
        ORDER BY u.id;
      `

      const result = await client.query(usersQuery)
      await client.end()

      return result.rows.map(row => ({
        id: row.id,
        login: row.login,
        name: row.name,
        password: row.password,
      }))
    } catch (error) {
      await client.end()
      throw new Error(`Erro ao buscar usuários da base ${databaseName}: ${error}`)
    }
  }

  /**
   * Busca usuários por login (busca parcial)
   */
  async searchUsersByLogin(databaseName: string, searchTerm: string): Promise<UserInfo[]> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: databaseName,
    })

    try {
      await client.connect()

      const searchQuery = `
        SELECT
          u.id,
          u.login,
          u.name,
          u.password
        FROM users u
        WHERE u.active = true
        AND u.deleted = false
        AND LOWER(u.login) ILIKE LOWER($1)
        ORDER BY u.id;
      `

      const result = await client.query(searchQuery, [`%${searchTerm}%`])
      await client.end()

      return result.rows.map(row => ({
        id: row.id,
        login: row.login,
        name: row.name,
        password: row.password,
      }))
    } catch (error) {
      await client.end()
      throw new Error(`Erro ao buscar usuários por login na base ${databaseName}: ${error}`)
    }
  }
}
