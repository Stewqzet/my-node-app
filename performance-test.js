const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const TEST_FILE = './perf-test.txt';
const ITERATIONS = 1000; // Количество операций

async function testSync() {
  console.time('Синхронно');
  for (let i = 0; i < ITERATIONS; i++) {
    fs.writeFileSync(TEST_FILE, `Синхронная запись ${i}`);
  }
  console.timeEnd('Синхронно');
}

async function testCallbacks() {
  console.time('Колбэки');
  return new Promise((resolve) => {
    let count = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      fs.writeFile(TEST_FILE, `Колбэк ${i}`, () => {
        count++;
        if (count === ITERATIONS) resolve();
      });
    }
  }).then(() => console.timeEnd('Колбэки'));
}

async function testPromises() {
  console.time('Промисы');
  const promises = [];
  for (let i = 0; i < ITERATIONS; i++) {
    promises.push(writeFile(TEST_FILE, `Промис ${i}`));
  }
  await Promise.all(promises);
  console.timeEnd('Промисы');
}

(async () => {
  console.log(`Тест производительности (${ITERATIONS} операций записи):\n`);
  
  // Запускаем тесты по очереди
  await testSync();
  await testCallbacks();
  await testPromises();
  
  // Очистка после теста
  if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  
  console.log('\nТест завершен. Синхронный код обычно медленнее, так как блокирует Event Loop.');
})();