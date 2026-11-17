const FileManager = require('./fileOperations');
const FileManagerPromises = require('./fileOperationsPromises');

/**
 * Гибридный модуль, поддерживающий колбэки и промисы
 */
class FileManagerMixed {
  constructor(baseDir = './data-mixed') {
    // Используем уже готовые классы из Заданий 1 и 2
    this.callbackManager = new FileManager(baseDir);
    this.promiseManager = new FileManagerPromises(baseDir);
  }

  // Метод с колбэком
  createFileCallback(filename, content, callback) {
    this.callbackManager.createFile(filename, content, callback);
  }

  // Тот же метод, но возвращает промис
  async createFilePromise(filename, content) {
    return await this.promiseManager.createFile(filename, content);
  }

  // Смешанный метод: возвращает промис, но может вызывать колбэк, если он передан
  readFileMixed(filename, callback) {
    const promise = this.promiseManager.readFile(filename);
    
    if (callback) {
      promise.then(data => callback(null, data)).catch(err => callback(err));
    }
    
    return promise;
  }
}

module.exports = FileManagerMixed;