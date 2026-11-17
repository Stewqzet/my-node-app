const fs = require('fs');

function setupLogger(app) {
  const logToFile = (eventName, data) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${eventName}: ${JSON.stringify(data)}\n`;
    
    fs.appendFile('logs.txt', logMessage, (err) => {
      if (err) console.error('Ошибка записи лога:', err);
    });
  };

  app.on('server:started', (port) => logToFile('server:started', { port }));
  app.on('server:stopped', () => logToFile('server:stopped', {}));
  app.on('request:received', (reqInfo) => logToFile('request:received', reqInfo));
}

module.exports = { setupLogger };