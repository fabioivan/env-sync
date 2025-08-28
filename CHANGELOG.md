# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2025-08-27

### 🎯 Funcionalidades SynData

#### ✨ Funcionalidades Adicionadas
- **Sistema SynData**: Implementação completa do sistema de geração e gestão de SynData criptografado
- **Filtro de Projetos Lerna**: Processamento limitado apenas a projetos com "lerna-repo" ou "lerna" no nome
- **Validação de Variáveis**: Verificação se a variável `REACT_APP_SYNDATA` existe antes de fazer alterações
- **Preview Inteligente**: Exibição apenas de arquivos que contêm a variável `REACT_APP_SYNDATA`
- **Gestão de Banco de Dados**: Conexão e listagem de bases disponíveis
- **Criptografia Segura**: Sistema de criptografia para proteger dados sensíveis

#### 🔍 Melhorias de Filtragem
- **Seletividade de Projetos**: Ignora projetos que não sejam relacionados ao Lerna
- **Proteção de Arquivos**: Não modifica arquivos que não possuem a variável configurada
- **Feedback Visual**: Mensagens informativas sobre arquivos processados ou ignorados
- **Processamento Eficiente**: Foca apenas nos arquivos relevantes para reduzir tempo de execução

#### 🚀 Funcionalidades do SynData
- **Geração Automática**: Criação de SynData baseado no ambiente e base de dados selecionados
- **Busca de Bases**: Conexão automática ao PostgreSQL para listar bases hemp disponíveis
- **Atualização em Lote**: Processamento de múltiplos arquivos `.env.development` simultaneamente
- **Validação de Pré-requisitos**: Verificação de condições necessárias antes da execução

#### 🛡️ Segurança e Confiabilidade
- **Criptografia Robusta**: Proteção de dados sensíveis do banco
- **Verificação de Conexão**: Testes de conectividade antes de operações críticas
- **Tratamento de Erros**: Manejo detalhado de falhas de conexão e processamento
- **Operação Seletiva**: Evita modificações desnecessárias em arquivos inadequados

### 💔 Breaking Changes
- **Filtro de Projetos**: Agora processa apenas projetos Lerna (contendo "lerna-repo" ou "lerna" no nome)
- **Comportamento de Variáveis**: Não adiciona mais a variável `REACT_APP_SYNDATA` automaticamente se ela não existir

### 🔧 Tecnologias Adicionadas
- **PostgreSQL**: Driver `pg` para conexões com banco de dados
- **Criptografia**: Sistema interno de criptografia para SynData

---

## [1.0.0] - 2025-08-22

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

