# 🚀 Guia de Instalação Rápida - Env-Sync

## 📦 Instalação Global via NPM

### Para Usuários (Após Publicação):

```bash
# Instala o pacote globalmente
npm install -g @fabioivan/env-sync

# Verifica a instalação
env-sync --help

# Usa a ferramenta
env-sync
```

## 🔧 Instalação Local para Desenvolvimento:

### 1. Clonando o Repositório:

```bash
# Clone o projeto
git clone https://github.com/fabioivan/env-sync.git
cd env-sync

# Configura comando global para desenvolvimento
npm run setup:global

# Testa se funcionou
env-sync --help
```

### 2. Setup Manual:

```bash
# Instala dependências
npm install

# Compila e configura
npm run build:prod
npm link

# Testa
env-sync
```

## ⚡ Uso Rápido

### Comandos Disponíveis:

```bash
# Executa o gerenciador principal
env-sync

# Lista ambientes configurados
env-sync list

# Adiciona novo ambiente
env-sync add

# Remove ambiente
env-sync remove "Nome do Ambiente"

# Exibe ajuda
env-sync --help

# Exibe versão
env-sync --version
```

### Primeiro Uso:

```bash
# Execute o comando
env-sync

# Na primeira vez, será solicitado:
# - Nome do ambiente (ex: "Desenvolvimento")
# - URL do servidor (ex: "localhost") 
# - Porta do banco (ex: "5432")
# - Usuário do banco (ex: "postgres")
# - Senha do banco

# A ferramenta irá:
# 1. Buscar arquivos databasesettings.json
# 2. Mostrar prévia das mudanças
# 3. Atualizar as portas
# 4. Fazer backup dos arquivos
# 5. Se for SynAuth, oferecer restart do Docker
```

## 🛠️ Comandos de Desenvolvimento

```bash
# Para desenvolvedores
npm run dev           # Executa em modo desenvolvimento
npm run build        # Compila TypeScript
npm run watch         # Compila em modo watch
npm run clean         # Limpa arquivos compilados

# Para testes e publicação
npm run test:npm      # Testa se pacote está pronto
npm run publish       # Publica com incremento automático de versão

# Comandos manuais de publicação
npm run version:patch # Incrementa versão patch
npm run version:minor # Incrementa versão minor  
npm run version:major # Incrementa versão major
npm publish          # Publica versão atual
```

## 🔧 Desinstalação

### Global:
```bash
npm uninstall -g @fabioivan/env-sync
```

### Local (desenvolvimento):
```bash
npm run unlink:global
```

## 🆘 Solução de Problemas

### Comando não encontrado:
```bash
# Verifica se npm global está no PATH
npm config get prefix

# Adiciona ao PATH (se necessário)
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Permissão negada:
```bash
# Linux/Mac - use sudo
sudo npm install -g @fabioivan/env-sync

# Windows - execute como administrador
```

### Reinstalação:
```bash
# Remove e reinstala
npm uninstall -g @fabioivan/env-sync
npm install -g @fabioivan/env-sync
```

## ✅ Verificação de Instalação

```bash
# Verifica se está instalado
which env-sync

# Verifica versão
env-sync --version

# Testa funcionalidades
env-sync --help
```

## 📋 Requisitos do Sistema

- **Node.js**: >= 16.0.0
- **NPM**: >= 7.0.0
- **OS**: Linux, macOS, Windows
- **Docker**: Opcional (para funcionalidade SynAuth)
