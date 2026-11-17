const http = require('http');
const EventEmitter = require('events');
const logger = require('./logger');


class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
  }

  start(port) {
    this.server = http.createServer((req, res) => {
      this.emit('request:received', { url: req.url, method: req.method });

      if (req.method === 'GET' && req.url.startsWith('/order/')) {
        const orderId = req.url.split('/')[2];
        this.emit('process:order', orderId);
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Заказ #${orderId} принят в обработку!`);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Hello from Event-Driven Server!');
    });

    this.server.listen(port, () => {
      this.emit('server:started', port);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        this.emit('server:stopped');
      });
    }
  }
}


class OrderHandler extends EventEmitter {
  constructor() {
    super();
    
    this.on('order:complete', (data) => {
      let sum = 0;
      let sign = 1;
      let denominator = 1;
      let prev = 0;
      const epsilon = Math.pow(10, -7);

      while (prev === 0 || Math.abs(sum - prev) > epsilon) {
        prev = sum;
        sum += sign / denominator;
        sign *= -1;
        denominator += 2;
      }
      const pi = (sum * 4).toFixed(7);

      console.log(`💰 Заказ #${data.orderId} завершён на сумму ${data.sum} руб. PI = ${pi}`);
    });
  }

  processOrder(orderId) {
    console.log(`[order:start] Заказ #${orderId} начат`);
    
    setTimeout(() => {
      console.log(`[order:processing] Заказ #${orderId}: Идёт обработка...`);
      
      setTimeout(() => {
        const randomSum = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
        this.emit('order:complete', { orderId, sum: randomSum });
      }, 2000);
      
    }, 2000);
  }
}


class UserTracker extends EventEmitter {
  constructor() {
    super();
    this.on('user:action', (data) => {
      console.log(`👤 Пользователь ${data.userId} совершил действие "${data.action}"`);
      console.log(`   Время: ${data.timestamp}`);
      console.log(`   ID события: ${data.id}`);
      console.log(`   Доп. данные: ${JSON.stringify(data.metadata)}`);
      console.log('---');
    });
  }

  trackAction(userId, action, metadata) {
    const eventData = {
      userId: userId,
      action: action,
      timestamp: new Date().toISOString(),
      metadata: metadata,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.emit('user:action', eventData);
  }
}


const app = new AppServer();
const orderHandler = new OrderHandler();
const userTracker = new UserTracker();

logger.setupLogger(app);

app.on('process:order', (orderId) => {
  orderHandler.processOrder(orderId);
});

app.on('server:started', (port) => console.log(`🚀 Сервер запущен на порту ${port}`));
app.on('server:stopped', () => console.log('🛑 Сервер остановлен'));
app.on('request:received', (req) => console.log(`📨 Получен запрос: ${req.method} ${req.url}`));

app.start(3000);

userTracker.trackAction(42, 'login', { ip: '192.168.1.1', browser: 'Chrome' });
userTracker.trackAction(42, 'click', { element: 'buy-button', page: 'catalog' });
setTimeout(() => {
  app.stop();
  
  
  setTimeout(() => {
    process.exit(0);
  }, 500);
}, 10000);