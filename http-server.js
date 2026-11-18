const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const selfsigned = require('selfsigned');

const PORT = 3000;
const HTTPS_PORT = 3443;
const GROUP = '401';
const MAX_BODY_SIZE = 1024 * 1024;

let students = [
  { id: 1, name: 'Иван', group: '401' },
  { id: 2, name: 'Мария', group: '401' }
];

let metrics = { total: 0, byMethod: {}, byStatus: {} };

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const sendJSON = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'X-Group': GROUP });
  res.end(JSON.stringify(data));
};

const sendHTML = (res, status, html) => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'X-Group': GROUP });
  res.end(html);
};

const logRequest = (req, res) => {
  const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${date}] [${GROUP}] ${req.method} ${req.url} ${res.statusCode}`);
  metrics.total++;
  metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;
  metrics.byStatus[res.statusCode] = (metrics.byStatus[res.statusCode] || 0) + 1;
};

const server = http.createServer((req, res) => {
  const baseURL = `http://${req.headers.host || 'localhost'}`;
  const parsedUrl = new URL(req.url, baseURL);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.on('finish', () => logRequest(req, res));

  if (method === 'GET' && pathname === '/') {
    return sendHTML(res, 200, `<h1>=== Лабораторная работа №20 ===</h1><p>Группа: ${GROUP}</p>`);
  }

  if (method === 'GET' && pathname === '/about') {
    return sendHTML(res, 200, `<h1>=== О студенте ===</h1><p>Группа: ${GROUP}</p><p>Студент: Грицев Марк</p>`);
  }

  if (method === 'GET' && pathname === '/headers') {
    return sendJSON(res, 200, { headers: req.headers, method, url: req.url, httpVersion: req.httpVersion });
  }

  if (method === 'GET' && pathname === '/headers/set') {
    res.setHeader('X-Powered-By', 'Node.js');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Group', GROUP);
    res.writeHead(200);
    return res.end('<h1>Заголовки установлены</h1>');
  }

  if (method === 'GET' && pathname === '/headers/check') {
    return sendJSON(res, 200, { hasContentType: !!req.headers['content-type'], hasXGroup: !!req.headers['x-group'], hasUnknown: !!req.headers['x-unknown'] });
  }

  if (method === 'POST' && (pathname === '/echo' || pathname === '/form')) {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        sendJSON(res, 413, { error: 'Payload Too Large' });
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      const contentType = req.headers['content-type'] || '';
      console.log(`[LOG] Размер тела: ${size} байт, Content-Type: ${contentType}`);
      if (pathname === '/form') return sendJSON(res, 200, Object.fromEntries(new URLSearchParams(body)));
      if (contentType.includes('application/json')) {
        try {
          const json = JSON.parse(body);
          json.group = GROUP;
          return sendJSON(res, 200, json);
        } catch (e) {
          return sendJSON(res, 400, { error: 'Invalid JSON' });
        }
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'X-Group': GROUP });
        return res.end(body);
      }
    });
    return;
  }

  if (pathname.startsWith('/api/students')) {
    if (method === 'GET' && pathname === '/api/students') {
      const groupFilter = parsedUrl.searchParams.get('group');
      let result = students;
      if (groupFilter) result = students.filter(s => s.group === groupFilter);
      return sendJSON(res, 200, result);
    }
    if (method === 'GET' && pathname.match(/^\/api\/students\/\d+$/)) {
      const student = students.find(s => s.id === parseInt(pathname.split('/')[3]));
      if (!student) return sendJSON(res, 404, { error: 'Not Found' });
      return sendJSON(res, 200, student);
    }
    if (method === 'POST' && pathname === '/api/students') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newStudent = { id: students.length + 1, ...data };
          students.push(newStudent);
          return sendJSON(res, 201, newStudent);
        } catch (e) {
          return sendJSON(res, 400, { error: 'Bad Request' });
        }
      });
      return;
    }
    if (method === 'PUT' && pathname.match(/^\/api\/students\/\d+$/)) {
      const id = parseInt(pathname.split('/')[3]);
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const student = students.find(s => s.id === id);
        if (!student) return sendJSON(res, 404, { error: 'Not Found' });
        try {
          Object.assign(student, JSON.parse(body));
          return sendJSON(res, 200, student);
        } catch (e) {
          return sendJSON(res, 400, { error: 'Bad Request' });
        }
      });
      return;
    }
    if (method === 'DELETE' && pathname.match(/^\/api\/students\/\d+$/)) {
      const id = parseInt(pathname.split('/')[3]);
      const index = students.findIndex(s => s.id === id);
      if (index === -1) return sendJSON(res, 404, { error: 'Not Found' });
      students.splice(index, 1);
      return sendJSON(res, 200, { deleted: true, id });
    }
    return sendJSON(res, 405, { error: 'Method Not Allowed' });
  }

  if (method === 'GET' && pathname === '/metrics') {
    return sendJSON(res, 200, { group: GROUP, total: metrics.total, byMethod: metrics.byMethod, byStatus: metrics.byStatus, uptime: process.uptime() });
  }

  if (method === 'GET' && pathname === '/stream') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html', 'X-Group': GROUP });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return;
  }

  if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/static/')) {
    const filePath = pathname.replace('/static/', '');
    
    if (filePath.includes('..')) {
      return sendHTML(res, 403, '<h1>403 Forbidden</h1>');
    }

    const publicDir = path.join(__dirname, 'public');
    const fullPath = path.join(publicDir, filePath);

    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath);
      const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[ext] || 'text/plain';
      
      const stat = fs.statSync(fullPath);
      const etag = `"${stat.size}-${stat.mtime.getTime()}"`;
      
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { 'X-Group': GROUP });
        return res.end();
      }

      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'max-age=60', 'ETag': etag, 'X-Group': GROUP });
      if (method === 'HEAD') return res.end();
      return fs.createReadStream(fullPath).pipe(res);
    }
  }

  sendHTML(res, 404, `<h1>=== 404 Not Found ===</h1><p>Путь ${pathname} не найден</p>`);
});

const httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Group': GROUP });
  res.end(`<h1>=== HTTPS работает! ===</h1><p>Группа: ${GROUP}</p>`);
});

server.listen(PORT, () => {
  console.log(`[INFO] HTTP-сервер запущен на порту ${PORT}`);
});
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`[INFO] HTTPS-сервер запущен на порту ${HTTPS_PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n[INFO] Завершение работы серверов...');
  server.close();
  httpsServer.close();
  process.exit(0);
});