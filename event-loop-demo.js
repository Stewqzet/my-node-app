console.log('--- Старт скрипта ---');

setTimeout(() => {
  console.log('1. setTimeout');
}, 0);

setImmediate(() => {
  console.log('2. setImmediate');
});

process.nextTick(() => {
  console.log('3. process.nextTick');
});

Promise.resolve().then(() => {
  console.log('4. Promise.then');
});

console.log('5. Синхронный код');

/*
ОБЪЯСНЕНИЕ ПОРЯДКА ВЫВОДА:
1. "5. Синхронный код" — выполняется первым, так как это синхронный код.
2. "3. process.nextTick" — выполняется сразу после текущей операции, ДО фазы таймеров и промисов.
3. "4. Promise.then" — выполняется в фазе микрозадач (microtasks), сразу после nextTick.
4. "1. setTimeout" — таймер с 0 мс срабатывает в следующей фазе (timers) после микрозадач.
5. "2. setImmediate" — срабатывает в фазе check, которая наступает ПОСЛЕ фазы timers.
*/