# 🔧 Env-Sync - Gerenciador de Configurações de Banco de Dados

Uma ferramenta Node.js/TypeScript para gerenciar portas de banco de dados em múltiplos projetos C# e React, permitindo trocar rapidamente entre diferentes ambientes de desenvolvimento.

## 📋 Funcionalidades

- **Gerenciamento de Ambientes**: Salve múltiplos ambientes (desenvolvimento, teste, produção)
- **Busca Automática**: Encontra todos os arquivos `databasesettings.json` na sua pasta home
- **Atualização Inteligente**: Identifica e atualiza connection strings automaticamente
- **Backup de Segurança**: Cria backup automático antes de modificar arquivos
- **Prévia de Mudanças**: Mostra exatamente o que será alterado antes da execução
- **Interface Amigável**: Interface de linha de comando simples e intuitiva

## 🚀 Instalação

1. Clone ou baixe o projeto:
```bash
git clone <url-do-repositorio>
cd env-sync
```

2. Certifique-se de ter Node.js 16+ instalado:
```bash
node --version
npm --version
```

3. Instale as dependências:
```bash
npm install
```

4. Compile o projeto:
```bash
npm run build
```

## 📖 Como Usar

### Primeira Execução

Execute o programa:
```bash
npm start
```

Ou para desenvolvimento:
```bash
npm run dev
```

Na primeira execução, você será solicitado a configurar seu primeiro ambiente:
- **Nome do ambiente**: ex: "Desenvolvimento Local"
- **URL do ambiente**: ex: "localhost"
- **Porta do banco**: ex: "5432"
- **Usuário do banco**: ex: "postgres"
- **Senha do banco**: ex: "senha123"

### Execuções Subsequentes

1. **Selecione um Ambiente**: Escolha entre os ambientes configurados
2. **Visualize a Prévia**: Veja quais arquivos serão modificados
3. **Confirme a Operação**: Digite 's' para continuar ou 'n' para cancelar
4. **Acompanhe o Resultado**: Veja o resumo das alterações realizadas

### Gerenciamento de Ambientes

- **Adicionar Ambiente**: Durante a seleção, escolha a opção "0"
- **Configurações Salvas**: Localizadas em `~/.env-sync/environments.json`

## 📁 Estrutura de Arquivos

```
env-sync/
├── src/
│   ├── main.ts              # Interface principal
│   ├── config-manager.ts    # Gerenciamento de configurações
│   ├── file-finder.ts       # Busca e manipulação de arquivos
│   ├── port-updater.ts      # Atualização de portas
│   └── input-handler.ts     # Manipulação de entrada do usuário
├── dist/                    # Arquivos JavaScript compilados
├── package.json             # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
└── README.md               # Este arquivo
```

## 🔍 Formatos de Connection String Suportados

A ferramenta reconhece e atualiza os seguintes formatos:

```json
{
  "ConnectionString": "Server=localhost;Port=5432;Database=mydb;User Id=user;Password=pass;"
}
```

```json
{
  "Database": {
    "Connection": "Data Source=localhost:5432;Initial Catalog=mydb;User ID=user;Password=pass;"
  }
}
```

```json
{
  "Settings": {
    "DbConnection": "server=localhost,5432;database=mydb;uid=user;pwd=pass;"
  }
}
```

## 🛡️ Segurança e Backup

- **Backup Automático**: Cada arquivo modificado gera um backup `.backup`
- **Validação JSON**: Verifica integridade antes de salvar
- **Operação Atômica**: Se falhar em um arquivo, os outros não são afetados

## 📋 Exemplo de Uso

```bash
$ npm start

============================================================
🔧 ENV-SYNC - Gerenciador de Configurações de Banco
============================================================

🌍 Ambientes disponíveis:
----------------------------------------
1. Desenvolvimento Local
   URL: localhost
   Porta: 5432
   Usuário: postgres

2. Teste
   URL: test-server
   Porta: 5433
   Usuário: test_user

0. Adicionar novo ambiente
q. Sair

Selecione uma opção: 1

✅ Ambiente selecionado: Desenvolvimento Local (Porta: 5432)

🔍 Prévia das mudanças:
----------------------------------------

📁 /home/user/projects/MyApp/databasesettings.json
   🔄 ConnectionString: 5433 → 5432

📁 /home/user/projects/OtherApp/config/databasesettings.json
   🔄 Database.Connection: 5433 → 5432

Total de arquivos que serão modificados: 2

==================================================
Deseja continuar com a atualização? (s/n): s

🚀 Executando atualização...
==================================================

Encontrados 2 arquivo(s). Iniciando atualização...

Processando: /home/user/projects/MyApp/databasesettings.json
Backup criado: /home/user/projects/MyApp/databasesettings.json.backup
✅ Porta atualizada em ConnectionString: 5433 → 5432
✅ Arquivo atualizado com sucesso

==================================================
📊 RESUMO DA OPERAÇÃO
==================================================
✅ 2 arquivo(s) atualizado(s) com sucesso:
   - /home/user/projects/MyApp/databasesettings.json
   - /home/user/projects/OtherApp/config/databasesettings.json

✅ Operação concluída com sucesso!
   2 arquivo(s) atualizado(s)
```

## 🆘 Ajuda

Para ver informações de ajuda:
```bash
npm start -- --help
```

Ou durante o desenvolvimento:
```bash
npm run dev -- --help
```

## 🔧 Solução de Problemas

### Arquivo não encontrado
- Verifique se o arquivo se chama exatamente `databasesettings.json`
- Certifique-se de que está na pasta home ou subpastas

### Connection string não reconhecida
- Verifique se contém palavras-chave como: `port`, `server`, `database`
- Veja os formatos suportados na documentação acima

### Erro de permissão
- Verifique se tem permissão de escrita nos arquivos
- Execute com privilégios adequados se necessário

### Backup perdido
- Os backups ficam no mesmo diretório com extensão `.backup`
- Para restaurar: `cp arquivo.json.backup arquivo.json`

## 📄 Licença

Este projeto é de uso livre. Modifique e use conforme necessário.

## 🤝 Contribuição

Sinta-se livre para reportar bugs, sugerir melhorias ou contribuir com código!
