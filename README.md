# 🔧 Env-Sync - Gerenciador de Configurações de Banco de Dados

Uma ferramenta Node.js/TypeScript completa para gerenciar configurações de banco de dados em múltiplos projetos C# e React. Permite trocar rapidamente entre ambientes e gerar SynData para sistemas React.

## 📋 Funcionalidades

### 🔄 **Trocar Ambiente** (Gerenciamento de Portas)
- **Gerenciamento de Ambientes**: Salve múltiplos ambientes (desenvolvimento, teste, produção)
- **Busca Automática**: Encontra todos os arquivos `databasesettings.json` na sua pasta home
- **Atualização Inteligente**: Identifica e atualiza connection strings automaticamente
- **Prévia de Mudanças**: Mostra exatamente o que será alterado antes da execução
- **Filtragem Inteligente**: Ignora arquivos de teste e configurações MySQL sem porta
- **Integração Docker**: Rebuild automático do container SynAuth quando necessário

### 🔧 **Criar SynData** (Nova Funcionalidade)
- **Conexão com Banco**: Conecta automaticamente ao PostgreSQL usando o ambiente selecionado
- **Busca de Bases Hemp**: Localiza bases que começam com `hemp` (exceto `vdi` e `paygw`)
- **Informações do Cliente**: Busca o nome do cliente na tabela `companies`
- **Geração de SynData**: Criptografa dados usando **100% compatibilidade com sistema C#**
- **Atualização de .env**: Atualiza arquivos `.env.development` na pasta `projects`
- **Último Ambiente**: Lembra do último ambiente usado para agilizar o processo
- **Criptografia Compatível**: Usa mesma classe `CryptValues` do sistema original

### 🎯 **Interface CLI Unificada**
- **Menu Intuitivo**: Interface amigável com seleção de operações
- **Fluxo Guiado**: Processo passo-a-passo para cada funcionalidade
- **Feedback Visual**: Indicadores de progresso e confirmações

## 🚀 Instalação

### 📦 Instalação Global (Recomendada)

```bash
# Instala globalmente via NPM
npm install -g @fabioivan/env-sync

# Verifica a instalação
env-sync --help

# Usa a ferramenta de qualquer diretório
env-sync
```

### 🔧 Instalação para Desenvolvimento

1. Clone o projeto:
```bash
git clone https://github.com/fabioivan/env-sync.git
cd env-sync
```

2. Certifique-se de ter Node.js 16+ instalado:
```bash
node --version
npm --version
```

3. Configure o comando global para desenvolvimento:
```bash
npm run setup:global
```

4. Teste a instalação:
```bash
env-sync --help
```

## 📖 Como Usar

### Execução Principal

Execute o programa (instalação global):
```bash
env-sync
```

Ou durante desenvolvimento:
```bash
npm run dev
```

O programa exibirá um menu com duas opções:

#### 🔄 **Trocar Ambiente**
- Altera a porta do banco de dados em todos os arquivos `databasesettings.json`
- Mostra preview das mudanças antes de aplicar
- Oferece rebuild automático do Docker para projetos SynAuth

#### 🔧 **Criar SynData** 
- Conecta no banco do ambiente selecionado
- Lista bases que começam com `hemp`
- Permite selecionar uma base específica
- Gera SynData criptografado compatível com C#
- Atualiza todos os arquivos `.env.development` com `REACT_APP_SYNDATA`

### Comandos Disponíveis

```bash
# Comando principal
env-sync

# Lista ambientes
env-sync list

# Adiciona ambiente
env-sync add

# Remove ambiente  
env-sync remove "Nome do Ambiente"

# Ajuda
env-sync --help

# Versão
env-sync --version
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

## 🛡️ Segurança

- **Validação JSON**: Verifica integridade antes de salvar
- **Operação Atômica**: Se falhar em um arquivo, os outros não são afetados

## 📋 Exemplo de Uso

```bash
$ env-sync

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

## 🔐 Compatibilidade da Criptografia

A funcionalidade **"Criar SynData"** utiliza **100% compatibilidade** com o sistema C# original:

### ✅ **Características Garantidas:**
- **Mesmo algoritmo de criptografia** do sistema C#
- **Mesmos valores de salt e secret** 
- **Formato idêntico** dos dados criptografados
- **Interoperabilidade total** entre sistemas

### 🔧 **Classe CryptValues Convertida:**
```typescript
// Valores exatos do sistema C# original
private _salt = "0UgQLJiESKyELbVqsgrLJsFXSIF";
private _secret = "parangaricutirimirruaro";

// Algoritmo: Base64(Base64(MD5(salt)):Base64(Base64(input)):Base64(MD5(secret)))
```

### 📋 **Para Mais Detalhes:**
Consulte o arquivo [`CRYPTO_COMPATIBILITY.md`](./CRYPTO_COMPATIBILITY.md) para documentação técnica completa sobre a implementação da criptografia.

## 🆘 Ajuda

Para ver informações de ajuda:
```bash
env-sync --help
```

Ou durante o desenvolvimento:
```bash
npm run dev -- --help
```

### Desinstalação

Para remover a ferramenta:
```bash
npm uninstall -g @fabioivan/env-sync
```

### 📦 Para Desenvolvimento e Publicação:
```bash
# Testa se está pronto para publicar
npm run test:npm

# Publica nova versão (com incremento automático)
npm run publish

# Comandos manuais alternativos:
npm run version:patch    # Incrementa versão patch
npm run version:minor    # Incrementa versão minor
npm run version:major    # Incrementa versão major
npm publish             # Publica versão atual
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
