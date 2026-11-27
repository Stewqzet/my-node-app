const EventEmitter = require('events');
const os = require('os');
const http = require('http');


const args = process.argv.slice(2);
const taskArg = args.includes('--task') ? args[args.indexOf('--task') + 1] : '1';

function task1() {
  console.log('=== Демонстрация EventEmitter ===');
  const emitter = new EventEmitter();

  emitter.on('greet', (name) => console.log(`[greet] Привет, ${name}!`));
  emitter.on('info', () => console.log(`[info] Группа: 401`));
  emitter.on('bye', () => console.log(`[bye] До свидания!`));

  emitter.emit('greet', 'Иван');
  emitter.emit('info');
  emitter.emit('bye');

  console.log(`Событие "unknown" без слушателей: ${emitter.emit('unknown')}`);
  console.log(`Событие "greet" со слушателями: ${emitter.emit('greet', 'Тест')}`);
}

function task2() {
  console.log('=== Сравнение on и once ===');
  const emitter = new EventEmitter();
  let onCount = 0;
  let onceCount = 0;

  emitter.on('tick', () => { onCount++; console.log(`[tick #${onCount}] on-слушатель`); });
  emitter.once('tick', () => { onceCount++; console.log(`[tick #${onCount}] once-слушатель`); });

  emitter.emit('tick'); // 1
  emitter.emit('tick'); // 2
  emitter.emit('tick'); // 3

  console.log(`on-слушатель вызван: ${onCount} раза`);
  console.log(`once-слушатель вызван: ${onceCount} раз`);

  console.log('\n=== Управление подписками ===');
  const emitter2 = new EventEmitter();
  const l1 = () => {};
  const l2 = () => {};
  const l3 = () => {};

  emitter2.on('test', l1);
  emitter2.on('test', l2);
  emitter2.on('test', l3);

  console.log(`Слушателей до удаления: ${emitter2.listenerCount('test')}`);
  emitter2.removeListener('test', l2);
  console.log(`Слушателей после удаления одного: ${emitter2.listenerCount('test')}`);
  emitter2.removeAllListeners('test');
  console.log(`Слушателей после removeAllListeners: ${emitter2.listenerCount('test')}`);

  console.log('\n=== Порядок вызова ===');
  const emitter3 = new EventEmitter();
  emitter3.on('order', () => console.log('1. Первый слушатель (группа 401)'));
  emitter3.on('order', () => console.log('2. Второй слушатель'));
  emitter3.on('order', () => console.log('3. Третий слушатель'));
  emitter3.emit('order');
}

class DatabaseConnection extends EventEmitter {
  connect() {
    console.log('[EVENT] Подключение к БД...');
    this.emit('connect');
  }
  query(sql, resultCount = 0) {
    console.log(`[EVENT] Выполнение запроса: ${sql}`);
    this.emit('query', sql, resultCount);
  }
  close() {
    console.log('[EVENT] Закрытие соединения');
    this.emit('close');
  }
  error(msg) {
    this.emit('error', new Error(msg));
  }
}

function task3() {
  console.log('=== DatabaseConnection (группа 401) ===');
  const db = new DatabaseConnection();

  db.on('connect', () => console.log('[EVENT] Соединение установлено'));
  db.on('query', (sql, count) => console.log(`[EVENT] Результат: ${count} записей`));
  db.on('close', () => console.log('[EVENT] Соединение закрыто'));
  db.on('error', (err) => console.log(`[EVENT] Ошибка: ${err.message}`));

  db.connect();
  db.query('SELECT * FROM students', 50);
  db.query('INSERT INTO students', 1);
  db.close();

  console.log('\n=== Демонстрация ошибки ===');
  db.error('Connection timeout');
  console.log('(без слушателя error — процесс упал бы с исключением)');
}

function task4() {
  console.log('=== Система плагинов ===');
  const emitter = new EventEmitter();

  emitter.on('newListener', (event, listener) => {
    console.log(`[newListener] Добавлен слушатель "${event}"`);
  });
  emitter.on('removeListener', (event, listener) => {
    console.log(`[removeListener] Удалён слушатель "${event}"`);
  });

  const loggerListener = () => console.log('[PLUGIN] Логгирование...');
  const alertListener = () => console.log('[PLUGIN] Алерт!');

  emitter.on('plugin:registered', loggerListener);
  emitter.emit('plugin:registered');
  emitter.on('plugin:registered', alertListener);
  emitter.emit('plugin:registered');

  emitter.removeListener('plugin:registered', loggerListener);

  console.log('\n=== Демонстрация утечки ===');
  const leakEmitter = new EventEmitter();
  const emptyListener = () => {};
  
  console.log(`Слушателей до: ${leakEmitter.listenerCount('leak')}`);
  for (let i = 0; i < 1000; i++) {
    leakEmitter.on('leak', emptyListener);
  }
  console.log(`Слушателей после добавления 1000: ${leakEmitter.listenerCount('leak')}`);
  leakEmitter.removeAllListeners('leak');
  console.log(`Слушателей после removeAllListeners: ${leakEmitter.listenerCount('leak')}`);

  console.log('\n=== Асинхронные слушатели ===');
  const asyncEmitter = new EventEmitter();
  asyncEmitter.on('asyncEvent', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[401] async-слушатель завершён через 100ms');
  });

  asyncEmitter.emit('asyncEvent');
  console.log('[401] emit вызван (не ждёт async-слушатель)');
}

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.metrics = {};
    this.listenersMap = new Map();
  }

  on(event, listener, priority = 0) {
    if (!this.listenersMap.has(event)) this.listenersMap.set(event, []);
    this.listenersMap.get(event).push({ listener, priority });
    this.listenersMap.get(event).sort((a, b) => b.priority - a.priority);
    return this;
  }

  once(event, listener, priority = 0) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper, priority);
    return this;
  }

  off(event, listener) {
    const listeners = this.listenersMap.get(event) || [];
    const index = listeners.findIndex(l => l.listener === listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.emit('removeListener', event, listener);
    }
    return this;
  }

  emit(event, ...args) {
    if (!this.metrics[event]) this.metrics[event] = { count: 0, errors: 0, lastCall: null };
    this.metrics[event].count++;
    this.metrics[event].lastCall = new Date().toISOString();

    const anyListeners = this.listenersMap.get('onAny') || [];
    for (const { listener } of anyListeners) {
      try {
        listener(event, args);
      } catch (err) {
        console.log(`[ERROR] [401] Ошибка в onAny: ${err.message}`);
      }
    }

    // Обычные слушатели
    const listeners = this.listenersMap.get(event) || [];
    for (const { listener } of listeners) {
      try {
        listener(...args);
      } catch (err) {
        this.metrics[event].errors++;
        console.log(`[ERROR] [401] Ошибка в слушателе "${event}": ${err.message}`);
      }
    }
    return true;
  }

  getMetrics() {
    return { group: '401', events: this.metrics, total: Object.values(this.metrics).reduce((acc, m) => acc + m.count, 0) };
  }
}

function task5() {
  const bus = new EventBus();

  console.log('=== EventBus (группа 401) ===');
  
  console.log('\n--- Структура проекта ---');
  console.log('events-lab.js (bin)');
  console.log('├── tasks/ (commands)');
  console.log('├── services/');
  console.log('└── utils/');

  console.log('\n--- Приоритеты ---');
  bus.on('priority', () => console.log('[priority 0] Низкий приоритет'), 0);
  bus.on('priority', () => console.log('[priority 10] Высокий приоритет'), 10);
  bus.on('priority', () => console.log('[priority 5] Средний приоритет'), 5);
  bus.emit('priority');

  console.log('\n--- Wildcard ---');
  bus.on('onAny', (event, args) => console.log(`[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`));
  bus.emit('greet', 'Иван');
  bus.emit('info', '401');

  console.log('\n--- Once-кэш ---');
  let onceCount = 0;
  bus.once('tick', () => { onceCount++; console.log(`[tick] Вызов ${onceCount}`); });
  bus.emit('tick');
  bus.emit('tick');
  bus.emit('tick');
  console.log(`once-слушатель вызван: ${onceCount} раз`);

  console.log('\n--- Обработка ошибок ---');
  bus.on('test', () => { throw new Error('Тестовая ошибка'); });
  bus.on('test', () => console.log('Второй слушатель работает'));
  bus.emit('test');
  bus.emit('test2');

  console.log('\n--- Интеграция с os ---');
  console.log(`Платформа: ${os.platform()}`);
  console.log(`Свободно памяти: ${(os.freemem() / (1024 ** 3)).toFixed(2)} ГБ`);


  console.log('\n--- Метрики ---');
  console.log(JSON.stringify(bus.getMetrics(), null, 2));

  console.log('\n--- HTTP-сервер ---');
  console.log('Сервер запущен на http://localhost:3000/metrics');
  console.log('Нажмите Ctrl+C для выхода.');
  
  const server = http.createServer((req, res) => {
    if (req.url === '/metrics') {
      bus.emit('request');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(bus.getMetrics(), null, 2));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  server.listen(3000);
}


switch (taskArg) {
  case '1': task1(); break;
  case '2': task2(); break;
  case '3': task3(); break;
  case '4': task4(); break;
  case '5': task5(); break;
  default: console.log('Укажите --task <1|2|3|4|5>');
}