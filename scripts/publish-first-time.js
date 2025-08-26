#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageData.version;
}

function getPackageName() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageData.name;
}

async function main() {
  const currentVersion = getCurrentVersion();
  const packageName = getPackageName();

  console.log(chalk.blue.bold('🚀 ENV-SYNC - Publicação no NPM'));
  console.log(chalk.blue('='.repeat(60)));
  console.log(chalk.cyan(`📦 Pacote: ${packageName}`));
  console.log(chalk.cyan(`📋 Versão atual: ${currentVersion}`));

  try {
    // Verifica se está logado no NPM
    console.log(chalk.yellow('\n1️⃣ Verificando login no NPM...'));
    try {
      const user = execSync('npm whoami', { encoding: 'utf8' }).trim();
      console.log(chalk.green(`✅ Logado como: ${user}`));
    } catch {
      console.log(chalk.red('❌ Não está logado no NPM'));
      const shouldLogin = await question('Deseja fazer login agora? (s/n): ');

      if (shouldLogin.toLowerCase().startsWith('s')) {
        execSync('npm login', { stdio: 'inherit' });
        console.log(chalk.green('✅ Login realizado!'));
      } else {
        console.log(chalk.red('❌ Login necessário para publicar'));
        process.exit(1);
      }
    }

    // Executa testes
    console.log(chalk.yellow('\n2️⃣ Executando testes...'));
    execSync('npm run test:npm', { stdio: 'inherit' });

    // Seleção do tipo de versão
    console.log(chalk.yellow('\n3️⃣ Seleção do tipo de versão'));
    console.log(chalk.white('Escolha o tipo de incremento de versão:'));
    console.log(chalk.cyan('1) patch (1.0.0 → 1.0.1) - Correções de bugs'));
    console.log(chalk.cyan('2) minor (1.0.0 → 1.1.0) - Novas funcionalidades'));
    console.log(chalk.cyan('3) major (1.0.0 → 2.0.0) - Mudanças incompatíveis'));
    console.log(chalk.gray('4) Cancelar publicação'));

    const versionChoice = await question('\nDigite sua opção (1-4): ');

    let versionType;
    switch (versionChoice.trim()) {
      case '1':
        versionType = 'patch';
        break;
      case '2':
        versionType = 'minor';
        break;
      case '3':
        versionType = 'major';
        break;
      case '4':
      default:
        console.log(chalk.yellow('❌ Publicação cancelada'));
        process.exit(0);
    }

    // Incrementa versão
    console.log(chalk.yellow(`\n4️⃣ Incrementando versão (${versionType})...`));
    execSync(`npm version ${versionType}`, { stdio: 'inherit' });

    const newVersion = getCurrentVersion();
    console.log(chalk.green(`✅ Nova versão: ${newVersion}`));

    // Confirma publicação
    console.log(chalk.yellow('\n5️⃣ Confirmação de publicação'));
    console.log(chalk.cyan(`📦 Pacote: ${packageName}@${newVersion}`));

    const shouldPublish = await question('Deseja continuar com a publicação? (s/n): ');

    if (!shouldPublish.toLowerCase().startsWith('s')) {
      console.log(chalk.yellow('❌ Publicação cancelada'));
      console.log(chalk.gray('💡 A versão foi incrementada, mas não publicada'));
      process.exit(0);
    }

    // Publica
    console.log(chalk.yellow('\n6️⃣ Publicando no NPM...'));
    execSync('npm publish', { stdio: 'inherit' });

    // Sucesso
    const finalVersion = getCurrentVersion();
    console.log(chalk.green.bold('\n🎉 SUCESSO!'));
    console.log(chalk.green(`✅ Pacote ${packageName}@${finalVersion} publicado no NPM`));
    console.log(chalk.cyan('\n📦 Instruções para usuários:'));
    console.log(chalk.white(`npm install -g ${packageName}`));
    console.log(chalk.white('env-sync --help'));

    console.log(chalk.cyan('\n🔗 Links úteis:'));
    console.log(chalk.white(`NPM: https://www.npmjs.com/package/${packageName}`));
    console.log(chalk.white(`Verificação: npm info ${packageName}`));

    console.log(chalk.cyan('\n📈 Versão publicada:'));
    console.log(chalk.white(`${currentVersion} → ${finalVersion}`));

  } catch (error) {
    console.error(chalk.red(`\n❌ Erro: ${error.message}`));
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
