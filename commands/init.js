const { Command } = require('commander');
const inquirer = require('inquirer');

const initCmd = new Command('init')
  .description('инициализация проекта')
  .option('--name <name>', 'название проекта')
  .option('--type <type>', 'тип проекта')
  .option('--typescript', 'использовать TypeScript')
  .option('--prettier', 'использовать Prettier')
  .option('--git', 'использовать Git')
  .option('--no-interactive', 'отключить интерактивный режим')
  .action(async (options) => {
    
    // ПЕРВЫЙ ВАРИАНТ: Если передан флаг --no-interactive ИЛИ переданы основные параметры --name и --type
    const isAutomated = options.interactive === false || (options.name && options.type);

    if (isAutomated) {
      if (!options.name || !options.type) {
        console.error('\x1b[31mОшибка: в неинтерактивном режиме необходимо указать --name и --type\x1b[0m');
        process.exit(1);
      }
      
      console.log(`\x1b[32m✓ Проект "${options.name}" успешно инициализирован!\x1b[0m`);
      console.log(`Тип: ${options.type}`);
      console.log(`Опции: ${[options.typescript ? 'TypeScript' : '', options.prettier ? 'Prettier' : ''].filter(Boolean).join(', ') || 'нет'}`);
      console.log(`Git: ${options.git ? 'да' : 'нет'}`);
      return;
    }

    // ВТОРОЙ ВАРИАНТ: Чистый интерактивный режим (если флагов нет)
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Введите название проекта:',
        default: 'my-project'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Выберите тип проекта:',
        choices: ['Web-приложение', 'CLI-утилита', 'Библиотека', 'Микросервис']
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Выберите дополнительные опции:',
        choices: ['TypeScript', 'ESLint', 'Prettier', 'Jest']
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Использовать Git?',
        default: true
      }
    ]);

    console.log(`\x1b[32m✓ Проект "${answers.name}" успешно инициализирован!\x1b[0m`);
    console.log(`Тип: ${answers.type}`);
    console.log(`Опции: ${answers.features.join(', ') || 'нет'}`);
    console.log(`Git: ${answers.git ? 'да' : 'нет'}`);
  });

module.exports = initCmd;