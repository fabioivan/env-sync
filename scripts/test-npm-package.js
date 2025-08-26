#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue.bold('🧪 TESTE: Pacote NPM'));
console.log(chalk.blue('='.repeat(50)));

const tests = [
  {
    name: 'Build para Produção',
    command: 'npm run build:prod',
    description: 'Compila TypeScript e adiciona shebang'
  },
  {
    name: 'Verificação do Shebang',
    test: () => {
      const mainFile = path.join(__dirname, '../dist/main.js');
      if (!fs.existsSync(mainFile)) {
        throw new Error('Arquivo dist/main.js não encontrado');
      }
      const content = fs.readFileSync(mainFile, 'utf8');
      if (!content.startsWith('#!/usr/bin/env node')) {
        throw new Error('Shebang não encontrado');
      }
      return 'Shebang correto no arquivo principal';
    },
    description: 'Verifica se o shebang foi adicionado'
  },
  {
    name: 'Verificação de Permissões',
    test: () => {
      const mainFile = path.join(__dirname, '../dist/main.js');
      const stats = fs.statSync(mainFile);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      if (!isExecutable) {
        throw new Error('Arquivo não é executável');
      }
      return 'Arquivo tem permissões de execução';
    },
    description: 'Verifica se o arquivo é executável'
  },
  {
    name: 'Teste de Empacotamento',
    command: 'npm pack --dry-run',
    description: 'Simula empacotamento para NPM'
  },
  {
    name: 'Comando Global',
    command: 'env-sync --help',
    description: 'Testa se comando global funciona'
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    console.log(chalk.yellow(`\n🔍 ${test.name}:`));
    console.log(chalk.gray(`   ${test.description}`));

    if (test.command) {
      execSync(test.command, { stdio: 'pipe', cwd: path.join(__dirname, '..') });
      console.log(chalk.green('   ✅ Passou'));
    } else if (test.test) {
      const result = test.test();
      console.log(chalk.green(`   ✅ ${result}`));
    }

    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Falhou: ${error.message}`));
    failed++;
  }
}

console.log(chalk.blue('\n' + '='.repeat(50)));
console.log(chalk.bold('📊 RESUMO DOS TESTES:'));
console.log(chalk.green(`✅ Passou: ${passed}`));
console.log(chalk.red(`❌ Falhou: ${failed}`));

if (failed === 0) {
  console.log(chalk.green.bold('\n🎉 Todos os testes passaram!'));
  console.log(chalk.cyan('📦 O pacote está pronto para publicação no NPM'));

  console.log(chalk.yellow('\n📋 Próximos passos:'));
  console.log(chalk.white('1. npm login (se não estiver logado)'));
  console.log(chalk.white('2. npm run version:patch (ou minor/major)'));
  console.log(chalk.white('3. npm publish'));

} else {
  console.log(chalk.red.bold('\n❌ Alguns testes falharam!'));
  console.log(chalk.yellow('🔧 Corrija os problemas antes de publicar'));
  process.exit(1);
}
