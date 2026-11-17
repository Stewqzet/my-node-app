const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(compression());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже', status: 429 }
});
app.use(limiter);

// Логирование
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${date}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

app.get('/', (req, res) => {
  const now = new Date().toLocaleString('ru-RU');
  res.send(`
    <h1>Лабораторная работа №16</h1>
    <p><strong>Группа:</strong> 401</p>
    <p><strong>Дата и время:</strong> ${now}</p>
    <p>Добро пожаловать на сервер Express.js!</p>
    <h3>Доступные маршруты:</h3>
    <ul>
      <li><a href="/about">/about</a></li>
      <li><a href="/contacts">/contacts</a></li>
      <li><a href="/api/books">/api/books</a></li>
      <li><a href="/api-docs">/api-docs</a></li>
    </ul>
  `);
});

app.get('/about', (req, res) => {
  res.send(`<h1>О разработчике</h1><p>Студент: Грицев Марк, группа 401</p>`);
});

app.get('/contacts', (req, res) => {
  res.send(`<h1>Контакты</h1><p>Email: mark@example.com</p>`);
});


let books = [
  { id: 1, title: 'Война и мир', author: 'Толстой', year: 1869, genre: 'роман', isbn: '978-5-04-116410-2', available: true, reviews: [] },
  { id: 2, title: 'Преступление и наказание', author: 'Достоевский', year: 1866, genre: 'роман', isbn: '978-5-04-116411-9', available: true, reviews: [] }
];
let nextBookId = 3;


const titles = ['Мастер и Маргарита', '1984', 'Гарри Поттер', 'Идиот', 'Отцы и дети'];
const authors = ['Булгаков', 'Оруэлл', 'Роулинг', 'Достоевский', 'Тургенев'];
const genres = ['роман', 'фантастика', 'фэнтези', 'классика'];
for (let i = 0; i < 100; i++) {
  books.push({
    id: nextBookId++,
    title: titles[i % titles.length] + ' ' + (i + 1),
    author: authors[i % authors.length],
    year: 1800 + (i % 200),
    genre: genres[i % genres.length],
    isbn: `978-5-04-${100000 + i}`,
    available: i % 2 === 0,
    reviews: []
  });
}


const users = [];
const JWT_SECRET = 'secret-key';

app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, email, password: hashedPassword, name, role: 'user' });
  res.status(201).json({ message: 'Пользователь зарегистрирован' });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});


const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Требуется токен' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Library API', version: '1.0.0', description: 'API для управления библиотекой' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./express-server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/books', (req, res) => {
  let result = [...books];
  const { author, year, yearFrom, yearTo, limit, page, sort, search } = req.query;

  if (author) result = result.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
  if (year) result = result.filter(b => b.year === parseInt(year));
  if (yearFrom) result = result.filter(b => b.year >= parseInt(yearFrom));
  if (yearTo) result = result.filter(b => b.year <= parseInt(yearTo));
  if (search) result = result.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

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
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const startIndex = (pageNum - 1) * limitNum;
  result = result.slice(startIndex, startIndex + limitNum);

  res.json({ total, page: pageNum, limit: limitNum, data: result });
});


app.get('/api/books/stats', (req, res) => {
  const total = books.length;
  const byAuthor = {};
  const byGenre = {};
  let oldest = Infinity;
  let newest = -Infinity;

  books.forEach(b => {
    byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
    byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
    if (b.year < oldest) oldest = b.year;
    if (b.year > newest) newest = b.year;
  });

  res.json({ total, byAuthor, byGenre, oldestYear: oldest, newestYear: newest });
});

app.get('/api/books/search', (req, res) => {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Укажите автора' });
  const result = books.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
  res.json(result);
});


app.get('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  res.json(book);
});

app.post('/api/books', authenticate, (req, res) => {
  const { title, author, year, genre } = req.body;
  if (!title || !author || !year) return res.status(400).json({ error: 'Невалидные данные' });
  if (books.find(b => b.title === title && b.author === author)) {
    return res.status(400).json({ error: 'Книга уже существует' });
  }
  const newBook = { id: nextBookId++, title, author, year, genre: genre || 'неизвестно', isbn: '000-0-00-000000-0', available: true, reviews: [] };
  books.push(newBook);
  res.status(201).json(newBook);
});


app.put('/api/books/:id', authenticate, (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Книга не найдена' });
  Object.assign(book, req.body);
  res.json(book);
});

app.delete('/api/books/:id', authenticate, (req, res) => {
  const index = books.findIndex(b => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Книга не найдена' });
  books.splice(index, 1);
  res.json({ message: 'Книга удалена' });
});


app.get('/api/books/available', (req, res) => {
  res.json(books.filter(b => b.available));
});

app.get('/api/books/export', authenticate, (req, res) => {
  const csv = 'id,title,author,year\n' + books.map(b => `${b.id},${b.title},${b.author},${b.year}`).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('books.csv');
  res.send(csv);
});

app.post('/api/books/:id/reviews', authenticate, (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Книга не найдена' });
  book.reviews.push({ user: req.user.id, text: req.body.text, date: new Date() });
  res.json(book);
});

app.get('/api/books/recommendations', authenticate, (req, res) => {
  const genre = req.query.genre || 'роман';
  res.json(books.filter(b => b.genre === genre).slice(0, 5));
});

app.get('/error', (req, res) => { throw new Error('Тестовая ошибка'); });
app.get('/async-error', async (req, res) => { await new Promise((_, reject) => setTimeout(() => reject(new Error('Асинхронная ошибка')), 100)); });


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера', status: 500 });
});


app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`Документация: http://localhost:${PORT}/api-docs`);
});