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

export class DatabaseManager {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  /**
   * Conecta no banco de dados e busca as bases que começam com 'hemp'
   * e não terminam com 'vdi' ou 'paygw', junto com o nome do cliente
   */
  async getHempDatabases(): Promise<DatabaseInfo[]> {
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: "postgres", // Conecta no banco padrão para listar databases
    })

    try {
      await client.connect()

      // Busca todas as databases que começam com hemp
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

      // Para cada database, conecta e busca o nome do cliente
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

          // Busca o nome do cliente na tabela companies
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
          // Adiciona mesmo com erro para não perder a database da lista
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
}
