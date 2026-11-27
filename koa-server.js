const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${date}] ${ctx.method} ${ctx.url} - ${ms}ms`);
});


app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message || 'Внутренняя ошибка сервера',
      status: ctx.status
    };
    app.emit('error', err, ctx);
  }
});


app.use(bodyParser());


router.get('/', async (ctx) => {
  const now = new Date().toLocaleString('ru-RU');
  ctx.type = 'html';
  ctx.body = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Лабораторная работа №15</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
        </style>
    </head>
    <body>
        <h1>Лабораторная работа №15</h1>
        <p><strong>Группа:</strong> 401</p>
        <p><strong>Текущая дата и время:</strong> ${now}</p>
        <p>Добро пожаловать на сервер Koa.js!</p>
    </body>
    </html>
  `;
});


let users = [
  { id: 1, name: 'Иванов Иван', group: '401' },
  { id: 2, name: 'Петров Петр', group: '401' }
];
let nextUserId = 3;

router.get('/api/users', (ctx) => { ctx.body = users; });

router.post('/api/users', (ctx) => {
  const { name, group } = ctx.request.body;
  if (!name || !group) ctx.throw(400, 'Невалидные данные: name и group обязательны');
  const newUser = { id: nextUserId++, name, group };
  users.push(newUser);
  ctx.status = 201;
  ctx.body = newUser;
});

router.put('/api/users/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const user = users.find(u => u.id === id);
  if (!user) ctx.throw(404, 'Пользователь не найден');
  const { name, group } = ctx.request.body;
  if (name) user.name = name;
  if (group) user.group = group;
  ctx.body = user;
});

router.delete('/api/users/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const index = users.findIndex(u => u.id === id);
  if (index === -1) ctx.throw(404, 'Пользователь не найден');
  users.splice(index, 1);
  ctx.body = { message: 'Пользователь удален' };
});

router.get('/protected', async (ctx) => {
  if (!ctx.headers.authorization) ctx.throw(401, 'Неавторизованный доступ');
  ctx.body = { message: 'Доступ разрешен', data: 'Секретные данные' };
});

router.get('/error', async (ctx) => {
  ctx.throw(500, 'Внутренняя ошибка сервера');
});


const firstNames = ['Александр', 'Анна', 'Иван', 'Мария', 'Петр', 'Елена', 'Дмитрий', 'Ольга'];
const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Смирнова', 'Кузнецов', 'Попова'];
let students = [];
for (let i = 1; i <= 50; i++) {
  students.push({
    id: i,
    name: `${lastNames[i % lastNames.length]} ${firstNames[i % firstNames.length]}`,
    group: '401',
    course: (i % 4) + 1
  });
}
let nextStudentId = 51;

router.get('/students', (ctx) => {
  let result = [...students];
  const { group, limit, offset, sort, search } = ctx.query;

  if (group) result = result.filter(s => s.group === group);
  if (search) result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;
    result.sort((a, b) => {
      if (a[field] < b[field]) return isDesc ? 1 : -1;
      if (a[field] > b[field]) return isDesc ? -1 : 1;
      return 0;
    });
  }

  const total = result.length;
  if (limit || offset) {
    result = result.slice(parseInt(offset) || 0, (parseInt(offset) || 0) + (parseInt(limit) || 10));
  }

  ctx.body = { total, data: result };
});

router.get('/students/:id', (ctx) => {
  const student = students.find(s => s.id === parseInt(ctx.params.id));
  if (!student) ctx.throw(404, 'Студент не найден');
  ctx.body = student;
});

router.post('/students', (ctx) => {
  const { name, group, course } = ctx.request.body;
  if (!name || !group || !course) ctx.throw(400, 'Невалидные данные');
  const newStudent = { id: nextStudentId++, name, group, course };
  students.push(newStudent);
  ctx.status = 201;
  ctx.body = newStudent;
});

router.put('/students/:id', (ctx) => {
  const student = students.find(s => s.id === parseInt(ctx.params.id));
  if (!student) ctx.throw(404, 'Студент не найден');
  Object.assign(student, ctx.request.body);
  ctx.body = student;
});

router.delete('/students/:id', (ctx) => {
  const index = students.findIndex(s => s.id === parseInt(ctx.params.id));
  if (index === -1) ctx.throw(404, 'Студент не найден');
  students.splice(index, 1);
  ctx.body = { message: 'Студент удален' };
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});