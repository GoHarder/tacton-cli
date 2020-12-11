#!/usr/bin/env node

// NPM Dependencies
const program = require('commander');
const { prompt } = require('inquirer');
const { read } = require('./lib/data.js');

// Local Dependencies
const data = require('./lib/data.js');
const tcx = require('./lib/tcx.js');
const { version } = require('./package.json');

// Instantiate the program
program.version(version).description('Tacton CLI Tools');

/** A list of all the files in the directory */
const allList = data.list();

/** A list of all the data files in the directory */
const dataList = data.listData();

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
      if (allList.length === 0) {
         console.log('Error: no .tcx files in directory');
         return;
      }

      prompt(selectFile(allList)).then((res) => {
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

            data.create(fileName, model);
         });
      });
   });

// The process to convert a domain to a class
program
   .command('domain-to-class')
   .description('convert domains to classes')
   .action(() => {
      if (allList.length === 0) {
         console.log('Error: no .tcx files in directory');
         return;
      }

      prompt(selectFile(allList)).then((res) => {
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

            data.create(fileName, model);
         });
      });
   });

// The process to create a backup of a files domains
program
   .command('backup-domain')
   .description('backup domains from a data file')
   .action(() => {
      if (dataList.length === 0) {
         console.log('Error: no _data.tcx files in directory');
         return;
      }

      prompt(selectFile(dataList)).then((res) => {
         const { file } = res;

         let fileName = file.replace('_data', '_domain_backup');

         fileName = fileName.substring(0, fileName.length - 4);

         if (allList.includes(`${fileName}.tcx`)) {
            data.delete(fileName, false);
         }

         const readData = data.read(file);

         const namedDomains = tcx.getDomains(readData);

         const model = tcx.fromObj({ namedDomains });

         data.create(fileName, model);
      });
   });

program
   .command('restore-domain')
   .description('restore the domains from a backup file')
   .action(() => {
      prompt(selectFile(dataList)).then((res) => {
         let { file } = res;

         const backupFile = file.replace('_data', '_domain_backup');

         const readData = data.read(file);
         const backup = data.read(backupFile);

         const componentClasses = tcx.toJs(readData)['model-data'].model['component-classes']['component-class'];
         const namedDomains = tcx.toJs(backup)['model-data'].model['named-domains']['named-domain'];

         const model = tcx.fromObj({ namedDomains, componentClasses });

         file = file.substring(0, file.length - 4);

         data.delete(file, false);

         data.create(file, model);
      });
   });

program.parse(process.argv);
