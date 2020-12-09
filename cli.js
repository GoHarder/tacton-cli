#!/usr/bin/env node

// NPM Dependencies
const program = require('commander');
const { prompt } = require('inquirer');
const { read } = require('./lib/data.js');

// Local Dependencies
const data = require('./lib/data.js');
const tcx = require('./lib/tcx.js');

// Instantiate the program
program.version('1.0.1').description('Tacton CLI Tools');

/** A list of all the files in the directory */
const dir = data.list();

/** The main file selection prompt */
const selectFile = {
   type: 'list',
   name: 'file',
   message: 'Select a file:',
   choices: dir,
   pageSize: dir.length,
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

// program
//    .command('dev')
//    .description('development only command')
//    .action(() => {
//       // let readData = data.read('safety_model.tcx');

//       // readData = tcx.toJs(readData)['model-data'].model['component-classes']['component-class'];

//       // readData = readData[0].features.feature;

//       // console.log(readData);

//       let readData = data.read('blank.tcx');

//       readData = tcx.toJs(readData)['model-data'].model['component-classes']['component-class'];

//       console.log(readData.components.component);
//    });

// The main process to convert a class to a domain
program
   .command('class-to-domain')
   .description('convert classes to domains')
   .action(() => {
      if (dir.length === 0) {
         console.log('Error: no .tcx files in directory');
         return;
      }

      prompt(selectFile).then((res) => {
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

// The main process to convert a domain to a class
program
   .command('domain-to-class')
   .description('convert domains to classes')
   .action(() => {
      if (dir.length === 0) {
         console.log('Error: no .tcx files in directory');
         return;
      }

      prompt(selectFile).then((res) => {
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

program.parse(process.argv);
