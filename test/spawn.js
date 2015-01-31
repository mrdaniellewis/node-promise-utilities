/* jshint node:true, mocha: true */
"use strict";

var Promise = require('promise-polyfill');
var promiseUtil = require('../');
var expect = require('expect');

/* jshint evil:true */
var supportsGenerators = false;
try {
	supportsGenerators = eval('function* gen() {} return true' );
} catch (e) {
	// Do nothing
}

if ( supportsGenerators ) {


} else {
	describe( 'spawn', function() {
		it ( 'generators are not supported - skipping' );
	} );

}
/* jshint evil:false */


/*{	name: 'Spawn',
		fn: function( pass, fail ) {

		function *gen() {
			var count = 0;

			count += yield 1;
			count += yield Promise.resolve(2)
				.then( function(value) {
					return value + 4;
				} );
			try {
				count += yield Promise.reject(8);

			} catch(e) {
				count += e;
			}

			count += yield 16;
			return count;

		}

		promiseUtil.spawn(gen)
			.then( function(value) {
				assert.equal(value, 1+2+4+8+16 );
				pass();
			} )
			.catch(fail);

		} 
	},

	{	name: 'Spawn - returning rejected promise',
		fn: function( pass, fail ) {

		var count = 0;
		function *gen() {
	
			count += yield 1;
			count += yield Promise.reject(2);
			count += yield 4;	

		}

		promiseUtil.spawn(gen)
			.catch( function(value) {
				assert.equal(value, 2 );
				assert.equal(count, 1 );
			} )
			.then(pass)
			.catch(fail);

		} 
	},

	{	name: 'Spawn - returning error',
		fn: function( pass, fail ) {

		var count = 0;
		function *gen() {
	
			count += yield 1;	
			throw 'foo';
			count += yield 2;	

		}

		promiseUtil.spawn(gen)
			.catch( function(value) {
				assert.equal(value, 'foo' );
				assert.equal(count, 1 );
			} )
			.then(pass)
			.catch(fail);

		} 
	}*/