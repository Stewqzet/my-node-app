const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

async function createTestStructure() {
  const sourceDir = path.join(__dirname, 'source_3');
  await fs.mkdir(sourceDir, { recursive: true });
  
  const files = [
    { name: 'file1.txt', content: 'Текстовый файл 1' },
    { name: 'file2.js', content: 'console.log("Hello");' },
    { name: 'file3.json', content: '{"key": "value"}' },
    { name: 'file4.jpg', content: 'fake-image-data' },
    { name: 'file5.png', content: 'fake-png-data' },
  ];
  
  for (const file of files) {
    await fs.writeFile(path.join(sourceDir, file.name), file.content);
  }
  
  // Создаем подпапки
  await fs.mkdir(path.join(sourceDir, 'sub1'), { recursive: true });
  await fs.writeFile(path.join(sourceDir, 'sub1', 'nested1.txt'), 'Вложенный файл 1');
  
  return sourceDir;
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  let count = 0;
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      
      if (['.txt', '.js', '.json'].includes(ext)) {
        // Потоковое копирование для текстовых файлов
        await pipeline(
          fsSync.createReadStream(srcPath),
          fsSync.createWriteStream(destPath)
        );
        console.log(`[STREAM] Скопирован: ${entry.name}`);
      } else {
        // Обычное копирование
        await fs.copyFile(srcPath, destPath);
        console.log(`[COPY] Скопирован: ${entry.name}`);
      }
      count++;
    }
  }
  return count;
}

async function task5() {
  try {
    const sourceDir = await createTestStructure();
    const backupDir = path.join(__dirname, 'backup_3');
    
    console.log(`📂 Исходная директория: source_3`);
    console.log(`📂 Директория назначения: backup_3`);
    
    const copiedCount = await copyDir(sourceDir, backupDir);
    
    console.log(`\n✅ Копирование завершено! Скопировано файлов: ${copiedCount}`);
    
    // Простейшая синхронизация
    console.log('\n🔄 Сравнение директорий:');
    const srcFiles = await fs.readdir(sourceDir);
    const destFiles = await fs.readdir(backupDir);
    
    const added = destFiles.filter(f => !srcFiles.includes(f));
    const deleted = srcFiles.filter(f => !destFiles.includes(f));
    const matched = srcFiles.filter(f => destFiles.includes(f));
    
    const report = `Отчет синхронизации\nСовпадают: ${matched.length}\nДобавлены: ${added.length}\nУдалены: ${deleted.length}\n`;
    await fs.writeFile(path.join(__dirname, 'sync_report_3.txt'), report);
    
    console.log(`- Совпадают: ${matched.length}`);
    console.log(`- Добавлены: ${added.length}`);
    console.log(`- Удалены: ${deleted.length}`);
    console.log(`\n📄 Отчет сохранен: sync_report_3.txt`);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

task5();