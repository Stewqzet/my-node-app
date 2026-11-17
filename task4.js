const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

async function generateFile(filePath) {
  try {
    await fsp.access(filePath);
    console.log(`Файл ${path.basename(filePath)} уже существует.`);
  } catch {
    console.log(`Генерация файла ${path.basename(filePath)}...`);
    const stream = fs.createWriteStream(filePath);
    for (let i = 1; i <= 100000; i++) {
      const randomNum = Math.floor(Math.random() * 1000) + 1;
      stream.write(`${i}, ${randomNum}, Вариант 3\n`);
    }
    stream.end();
    await new Promise(resolve => stream.on('finish', resolve));
    console.log('Файл сгенерирован!');
  }
}

async function processFile(filePath) {
  const outputPath = path.join(__dirname, 'processed_3.txt');
  const inputStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
  const outputStream = fs.createWriteStream(outputPath);
  const rl = readline.createInterface({ input: inputStream, crlfDelay: Infinity });

  let count = 0, sum = 0, min = Infinity, max = -Infinity;
  let evenCount = 0, oddCount = 0;
  const totalLines = 100000;

  console.log(`📊 Обработка файла: ${path.basename(filePath)}`);
  const startTime = Date.now();

  for await (const line of rl) {
    const parts = line.split(', ');
    const num = parseInt(parts[1]);
    
    if (!isNaN(num)) {
      sum += num;
      count++;
      if (num < min) min = num;
      if (num > max) max = num;
      if (num % 2 === 0) evenCount++; else oddCount++;
    }

    if (count % 10000 === 0 && count > 0) {
      const progress = Math.floor((count / totalLines) * 100);
      if (progress % 10 === 0) {
        console.log(`⏳ Прогресс: ${progress}% (${count.toLocaleString()} строк обработано)`);
      }
    }
  }

  const avg = sum / count;
  const timeSpent = ((Date.now() - startTime) / 1000).toFixed(2);

  const result = `📊 Результаты:\n- Всего строк: ${count.toLocaleString()}\n- Сумма чисел: ${sum.toLocaleString()}\n- Среднее значение: ${avg.toFixed(2)}\n- Максимальное число: ${max}\n- Минимальное число: ${min}\n- Четных чисел: ${evenCount.toLocaleString()}\n- Нечетных чисел: ${oddCount.toLocaleString()}\n⏱ Время выполнения: ${timeSpent} сек`;

  outputStream.write(result);
  outputStream.end();

  console.log(`\n✅ Обработка завершена!`);
  console.log(result);
  console.log(`📄 Результаты сохранены в: processed_3.txt`);
}

async function task4() {
  const dataFile = path.join(__dirname, 'data_3.txt');
  await generateFile(dataFile);
  await processFile(dataFile);
}

task4();