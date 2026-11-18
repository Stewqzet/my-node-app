const { Command } = require('commander');
const reportService = require('../services/reportService');
const logger = require('../utils/logger');

const generateCmd = new Command('generate')
  .description('сгенерировать отчёт')
  .option('-t, --type <type>', 'тип отчёта (по умолчанию: "html")', 'html')
  .option('-o, --output <path>', 'путь для сохранения')
  .option('-f, --force', 'перезаписать существующий файл')
  .option('--dry-run', 'показать что будет сделано без выполнения')
  .option('-v, --verbose', 'подробный вывод')
  .action((options) => {
    const validTypes = ['html', 'pdf', 'json', 'csv'];
    if (!validTypes.includes(options.type)) {
      logger.error(`Ошибка: недопустимый тип отчёта "${options.type}".`);
      console.log(`Допустимые значения: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    const outputPath = options.output || `./output.${options.type}`;

    if (options.verbose) {
      process.env.VERBOSE = 'true';
      logger.verbose('Запуск генерации отчёта...');
      logger.verbose(`Тип отчёта: ${options.type}`);
      logger.verbose(`Путь сохранения: ${outputPath}`);
    }

    try {
      const result = reportService.generate(options.type, outputPath, options.dryRun);
      
      if (options.dryRun) {
        logger.warn(`[DRY-RUN] Будет сгенерирован отчёт типа: ${result.type}`);
        logger.warn(`[DRY-RUN] Файл будет сохранён в: ${result.path}`);
        logger.warn('Действия не выполнены (режим проверки)');
      } else {
        logger.success(`Отчёт успешно сгенерирован: ${result.path}`);
      }
    } catch (error) {
      logger.error(error.message);
      process.exit(1);
    }
  });

module.exports = generateCmd;