const http = require('http');


const STUDENT = {
  fullName: 'Грицев Марк Витальевич', 
  group: '401',                  
  journalNumber: 3                       
};


function calculatePi(digits) {
  const epsilon = Math.pow(10, -digits);
  let sum = 0;
  let sign = 1;
  let denominator = 1;
  let prev = 0;

  while (prev === 0 || Math.abs(sum - prev) > epsilon) {
    prev = sum;
    sum += sign / denominator;
    sign *= -1;
    denominator += 2;
  }
  return (sum * 4).toFixed(digits);
}

const server = http.createServer((req, res) => {
  const pi = calculatePi(STUDENT.journalNumber);
  const html = `
    <h1>${STUDENT.fullName}</h1>
    <h2>${STUDENT.group}</h2>
    <p>π = ${pi}</p>
  `;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});