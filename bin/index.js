#!/usr/bin/env node
const { program } = require('commander');

// Обработка ошибок (Задание 5)
process.on('uncaughtException', (err) => {
  console.error(`\x1b[31m✖ Ошибка: ${err.message}\x1b[0m`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);
  process.exit(1);
});

// Подключение существующих команд
const initCmd = require('../commands/init');
const generateCmd = require('../commands/generate');
const processCmd = require('../commands/process');

// Подключение новых команд для Задания 5 (build, test, deploy)
const buildCmd = require('../commands/build');
const testCmd = require('../commands/test');
const deployCmd = require('../commands/deploy');

program
  .name('my-cli')
  .description('CLI-приложение для лабораторной работы №17')
  .version('1.0.0');

// Задание 1: Базовые команды
program.command('greet <name>')
  .description('поприветствовать пользователя')
  .action((name) => {
    console.log(`Привет, ${name}! Добро пожаловать в CLI-приложение группы 401.`);
  });

program.command('info')
  .description('вывести информацию о группе')
  .action(() => {
    console.log(`Группа: 401\nСтудент: Грицев Марк\nЛабораторная работа: №17\nДата: ${new Date().toISOString().split('T')[0]}`);
  });

// Регистрация всех подкоманд
program.addCommand(generateCmd);
program.addCommand(initCmd);
program.addCommand(processCmd);
program.addCommand(buildCmd);
program.addCommand(testCmd);
program.addCommand(deployCmd);

program.parse(process.argv);

// Если аргументов нет — выводим справку
if (!process.argv.slice(2).length) {
  program.outputHelp();
}