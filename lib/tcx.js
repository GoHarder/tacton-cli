/**
 * @module tcx
 * A module for converting tcx files
 */

// NPM Dependencies
const convert = require('xml-js');

// Container for the module
const lib = {};

// The tcx file template
lib.tcxTemplate = {
   _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
   'model-data': {
      identification: {
         'created-by': 'Tacton CLI 1.0.0',
         'edited-with': 'Tacton CLI 1.0.0',
         date: new Date(Date.now()).toString(),
         'xml-version': '4.11',
      },
      model: {
         'named-domains': {},
         'component-classes': {},
         'root-parts': {},
         collections: {},
         applications: {},
         includes: {},
      },
   },
};

/**
 * Converts an tcx string to a javascript object
 * @param {string} fileData The text in the file
 */
lib.toJs = (fileData) => convert.xml2js(fileData, { compact: true });

/**
 * Gets the classes from a tcx file
 * @param {string} fileData The text in the file
 */
lib.getClasses = (fileData) => {
   const fileObj = lib.toJs(fileData);

   return fileObj['model-data'].model['component-classes']['component-class'];
};

/**
 * Converts a javascript object to tcx string
 * @param {any} fileObj The tcx js object
 */
lib.fromObj = (fileObj) => {
   const { namedDomains } = fileObj;
   const { model } = lib.tcxTemplate['model-data'];

   if (namedDomains) {
      model['named-domains']['named-domain'] = namedDomains;
   }

   const options = { compact: true, fullTagEmptyElement: true };

   return convert.js2xml(lib.tcxTemplate, options);
};

/**
 * Gets a list of classes from a tcx file
 * @param {string} fileData The text in the file
 */
lib.listClasses = (fileData) => {
   const classes = lib.getClasses(fileData);

   return classes.map((_class) => _class.name._text);
};

// Export the module
module.exports = lib;
