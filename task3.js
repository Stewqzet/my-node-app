const fs = require('fs').promises;
const path = require('path');

async function analyzeDir(dirPath, stats, currentDir = '') {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    const relPath = path.join(currentDir, item.name);
    
    if (item.isDirectory()) {
      // Игнорируем node_modules и .git (на всякий случай)
      if (item.name === 'node_modules' || item.name === '.git') continue;
      stats.folders++;
      await analyzeDir(fullPath, stats, relPath);
    } else {
      const stat = await fs.stat(fullPath);
      
      // Игнорируем файлы больше 10 МБ (вариант 3)
      if (stat.size > 10 * 1024 * 1024) continue;
      
      stats.files++;
      stats.totalSize += stat.size;
      
      const ext = path.extname(item.name) || 'no_ext';
      if (!stats.extensions[ext]) {
        stats.extensions[ext] = { count: 0, size: 0 };
      }
      stats.extensions[ext].count++;
      stats.extensions[ext].size += stat.size;
      
      stats.fileList.push({
        name: item.name,
        path: relPath,
        size: stat.size
      });
    }
  }
}

async function task3() {
  const targetDir = path.join(__dirname, 'project_3'); // Анализируем папку из 2-го задания
  const reportFile = path.join(__dirname, 'report_3.json');
  
  const stats = {
    folders: 0,
    files: 0,
    totalSize: 0,
    extensions: {},
    fileList: []
  };
  
  try {
    console.log(`📊 Анализ директории: ./project_3\n`);
    await analyzeDir(targetDir, stats);
    
    // Сортировка для топов
    stats.fileList.sort((a, b) => b.size - a.size);
    const top5Largest = stats.fileList.slice(0, 5);
    const top5Smallest = [...stats.fileList].sort((a, b) => a.size - b.size).slice(0, 5);
    
    // Вывод статистики
    console.log(`📁 Общее количество папок: ${stats.folders}`);
    console.log(`📄 Общее количество файлов: ${stats.files}`);
    console.log(`💾 Общий размер: ${(stats.totalSize / (1024 * 1024)).toFixed(2)} МБ (${stats.totalSize} байт)`);
    
    console.log('\n📂 Расширения файлов:');
    for (const [ext, data] of Object.entries(stats.extensions)) {
      console.log(`${ext}: ${data.count} файлов (${(data.size / 1024).toFixed(1)} КБ)`);
    }
    
    console.log('\n🏆 Топ-5 самых больших файлов:');
    top5Largest.forEach((f, i) => console.log(`${i + 1}. ${f.name} (${(f.size / 1024).toFixed(1)} КБ) - ./${f.path}`));
    
    // Сохранение в JSON
    const reportData = {
      folders: stats.folders,
      files: stats.files,
      totalSize: stats.totalSize,
      extensions: stats.extensions,
      top5Largest,
      top5Smallest
    };
    
    await fs.writeFile(reportFile, JSON.stringify(reportData, null, 2), 'utf8');
    console.log(`\n📄 Отчет сохранен: report_3.json`);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

task3();