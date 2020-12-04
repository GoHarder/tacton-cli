#!/usr/bin/env node

// NPM Dependencies
const program = require('commander');
const { prompt } = require('inquirer');

// Local Dependencies
const data = require('./lib/data.js');
const tcx = require('./lib/tcx.js');

program.version('1.0.0').description('Tacton CLI Tools');

const selectFile = {
   type: 'list',
   name: 'file',
   message: 'Select a file:',
   choices: data.list(),
};

const selectClasses = (classes) => {
   return {
      type: 'checkbox',
      name: 'classes',
      message: 'Select classes to convert:',
      choices: classes,
      pageSize: classes.length,
      validate: (res) => (res.length < 1 ? 'Error: no selection made' : true),
   };
};

const getFileName = {
   type: 'input',
   name: 'fileName',
   message: 'Enter file name:',
   validate: (res) => (res.length < 1 ? 'Error: no file name entered' : true),
};

// program
//    .command('util')
//    .description('custom command')
//    .action(() => {
//       const dir = data.list();

//       prompt([selectFile]).then((res) => {
//          const { file } = res;

//          let readData = data.read(file);

//          readData = tcx.toJs(readData);

//          tcx.fromObj({});
//       });
//    });

program
   .command('class-to-domain')
   .description('convert classes to domains')
   .action(() => {
      prompt(selectFile).then((res) => {
         const { file } = res;

         let readData = data.read(file);
         const req = selectClasses(tcx.listClasses(readData));

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

program.parse(process.argv);
