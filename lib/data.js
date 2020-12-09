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

/** Lists the .tcx files in a directory */
lib.list = () => {
   const dir = fs.readdirSync(lib.baseDir);
   const regex = /\.tcx/gm;

   return dir.filter((item) => item.match(regex));
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
   const file = fs.openSync(`${lib.baseDir}/${fileName}.tcx`, 'wx');

   fs.writeFileSync(file, data);

   fs.closeSync(file);

   console.log(`${fileName}.tcx was created`);
};

// Export the module
module.exports = lib;
