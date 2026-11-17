const fs = require('fs').promises;
const path = require('path');

async function createDirWithInfo(dirPath, description, isOddVariant) {
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(path.join(dirPath, 'info.txt'), description, 'utf8');
  
  // Дополнительное условие для нечетного варианта (создать 3 папки в components)
  if (isOddVariant && dirPath.endsWith('components')) {
    for (let i = 1; i <= 3; i++) {
      await fs.mkdir(path.join(dirPath, i.toString()), { recursive: true });
    }
  }
}

async function printTree(dirPath, prefix = '') {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isLast = i === items.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    console.log(prefix + pointer + item.name);
    
    if (item.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      await printTree(path.join(dirPath, item.name), newPrefix);
    }
  }
}

async function task2() {
  const projectDir = path.join(__dirname, 'project_3');
  
  try {
    // 1. Создание структуры
    await createDirWithInfo(path.join(projectDir, 'src/modules'), 'Модули', true);
    await createDirWithInfo(path.join(projectDir, 'src/components'), 'Компоненты', true);
    await createDirWithInfo(path.join(projectDir, 'src/utils'), 'Утилиты', true);
    await createDirWithInfo(path.join(projectDir, 'data/input'), 'Входные данные', true);
    await createDirWithInfo(path.join(projectDir, 'data/output'), 'Выходные данные', true);
    await createDirWithInfo(path.join(projectDir, 'temp'), 'Временные файлы', true);
    
    // 3. Вывод дерева
    console.log('Исходная структура project_3:');
    await printTree(projectDir);
    
    // 4. Перемещение temp внутрь data
    await fs.rename(path.join(projectDir, 'temp'), path.join(projectDir, 'data/temp'));
    
    // 5. Переименование data/output в data/results
    await fs.rename(path.join(projectDir, 'data/output'), path.join(projectDir, 'data/results'));
    
    // 6. Удаление temp
    await fs.rm(path.join(projectDir, 'data/temp'), { recursive: true, force: true });
    
    // 7. Обновленное дерево
    console.log('\nОбновленная структура project_3:');
    await printTree(projectDir);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

task2();