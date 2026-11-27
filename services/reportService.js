const fs = require('fs');
const path = require('path');

class ReportService {
  generate(type, outputPath, isDryRun = false) {
    const content = `Отчет типа: ${type}\nСгенерирован: ${new Date().toISOString()}`;
    const fullPath = path.resolve(outputPath);

    if (isDryRun) {
      return { status: 'dry-run', path: fullPath, type };
    }

    try {
      fs.writeFileSync(fullPath, content, 'utf8');
      return { status: 'success', path: fullPath, type };
    } catch (err) {
      throw new Error(`Не удалось сохранить файл: ${err.message}`);
    }
  }
}

module.exports = new ReportService();