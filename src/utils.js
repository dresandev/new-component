/*
Utils are general building blocks. Platform-specific, but not
application-specific

They're useful for abstracting away the configuration for native methods,
or defining new convenience methods for things like working with files,
data munging, etc.

NOTE: Utils should be general enough to be useful in any Node application.
For application-specific concerns, use `helpers.js`.
*/
import fs from 'fs';
import { join } from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const requireOptional = async (filePath) => {
  try {
    return await import(filePath);
  } catch (e) {
    // Queremos ignorar los errores 'MODULE_NOT_FOUND', ya que esto solo significa
    // que el usuario no ha configurado un archivo de sobrecargas global.
    // Todos los demás errores deben lanzarse como se espera.
    if (e.code !== 'ERR_MODULE_NOT_FOUND') {
      throw e;
    }
  }
};

export const mkDirPromise = (dirPath) =>
  new Promise((resolve, reject) => {
    fs.mkdir(dirPath, (err) => {
      err ? reject(err) : resolve();
    });
  });

// Simple promise wrappers for read/write files.
// utf-8 is assumed.
export const readFilePromise = (fileLocation) =>
  new Promise((resolve, reject) => {
    fs.readFile(fileLocation, 'utf-8', (err, text) => {
      err ? reject(err) : resolve(text);
    });
  });

export const writeFilePromise = (fileLocation, fileContent) =>
  new Promise((resolve, reject) => {
    fs.writeFile(fileLocation, fileContent, 'utf-8', (err) => {
      err ? reject(err) : resolve();
    });
  });

// Somewhat counter-intuitively, `fs.readFile` works relative to the current
// working directory (if the user is in their own project, it's relative to
// their project). This is unlike `require()` calls, which are always relative
// to the code's directory.
export const readFilePromiseRelative = (fileLocation) =>
  readFilePromise(join(__dirname, fileLocation));

export const sample = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};
