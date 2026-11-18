const os = require('os');
const fs = require('fs');

const args = process.argv.slice(2);
const taskArg = args.includes('--task') ? args[args.indexOf('--task') + 1] : '1';


function task1() {
  console.log('=== Информация о системе (группа 401) ===');
  console.log(`Платформа: ${os.platform()}`);
  console.log(`Тип ОС: ${os.type()}`);
  console.log(`Архитектура: ${os.arch()}`);
  console.log(`Версия ОС: ${os.release()}`);
  console.log(`Имя хоста: ${os.hostname()}`);
  
  const uptime = os.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек`);

  const platform = os.platform();
  if (platform === 'win32') console.log('Вы работаете в Windows');
  else if (platform === 'linux') console.log('Вы работаете в Linux');
  else if (platform === 'darwin') console.log('Вы работаете в macOS');
  else console.log('Неизвестная платформа');
}


function task2() {
  const cpus = os.cpus();
  const totalMem = os.totalmem() / (1024 ** 3);
  const freeMem = os.freemem() / (1024 ** 3);
  const usedMem = totalMem - freeMem;
  const memPercent = (usedMem / totalMem) * 100;

  console.log('=== Информация о процессоре ===');
  console.log(`Количество логических ядер: ${cpus.length}`);
  console.log(`Модель процессора: ${cpus[0].model}`);
  const avgSpeed = cpus.reduce((acc, cpu) => acc + cpu.speed, 0) / cpus.length;
  console.log(`Средняя частота: ${Math.round(avgSpeed)} МГц`);

  console.log('\n=== Информация о памяти ===');
  console.log(`Общий объём: ${totalMem.toFixed(2)} ГБ`);
  console.log(`Свободно: ${freeMem.toFixed(2)} ГБ`);
  console.log(`Использовано: ${usedMem.toFixed(2)} ГБ (${memPercent.toFixed(1)}%)`);
  console.log(`Группа: 401`);

  if (freeMem < totalMem * 0.2) {
    console.log('⚠ ВНИМАНИЕ: Свободной памяти меньше 20%!');
  } else {
    console.log('Память в норме');
  }

  console.log('\n=== Средняя загрузка ===');
  const loadAvg = os.loadavg();
  if (os.platform() === 'win32') {
    console.log('Средняя загрузка недоступна на Windows');
  } else {
    console.log(`За 1 мин: ${loadAvg[0].toFixed(2)}`);
    console.log(`За 5 мин: ${loadAvg[1].toFixed(2)}`);
    console.log(`За 15 мин: ${loadAvg[2].toFixed(2)}`);
  }
}

function task3() {
  const networkInterfaces = os.networkInterfaces();
  let mainInterface = null;

  console.log('=== Сетевые интерфейсы ===');
  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    for (const iface of interfaces) {
      if (iface.family === 'IPv4') {
        const maskedMac = iface.mac === '00:00:00:00:00:00' ? '00:00:00:00:00:00' : iface.mac.replace(/:[^:]*:[^:]*:[^:]*$/, ':**:**:**');
        console.log(`Интерфейс: ${name}`);
        console.log(`IPv4: ${iface.address}`);
        console.log(`MAC: ${maskedMac}`);
        console.log(`Внутренний: ${iface.internal ? 'да' : 'нет'}`);
        
        if (!iface.internal && !mainInterface) mainInterface = { name, address: iface.address };
      }
    }
  }
  
  const ifaceCount = Object.keys(networkInterfaces).length;
  console.log(`Всего интерфейсов: ${ifaceCount}`);
  
  if (mainInterface) {
    console.log(`Основной интерфейс: ${mainInterface.name} (${mainInterface.address})`);
  }

  console.log('\n=== Информация о пользователе ===');
  const userInfo = os.userInfo();
  console.log(`Имя пользователя: ${userInfo.username}`);
  console.log(`UID: ${userInfo.uid}`);
  console.log(`Домашняя директория: ${userInfo.homedir}`);
  console.log(`Группа: 401`);
  console.log(`Проверка root: ${userInfo.username === 'root' ? 'Да (ВЫ ROOT!)' : 'Нет'}`);
}


function task4() {
  console.log('Мониторинг (группа 401). Нажмите Ctrl+C для выхода.');
  let warnings = 0;
  

  const snapshot = {
    timestamp: new Date().toISOString(),
    group: '401',
    platform: os.platform(),
    cpus: os.cpus().length,
    totalMem: os.totalmem()
  };
  console.log('Первичный сбор данных выполнен:', snapshot.timestamp);

  // Логирование
  const logFile = 'monitor.log';
  const logWarning = (msg) => {
    warnings++;
    const logMsg = `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] [401] Предупреждение: ${msg}\n`;
    fs.appendFileSync(logFile, logMsg);
  };


  let startMeasure = os.cpus();
  
  const interval = setInterval(() => {
    const endMeasure = os.cpus();
    let totalDiff = 0;
    let idleDiff = 0;

    for (let i = 0; i < startMeasure.length; i++) {
      const startTimes = startMeasure[i].times;
      const endTimes = endMeasure[i].times;
      
      const total = (endTimes.user + endTimes.nice + endTimes.sys + endTimes.idle + endTimes.irq) - 
                    (startTimes.user + startTimes.nice + startTimes.sys + startTimes.idle + startTimes.irq);
      const idle = endTimes.idle - startTimes.idle;
      
      totalDiff += total;
      idleDiff += idle;
    }

    const cpuLoad = ((totalDiff - idleDiff) / totalDiff) * 100;
    startMeasure = endMeasure;

    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(2);
    const memPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(1);

    let status = '';
    if (cpuLoad > 80) {
      status = '⚠⚠ КРИТИЧНО';
      logWarning(`CPU загрузка: ${cpuLoad.toFixed(1)}%`);
    } else if (cpuLoad > 50) {
      status = '⚠';
      logWarning(`CPU загрузка: ${cpuLoad.toFixed(1)}%`);
    }

    if (freeMem < totalMem * 0.1) {
      logWarning('Свободной памяти меньше 10%');
      status += ' ⚠ RAM';
    }

  
    process.stdout.write(`\rCPU: ${cpuLoad.toFixed(1)}% | RAM: ${memPercent}% (${freeMemGB} ГБ свободно) ${status}`);
  }, 2000);

  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(`\nМониторинг остановлен. Предупреждений: ${warnings}`);
    process.exit(0);
  });
}


switch (taskArg) {
  case '1': task1(); break;
  case '2': task2(); break;
  case '3': task3(); break;
  case '4': task4(); break;
  default: console.log('Укажите --task <1|2|3|4>');
}