#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const path = require('path');

console.log(chalk.blue.bold('🔧 ENV-SYNC - Setup Global'));
console.log(chalk.blue('=' .repeat(50)));

try {
  console.log(chalk.yellow('\n📦 Instalando dependências...'));
  execSync('npm install', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log(chalk.yellow('\n🔨 Compilando projeto...'));
  execSync('npm run build:prod', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log(chalk.yellow('\n🔗 Criando link global...'));
  execSync('npm link', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log(chalk.green('\n✅ Setup concluído com sucesso!'));
  console.log(chalk.cyan('\n🚀 Agora você pode usar:'));
  console.log(chalk.white('   env-sync --help'));
  console.log(chalk.white('   env-sync (para executar a ferramenta)'));

  console.log(chalk.yellow('\n📋 Para remover o link global:'));
  console.log(chalk.white('   npm run unlink:global'));

} catch (error) {
  console.error(chalk.red('\n❌ Erro durante o setup:'));
  console.error(error.message);
  process.exit(1);
}
