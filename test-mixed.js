const FileManagerMixed = require('./fileOperationsMixed');

const manager = new FileManagerMixed('./test-data-mixed');

console.log('=== ТЕСТИРОВАНИЕ СМЕШАННОГО ПОДХОДА ===\n');

// 1. Использование с колбэком
console.log('1. Создание файла через колбэк...');
manager.createFileCallback('mixed1.txt', 'Смешанный подход', (err, path) => {
  if (err) return console.error('❌ Ошибка:', err.message);
  console.log(`✅ Файл создан: ${path}`);

  // 2. Использование с промисом
  console.log('\n2. Чтение файла через промис...');
  manager.readFileMixed('mixed1.txt')
    .then(content => {
      console.log(`✅ Содержимое: "${content}"`);
      
      // 3. Очистка через промис
      console.log('\n3. Удаление файла...');
      return manager.promiseManager.deleteFile('mixed1.txt');
    })
    .then(() => console.log('✅ Файл удалён'))
    .catch(err => console.error('❌ Ошибка:', err.message));
});