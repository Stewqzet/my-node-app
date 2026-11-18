const { Command } = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');

const deployCmd = new Command('deploy')
  .description('развёртывание проекта')
  .option('--env <environment>', 'окружение для деплоя', 'production')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Вы собираетесь развернуть проект в окружении [${options.env}]! Продолжить?`,
        default: false
      }
    ]);

    if (!answers.confirm) {
      console.log('Развёртывание отменено.');
      return;
    }

    const spinner = ora('Развёртывание...').start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed('Развёрнуто успешно! URL: https://my-app.example.com');
  });

module.exports = deployCmd;