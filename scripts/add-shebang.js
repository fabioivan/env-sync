#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const mainFile = path.join(__dirname, '../dist/main.js');
const shebang = '#!/usr/bin/env node\n';

if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, 'utf8');

  // Verifica se já tem shebang
  if (!content.startsWith('#!')) {
    const newContent = shebang + content;
    fs.writeFileSync(mainFile, newContent);

    // Torna o arquivo executável (octal 755 = rwxr-xr-x)
    fs.chmodSync(mainFile, 0o755);

    console.log('✅ Shebang adicionado ao arquivo principal');
    console.log('✅ Permissões de execução configuradas');
  } else {
    console.log('ℹ️  Shebang já existe no arquivo principal');
    // Garante que tem permissões de execução mesmo se shebang já existe
    fs.chmodSync(mainFile, 0o755);
    console.log('✅ Permissões de execução verificadas');
  }
} else {
  console.error('❌ Arquivo dist/main.js não encontrado. Execute npm run build primeiro.');
  process.exit(1);
}
