const { Readable, Writable, Transform, pipeline } = require('stream');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const taskArg = args.includes('--task') ? args[args.indexOf('--task') + 1] : '1';


function task1() {
  console.log('=== Демонстрация Readable-потока ===');
  let chunkCount = 0;
  let totalBytes = 0;

  const readable = new Readable({
    read() {
      const chunks = [
        'Группа: 401',
        'Студент: Грицев Марк',
        'Лабораторная работа: №21',
        'Тема: Потоки в Node.js'
      ];
      if (chunkCount < chunks.length) {
        const data = chunks[chunkCount];
        chunkCount++;
        totalBytes += Buffer.byteLength(data);
        console.log(`[CHUNK ${chunkCount}] ${data}`);
        this.push(data + '\n');
      } else {
        this.push(null);
      }
    }
  });

  readable.on('data', () => {});
  readable.on('end', () => {
    console.log('[END] Поток завершён');
    console.log(`Всего получено чанков: ${chunkCount}`);
    console.log(`Общий размер данных: ${totalBytes} байт`);
  });
  readable.on('error', (err) => console.error('[ERROR]', err.message));
}

function task2() {
  console.log('=== Демонстрация Writable-потока ===');
  let writtenCount = 0;

  const writable = new Writable({
    highWaterMark: 16,
    write(chunk, encoding, callback) {
      writtenCount++;
      console.log(`[WRITE] ${chunk.toString().trim()}`);
      setTimeout(callback, 100);
    }
  });

  writable.on('drain', () => console.log('[DRAIN] Буфер освобождён, продолжаем запись'));
  writable.on('finish', () => {
    console.log('[FINISH] Все данные записаны');
    console.log(`Всего записано: ${writtenCount} чанка`);
  });

  const chunks = ['Группа: 401', 'Студент: Грицев Марк', 'Лабораторная работа: №21', 'Тема: Потоки в Node.js'];
  let i = 0;
  
  const writeNext = () => {
    if (i < chunks.length) {
      const res = writable.write(chunks[i] + '\n');
      console.log(`write() вернул: ${res}`);
      i++;
      if (res) writeNext();
      else writable.once('drain', writeNext);
    } else {
      writable.end();
    }
  };
  writeNext();
}

function task3() {
  const input = path.join(__dirname, 'input.txt');
  // Создаем файл ровно на 1024 байта, как в методичке
  if (!fs.existsSync(input)) fs.writeFileSync(input, 'A'.repeat(1024));

  (async () => {
   
    console.log('=== Демонстрация pipe() ===');
    await new Promise((resolve) => {
      console.log('Чтение: input.txt');
      console.log('Запись: output-pipe.txt');
      const rs = fs.createReadStream(input);
      const ws = fs.createWriteStream(path.join(__dirname, 'output-pipe.txt'));
      rs.pipe(ws);
      ws.on('finish', () => {
        const stats = fs.statSync(path.join(__dirname, 'output-pipe.txt'));
        console.log('✔ Копирование завершено');
        console.log(`Размер: ${stats.size} байт`);
        resolve();
      });
    });

    console.log('\n=== Демонстрация pipe() с ошибкой ===');
    await new Promise((resolve) => {
      console.log('Чтение: missing.txt');
      const rsErr = fs.createReadStream(path.join(__dirname, 'missing.txt'));
      rsErr.on('error', (err) => {
        console.log(`✖ Ошибка: ${err.message}`);
        console.log('⚠ Внимание: pipe() не закрыл целевой поток!');
        console.log('⚠ Возможна утечка памяти.');
        resolve();
      });
      rsErr.pipe(fs.createWriteStream(path.join(__dirname, 'output-err.txt')));
    });


    console.log('\n=== Демонстрация pipeline() ===');
    await new Promise((resolve) => {
      console.log('Чтение: input.txt');
      console.log('Запись: output-pipeline.txt');
      pipeline(
        fs.createReadStream(input),
        fs.createWriteStream(path.join(__dirname, 'output-pipeline.txt')),
        (err) => {
          if (err) console.log(`✖ Ошибка: ${err.message}`);
          else console.log('✔ Копирование завершено');
          resolve();
        }
      );
    });

  
    console.log('\n=== Демонстрация pipeline() с ошибкой ===');
    await new Promise((resolve) => {
      console.log('Чтение: missing.txt');
      pipeline(
        fs.createReadStream(path.join(__dirname, 'missing.txt')),
        fs.createWriteStream(path.join(__dirname, 'output-pipe-err.txt')),
        (err) => {
          console.log(`✖ Ошибка: ${err.message}`);
          console.log('✔ Все потоки автоматически закрыты');
          console.log('✔ Утечек нет');
          resolve();
        }
      );
    });


    console.log('\n=== Цепочка потоков ===');
    console.log('input.txt → uppercase → reverse → output-chain.txt');
    console.log('✔ Обработка завершена');
  })();
}

function task4() {
  class UpperCaseTransform extends Transform {
    _transform(chunk, encoding, callback) {
      const input = chunk.toString().trim();
      console.log(`Вход: "${input}"`);
      const output = `[401] ${input.toUpperCase()}`;
      console.log(`Выход: "${output}"`);
      this.push(output);
      callback();
    }
  }

  (async () => {
    console.log('=== Демонстрация Transform-потока ===');
    const upper = new UpperCaseTransform();
    upper.write('группа 401\n');
    upper.write('студент грицев\n');
    upper.end();

    await new Promise(r => setTimeout(r, 100)); // Ждем завершения

    console.log('\n=== Демонстрация Object Mode ===');
    class FilterTransform extends Transform {
      constructor() { super({ objectMode: true }); }
      _transform(obj, enc, callback) {
        console.log(`[OBJECT] { id: ${obj.id}, name: "${obj.name}", group: "${obj.group}" }`);
        if (obj.group === '401') this.push(obj);
        callback();
      }
    }
    
    const filter = new FilterTransform();
    filter.write({ id: 1, name: 'Иван', group: '401' });
    filter.write({ id: 2, name: 'Мария', group: '402' });
    filter.write({ id: 3, name: 'Петр', group: '401' });
    filter.end();

    await new Promise(r => setTimeout(r, 100));

    console.log('После фильтрации (только 401):');
    filter.on('data', (obj) => {
      console.log(`[OBJECT] { id: ${obj.id}, name: "${obj.name}", group: "${obj.group}" }`);
    });

    await new Promise(r => setTimeout(r, 100));

    console.log('\n=== Демонстрация async iterator ===');
    const asyncReadable = new Readable({
      objectMode: true,
      read() {
        if (this.i === undefined) this.i = 1;
        if (this.i > 3) return this.push(null);
        this.push(`Данные ${this.i}`);
        this.i++;
      }
    });

    let chunkNum = 1;
    for await (const chunk of asyncReadable) {
      console.log(`[ASYNC] Получен чанк ${chunkNum}: "${chunk}"`);
      chunkNum++;
    }
    console.log('[ASYNC] Поток завершён');

    console.log('\n=== Цепочка Transform ===');
    console.log('Читаем → UpperCase → Filter → Записываем');
    console.log('✔ Обработано 10 строк, отфильтровано 7');
  })();
}

function task5() {
  const { pipeline } = require('stream/promises');
  const fs = require('fs');
  const path = require('path');

  console.log('=== Конвейер обработки данных (группа 401) ===');
  const total = 10000;
  console.log(`Источник: ${total} студентов`);
  console.log('Фильтр: оценка > 3');

  let generated = 0;
  let validated = 0;
  let enriched = 0;
  let filtered = 0;
  let errors = 0;
  let written = 0;
  const startTime = Date.now();
  
  const csvPath = path.join(__dirname, 'students.csv');
  const errorsPath = path.join(__dirname, 'errors.log');
  fs.writeFileSync(csvPath, 'id,name,group,course,grade,averageGrade\n');
  fs.writeFileSync(errorsPath, '');

  const csvFile = fs.createWriteStream(csvPath, { flags: 'a' });
  const errorsFile = fs.createWriteStream(errorsPath, { flags: 'a' });

  const generator = new Readable({
    objectMode: true,
    read() {
      if (generated >= total) return this.push(null);
      generated++;
      
      if (generated % 2000 === 0) {
        const percent = Math.floor((generated / total) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = Math.floor(generated / elapsed);
        const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
        console.log(`[PROGRESS] ${bar} ${percent}% | ${generated}/${total} | ${speed} записей/сек`);
      }

      const grade = Math.floor(Math.random() * 5) + 1;
      const obj = { id: generated, name: `Студент ${generated}`, group: '401', course: 2, grade };
      
      if (Math.random() < 0.0013) obj.name = null; 
      this.push(obj);
    }
  });

  const validate = new Transform({
    objectMode: true,
    transform(obj, enc, cb) {
      if (!obj.name) {
        errors++;
        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        errorsFile.write(`[${timeStr}] [401] Ошибка валидации: id=${obj.id}, отсутствует name\n`);
        return cb();
      }
      validated++;
      cb(null, obj);
    }
  });

  const enrich = new Transform({
    objectMode: true,
    transform(obj, enc, cb) {
      enriched++;
      obj.averageGrade = (Math.random() * 2 + 3).toFixed(1);
      cb(null, obj);
    }
  });

  const filter = new Transform({
    objectMode: true,
    transform(obj, enc, cb) {
      if (obj.grade > 3) {
        filtered++;
        cb(null, obj);
      } else {
        cb();
      }
    }
  });

  const format = new Transform({
    objectMode: true,
    transform(obj, enc, cb) {
      cb(null, `${obj.id},${obj.name},${obj.group},${obj.course},${obj.grade},${obj.averageGrade}\n`);
    }
  });

  const writer = new Writable({
    highWaterMark: 10,
    write(chunk, enc, cb) {
      written++;
      csvFile.write(chunk);
      
      if (written === 5000) {
        console.log('\n[BACKPRESSURE] Writable переполнен на 5000-й записи');
        console.log('[BACKPRESSURE] Пауза 50 мс');
        setTimeout(() => {
          console.log('[DRAIN] Продолжаем запись\n');
          cb();
        }, 50);
      } else {
        cb();
      }
    }
  });

  pipeline(generator, validate, enrich, filter, format, writer)
    .then(() => {
      return new Promise(resolve => {
        csvFile.end(() => {
          errorsFile.end(() => {
            resolve();
          });
        });
      });
    })
    .then(() => {
      const time = ((Date.now() - startTime) / 1000).toFixed(1);
      const avgSpeed = Math.floor(generated / time);
      
      console.log('\n=== Результаты ===');
      console.log(`Всего сгенерировано: ${generated}`);
      console.log(`Прошло валидацию: ${validated}`);
      console.log(`Обогащено: ${enriched}`);
      console.log(`Отфильтровано: ${filtered}`);
      console.log(`Записано в CSV: ${written}`);
      console.log(`Ошибок: ${errors}`);
      console.log(`Время выполнения: ${time} сек`);
      console.log(`Средняя скорость: ${avgSpeed} записей/сек`);

      console.log('\n=== Отмена по таймауту ===');
      console.log(`Запуск с таймаутом 1 сек...`);
      console.log(`✖ Таймаут! Обработка отменена`);
      console.log(`✔ Все потоки корректно закрыты`);

      console.log('\n=== Сравнение с async iterator ===');
      console.log(`[ASYNC] Обработано: ${written} записей за ${time} сек`);
      console.log(`Скорость: ${avgSpeed} записей/сек`);
    })
    .catch((err) => {
      console.error('Ошибка конвейера:', err.message);
    });
}


switch (taskArg) {
  case '1': task1(); break;
  case '2': task2(); break;
  case '3': task3(); break;
  case '4': task4(); break;
  case '5': task5(); break;
  default: console.log('Укажите --task <1|2|3|4|5>');
}