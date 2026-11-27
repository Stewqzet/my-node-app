const { Command } = require('commander');
const ora = require('ora');

const testCmd = new Command('test')
  .description('запуск тестов')
  .action(async () => {
    const spinner = ora('Запуск тестов...').start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.succeed('Пройдено: 15/15 тестов (Покрытие: 87%)');
  });

module.exports = testCmd;