const chalk = require('chalk');

const logger = {
  success: (msg) => console.log(chalk.green(`✔ ${msg}`)),
  error: (msg) => console.error(chalk.red(`✖ ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`⚠ ${msg}`)),
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  verbose: (msg) => {
    if (process.env.VERBOSE) console.log(chalk.gray(`[VERBOSE] ${msg}`));
  }
};

module.exports = logger;