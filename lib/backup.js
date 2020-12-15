/**
 * @module backup
 * A module for various backup tile tasks
 */

// Local Dependencies
const data = require('./data.js');
const tcx = require('./tcx.js');

/** A list of all the files in the directory */
const allList = data.list();

/** A list of all the json files in the directory */
const jsonList = data.listFile(allList, 'json');

// Container for the module
const lib = {};

lib.create = (fileName, action = 'created') => {
   const fileData = data.read(fileName);
   const model = tcx.toJs(fileData)['model-data'].model;

   const backup = {
      namedDomains: model['named-domains']['named-domain'],
      rootParts: model['root-parts'],
      collections: model.collections.collection,
      applications: model.applications.application,
      includes: model.includes.module,
   };

   const backupFileName = fileName.replace('.tcx', '_backup.json');

   if (jsonList.includes(backupFileName)) {
      data.delete(backupFileName);
   }

   data.create(backupFileName, JSON.stringify(backup));

   console.log('\x1b[32m%s\x1b[0m', `${backupFileName} was ${action}`);
};

lib.restore = (fileName, check = true) => {
   const backupFileName = fileName.replace('.tcx', '_backup.json');

   if (!jsonList.includes(backupFileName) && check) {
      console.log('\x1b[31m%s\x1b[0m', `Error: ${backupFileName} does not exist`);
      return;
   }

   const fileData = data.read(fileName);

   const componentClasses = tcx.getClasses(fileData);

   const backupData = JSON.parse(data.read(backupFileName));

   const namedDomains = lib.mergeDomains(tcx.getDomains(fileData), backupData.namedDomains);

   backupData.namedDomains = namedDomains;

   backupData.componentClasses = componentClasses;

   const model = tcx.fromObj(backupData);

   data.delete(fileName);

   data.create(fileName, model);

   console.log('\x1b[32m%s\x1b[0m', `${fileName} was restored`);
};

lib.mergeDomains = (originalDomains, backupDomains) => {
   originalDomains = Array.isArray(originalDomains) ? originalDomains : [originalDomains];
   backupDomains = Array.isArray(backupDomains) ? backupDomains : [backupDomains];

   const allDomains = [...originalDomains, ...backupDomains];

   const domains = allDomains.reduce((acc, domain) => {
      const name = domain.name._text;

      const obj = domain.elements.element.reduce((acc, chunk) => {
         acc[chunk.name._text] = chunk;

         return acc;
      }, {});

      if (acc.hasOwnProperty(name)) {
         acc[name] = { ...acc[name], ...obj };
      } else {
         acc[name] = obj;
      }

      return acc;
   }, {});

   const namedDomains = [];

   for (const key in domains) {
      const values = domains[key];

      const domain = {
         name: { _text: key },
         elements: { element: [] },
      };

      for (const key in values) {
         domain.elements.element.push(values[key]);
      }

      namedDomains.push(domain);
   }

   return namedDomains;
};

// Export the module
module.exports = lib;
