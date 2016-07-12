/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
var gatherConfiguration = require('./lib/configuration.js');
var AuthClient = require('./lib/google-apis/auth-client.js');
// Begin error reporting interfaces
var koa = require('./lib/interfaces/koa.js');
var hapi = require('./lib/interfaces/hapi.js');
var manual = require('./lib/interfaces/manual.js');
var express = require('./lib/interfaces/express.js');
var restify = require('./lib/interfaces/restify');
var uncaughtException = require('./lib/interfaces/uncaught.js');

/**
 * @typedef ConfigurationOptions
 * @type Object
 * @property {String} [projectId] - the projectId of the project deployed
 * @property {String} [keyFilename] - path to a key file to use for an API key
 * @property {String} [key] - API key to use for communication with the service
 * @property {uncaughtHandlingEnum}
 *  [onUncaughtException=uncaughtHandlingEnum.ignore] - one of the uncaught
 *  handling options
 * @property {Object} [serviceContext] - the service context of the application
 * @property {String} [serviceContext.service] - the service the application is
 *  running on
 * @property {String} [serviceContext.version] - the version the hosting
 *  application is currently labelled as
 */

/**
 * @typedef ApplicationErrorReportingInterface
 * @type Object
 * @property {Object} hapi - The hapi plugin for Stackdriver Error Reporting
 * @property {Function} report - The manual interface to report Errors to the
 *  Stackdriver Error Reporting Service
 * @property {Function} express - The express plugin for Stackdriver Error
 *  Reporting
 */

/**
 * The entry point for initializing the Error Reporting Middleware. This
 * function will invoke configuration gathering and attempt to create a API
 * client which will send errors to the Error Reporting Service. Invocation of
 * this function will also return an interface which can be used manually via
 * the `report` function property, with hapi via the `hapi` object property or
 * with express via the `express` function property.
 * @function initConfiguration
 * @param {ConfigurationOptions} initConfiguration - the desired project/error
 *  reporting configuration
 * @returns {ApplicationErrorReportingInterface} - The error reporting interface
 */
function initializeClientAndInterfaces ( initConfiguration ) {

  var config = gatherConfiguration(initConfiguration);
  var client = new AuthClient(
    config.projectId,
    config.shouldReportErrorsToAPI
  );

  // Setup the uncaught exception handler
  uncaughtException(client, config);

  // Return the application interfaces for use by the hosting application
  return {
    koa: koa(client, config),
    hapi: hapi(client, config),
    report: manual(client, config),
    express: express(client, config),
    restify: restify(client, config)
  };
}

module.exports = initializeClientAndInterfaces;
