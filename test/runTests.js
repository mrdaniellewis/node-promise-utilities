/*jshint node:true*/
"use strict";
var test = require('./test.js');
var TestQueue = require('test-queue');

TestQueue.toConsole(test).run();