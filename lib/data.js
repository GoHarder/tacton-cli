/**
 * @module data
 * A module for storing and editing data
 */

// Node Dependencies
var fs = require('fs');

// Container for the module
const lib = {};

// Base directory
lib.baseDir = process.cwd();

/** Lists all the files in a directory */
lib.list = () => fs.readdirSync(lib.baseDir);

/**
 * Lists all the files of a particular file type
 * @param {string[]} files A array of file names
 * @param {string} ext The tile extension
 */
lib.listFile = (files, ext) => {
   const regex = new RegExp(`\\.${ext}`, 'gm');

   return files.filter((item) => item.match(regex));
};

/**
 * Reads the data from a file
 * @param {string} fileName The name of the file
 */
lib.read = (fileName) => {
   const path = `${lib.baseDir}/${fileName}`;

   return fs.readFileSync(path, 'utf8');
};

/**
 * Creates a new file
 * @param {string} fileName The name of the file
 * @param {string} data The content of the file
 */
lib.create = (fileName, data) => {
   const file = fs.openSync(`${lib.baseDir}/${fileName}`, 'wx');

   fs.writeFileSync(file, data);
   fs.closeSync(file);
};

/**
 * Deletes a file
 * @param {string} fileName The name of the file
 * @param {boolean} log Show the deleted log
 */
lib.delete = (fileName) => fs.unlinkSync(`${lib.baseDir}/${fileName}`);

// Export the module
module.exports = lib;
