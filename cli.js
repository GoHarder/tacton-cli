#!/usr/bin/env node

// Node Dependencies
const fs = require('fs');

// NPM Dependencies
const program = require('commander');
const { prompt } = require('inquirer');

// Local Dependencies
const data = require('./lib/data.js');
const tcx = require('./lib/tcx.js');
const backup = require('./lib/backup.js');
const { version } = require('./package.json');

// Instantiate the program
program.version(version).description('Tacton CLI Tools');

/** A list of all the files in the directory */
const allList = data.list();

/** A list of all the tcx files in the directory */
const tcxList = data.listFile(allList, 'tcx');

/**
 * Creates a file selection prompt
 * @param {string[]} choices The array of choices
 */
const selectFile = (choices, message = 'Select a file:') => {
   return {
      type: 'list',
      name: 'file',
      message,
      choices: choices,
      pageSize: choices.length,
   };
};

/**
 * Creates a prompt for the choices array
 * @param {string[]} choices The array of choices
 * @param {string} name The name of the property for the selections
 * @param {string} message The message that is sent to the user
 */
const selectCheckbox = (choices, name, message) => {
   return {
      type: 'checkbox',
      name,
      message,
      choices,
      pageSize: choices.length,
      validate: (res) => (res.length < 1 ? 'Error: no selection made' : true),
   };
};

/** The prompt for a file name */
const getFileName = {
   type: 'input',
   name: 'fileName',
   message: 'Enter file name:',
   validate: (res) => (res.length < 1 ? 'Error: no file name entered' : true),
};

// The process to convert a class to a domain
program
   .command('class-to-domain')
   .description('convert classes to domains')
   .action(() => {
      if (tcxList.length === 0) {
         console.log('\x1b[31m%s\x1b[0m', `\nError: a tcx file does not exist`);
         return;
      }

      prompt(selectFile(tcxList)).then((res) => {
         const { file } = res;

         let readData = data.read(file);
         const req = selectCheckbox(tcx.listClasses(readData), 'classes', 'Select classes to convert:');

         prompt([req, getFileName]).then((res) => {
            const { classes, fileName } = res;

            readData = tcx.getClasses(readData);

            readData = readData.filter((_class) => classes.includes(_class.name._text));

            const namedDomains = readData.map((chunk) => {
               const elements = chunk.components.component;

               const element = elements.reduce((acc, item, value) => {
                  acc.push({ value, name: item.name._text, description: item.description._text });
                  return acc;
               }, []);

               return {
                  name: chunk.name._text,
                  elements: { element },
               };
            });

            const model = tcx.fromObj({ namedDomains });

            data.create(`${fileName}.tcx`, model);

            console.log('\x1b[32m%s\x1b[0m', `\n${fileName}.tcx was created`);
         });
      });
   });

// The process to convert a domain to a class
program
   .command('domain-to-class')
   .description('convert domains to classes')
   .action(() => {
      if (tcxList.length === 0) {
         console.log('\x1b[31m%s\x1b[0m', `\nError: a tcx file does not exist`);
         return;
      }

      prompt(selectFile(tcxList)).then((res) => {
         const { file } = res;

         let readData = data.read(file);
         const req = selectCheckbox(tcx.listDomains(readData), 'domains', 'Select domains to convert:');

         prompt([req, getFileName]).then((res) => {
            const { domains, fileName } = res;

            readData = tcx.getDomains(readData);

            readData = readData.filter((domain) => domains.includes(domain.name._text));

            const componentClasses = readData.map((chunk) => {
               const components = chunk.elements.element;

               const component = components.reduce((acc, item) => {
                  acc.push({ name: item.name._text, description: item.description._text, 'feature-values': {} });
                  return acc;
               }, []);

               return {
                  name: chunk.name._text,
                  description: chunk.name._text,
                  features: {},
                  components: { component },
               };
            });

            const model = tcx.fromObj({ componentClasses });

            data.create(`${fileName}.tcx`, model);

            console.log('\x1b[32m%s\x1b[0m', `\n${fileName}.tcx was created`);
         });
      });
   });

program
   .command('backup')
   .description('backup tcx file data')
   .action(() => {
      prompt(selectFile(tcxList)).then((res) => {
         const { file } = res;

         backup.create(file);
      });
   });

program
   .command('restore')
   .description('restore tcx file data')
   .action(() => {
      prompt(selectFile(tcxList)).then((res) => {
         const { file } = res;

         backup.restore(file);
      });
   });

program
   .command('watch')
   .description('watches a directory and maintains files')
   .action(() => {
      const tcxFiles = data.listTCX();

      tcxFiles.forEach((file) => {
         const backupFileName = file.replace('.tcx', '_backup.json');

         if (!data.exist(backupFileName)) {
            backup.create(file);
         }
      });

      data.watch((fileName) => {
         const backupFileName = fileName.replace('.tcx', '_backup.json');

         setTimeout(() => {
            let fileData = data.read(fileName);

            fileData = tcx.toJs(fileData);

            const editor = fileData['model-data'].identification['edited-with']._text;

            if (editor.match(/^TCStudio/gm)) {
               if (data.exist(backupFileName)) {
                  data.delete(backupFileName);
               }
               backup.create(fileName, 'updated');
            }

            if (editor.match(/Excel/gm)) {
               backup.restore(fileName, false);
               data.delete(backupFileName);
               backup.create(fileName, 'updated');
            }
         }, 250);
      });
   });

program.parse(process.argv);
