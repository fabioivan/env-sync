# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2024-12-XX

### 🎉 Primeira Release

#### ✨ Funcionalidades Adicionadas
- **Gerenciamento de Ambientes**: Sistema completo para gerenciar múltiplos ambientes de banco de dados
- **Detecção Automática**: Busca automática por arquivos `databasesettings.json` na pasta home
- **Filtros Inteligentes**: 
  - Ignora pastas de teste (contendo "test")
  - Ignora arquivos MySQL (todos os providers MySQL)
  - Ignora arquivos sem porta configurada
- **Atualização de Portas**: Suporte a múltiplos formatos de connection string
- **Prévia de Mudanças**: Mostra exatamente o que será alterado antes da execução
- **Integração Docker**: Detecção automática e rebuild do container SynAuth
- **Detecção de Versão Docker**: Suporte automático para `docker compose` vs `docker-compose`
- **Interface CLI**: Interface de linha de comando amigável em português
- **Comando Global**: Disponível globalmente via `env-sync`

#### 🐳 Funcionalidades Docker
- **Detecção SynAuth**: Identifica automaticamente mudanças no projeto SynAuth
- **Rebuild Automático**: Oferece rebuild do container quando porta é alterada
- **Compatibilidade Universal**: Funciona com Docker moderno e clássico
- **Busca Inteligente**: Localiza `docker-compose.yml`, `docker-compose.yaml` ou `Dockerfile`
- **Execução Silenciosa**: Rebuild sem logs de build, apenas resultado final

#### 🔧 Tecnologias
- **Node.js**: Runtime JavaScript
- **TypeScript**: Tipagem estática
- **Commander**: Interface CLI
- **Chalk**: Cores no terminal
- **Ora**: Indicadores de progresso
- **Figlet**: ASCII art para banner

#### 📦 Configuração NPM
- **Pacote Scoped**: `@fabioivan/env-sync`
- **Comando Global**: `env-sync`
- **Build Automático**: Scripts de build para produção
- **Shebang**: Configuração automática para execução
- **Permissões**: Configuração automática de arquivo executável

#### 🎯 Formatos Suportados
- **Connection Strings**:
  - PostgreSQL: `Server=localhost;Port=5432;Database=...`
  - SQL Server: `Data Source=localhost:5432;Initial Catalog=...`
- **Docker**:
  - `docker-compose.yml` / `docker-compose.yaml`
  - `Dockerfile` standalone
  - Detecção automática de comandos (`docker compose` vs `docker-compose`)

#### 🛡️ Segurança e Confiabilidade
- **Validação**: Verificação de integridade JSON antes de salvar
- **Tratamento de Erros**: Manejo robusto de erros e exceções
- **Operação Atômica**: Se um arquivo falhar, outros não são afetados

### 📋 Requisitos
- Node.js >= 16.0.0
- NPM >= 7.0.0
- Docker (opcional, para funcionalidade SynAuth)

### 🚀 Instalação
```bash
npm install -g @fabioivan/env-sync
```

### 📖 Uso
```bash
env-sync
```
