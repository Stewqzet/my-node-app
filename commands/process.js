const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const cliProgress = require('cli-progress');

const processCmd = new Command('process')
  .description('обработка файлов')
  .option('--files <files...>', 'список файлов')
  .action(async (options) => {
    if (!options.files || options.files.length === 0) {
      console.error(chalk.red('Ошибка: укажите файлы через --files'));
      process.exit(1);
    }

    console.log(chalk.blue(`Найдено файлов: ${options.files.length}`));

   
    const spinner = ora('Обработка файлов...').start();
    await new Promise(resolve => setTimeout(resolve, 1500)); // Имитация задержки
    spinner.succeed(chalk.green('Файлы найдены и проверены'));


    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(options.files.length, 0);
    
    for (let i = 0; i < options.files.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      bar.update(i + 1);
    }
    bar.stop();

    // Разделение stdout и stderr (Silence is Golden)
    if (options.files.includes('missing.txt')) {
      console.error(chalk.yellow('⚠ Пропущено 1 файл (missing.txt)'));
      process.exit(1);
    } else {
      // Данные выводятся в stdout (в консоль или файл)
      console.log(JSON.stringify({ status: 'success', processed: options.files.length }));
    }
  });

module.exports = processCmd;