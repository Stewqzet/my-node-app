const { Command } = require('commander');
const ora = require('ora');

const buildCmd = new Command('build')
  .description('сборка проекта')
  .action(async () => {
   
    throw new Error('Файл конфигурации config.json не найден в корне проекта');

    const spinner = ora('Сборка проекта...').start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.succeed('Сборка завершена! Результат: dist/app.js');
  });

module.exports = buildCmd;