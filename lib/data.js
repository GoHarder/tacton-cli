/**
 * @module data
 * A module for storing and editing data
 */

// Node Dependencies
const { defaultCipherList } = require('constants');
const fs = require('fs');
const path = require('path');

// Container for the module
const lib = {};

// Base directory
lib.baseDir = process.cwd();

/** Lists everything in a directory */
lib.list = () => fs.readdirSync(lib.baseDir);

/** Lists all the tcx files in a directory */
lib.listTCX = () => {
   let dirs = [lib.baseDir];
   let files = [];
   let i = 0;

   do {
      let subDirs = fs.readdirSync(dirs[i]);

      let tcx = subDirs
         .filter((item) => {
            return item.match(/\.tcx/gm);
         })
         .map((item) => {
            return path.relative(lib.baseDir, path.join(dirs[i], item));
         });

      files = [...files, ...tcx];

      subDirs = subDirs
         .filter((item) => {
            return !item.match(/\..+/gm);
         })
         .map((item) => {
            return path.join(dirs[i], item);
         });

      dirs = [...dirs, ...subDirs];

      i++;
   } while (i < dirs.length);

   return files;
};

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
lib.read = (fileName) => fs.readFileSync(`${lib.baseDir}/${fileName}`, 'utf8');

/**
 * Checks if a file exists
 * @param {string} fileName The name of the file
 */
lib.exist = (fileName) => fs.existsSync(`${lib.baseDir}/${fileName}`);

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

/**
 * Watches the files in the directory and returns a file name when there is a change
 * @param {function} callback The callback function that returns the file name
 */
lib.watch = (callback) => {
   console.log('\x1b[96m%s\x1b[0m', `Watching files...`);

   setInterval(() => {
      console.log('\x1b[96m%s\x1b[0m', `Still watching files...`);
   }, 30 * 60 * 1000);

   let wait = false;

   fs.watch(process.cwd(), { recursive: true }, (event, fileName) => {
      if (fileName) {
         if (wait) return;

         wait = setTimeout(() => {
            wait = false;
         }, 100);

         if (event === 'change' && fileName.match(/\.tcx/gm)) {
            callback(fileName);
         }
      }
   });
};

// Export the module
module.exports = lib;
