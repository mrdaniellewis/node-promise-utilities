/*jshint node:true*/
"use strict";
var TestQueue = require('test-queue');
var tests = require('./test.js');

// These tests are only valid in node 11 with the --harmony flag
try {
	require('./test-spawn.js').forEach( function(test) {
		tests.addTest( test.name, test.fn );
	} );
} catch(e) {
	// Ignore
}

TestQueue.toConsole(tests).run()
	.catch( function() {
		process.exit(1);
	} );