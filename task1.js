const fs = require('fs').promises;
const path = require('path');

async function task1() {
  const fileName = 'student_3.txt';
  const filePath = path.join(__dirname, fileName);
  
  try {
    const now = new Date().toLocaleString('ru-RU');
    const content = `Студент: Грицев Марк\nГруппа: 401\nВариант: 3\nДата: ${now}\nЛюбимые книги:\n1. "Война и мир" - Л. Толстой\n2. "Преступление и наказание" - Ф. Достоевский\n3. "Мастер и Маргарита" - М. Булгаков\n4. "1984" - Дж. Оруэлл\n5. "Гарри Поттер" - Дж. Роулинг\n`;
    
    // 1. Создание и запись файла
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Создан файл: ${fileName}`);
    
    // 2. Подсчет строк и добавление в конец
    const data = await fs.readFile(filePath, 'utf8');
    const linesCount = data.split('\n').filter(line => line.trim() !== '').length;
    
    // Добавляем строку с количеством
    await fs.appendFile(filePath, `Количество записей: ${linesCount}\n`, 'utf8');
    
    // 3. Чтение и вывод
    const finalData = await fs.readFile(filePath, 'utf8');
    console.log('\nСодержимое файла:');
    console.log('─────────────────────────────────');
    console.log(finalData.trim());
    console.log('─────────────────────────────────');
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

task1();