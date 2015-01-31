/* jshint node:true, mocha: true */
"use strict";

var promiseUtil = require( '../' );
var expect = require('expect');

describe( 'wait', function() {

	it( 'resolve a promise after the time provided in the first argument', function() {

		var time = Date.now();

		return promiseUtil.wait( 100 )
			.then( function() {
				expect( Date.now() ).toBeGreaterThan( time - 100 );
			} );

	} );

	it( 'resolves to the value of the second argument', function() {

		var time = Date.now();

		return promiseUtil.wait( 0, 'foo bar' )
			.then( function(value) {
				expect( value ).toEqual( 'foo bar' );
			} );

	} );

} );

/*
.addTest( 'promiseUtil.defer - passing', function( pass, fail ) {

		var defer = promiseUtil.defer();
		defer
			.then( function(value) {
				assert.equal( value, 'foo' );
			} )
			.then(pass)
			.catch(fail);

		defer.resolve('foo');

	} )
	.addTest( 'promiseUtil.defer - throw error', function( pass, fail ) {

		var defer = promiseUtil.defer();
		defer
			.then( function(value) {
				throw new Error('Should not resolve');
			} )
			.catch( function(value) {
				assert.equal( value, 'foo' );
			} )
			.then(pass)
			.catch(fail);

		defer.reject('foo');

	} )
	.addTest( 'promiseUtil.callback - context and name', function( pass, fail ) {

		var fs = require('fs');
		var path = require('path');
		var testFilePath = path.resolve( __dirname, 'test.txt' );

		promiseUtil.callback( fs, 'readFile', testFilePath, {encoding: 'utf8'} )
			.then( function(value) {
				assert.equal( value, 'Lorem ipsum' );
			} )
			.then(pass)
			.catch(fail);

	} )
	.addTest( 'promiseUtil.callback - function only', function( pass, fail ) {

		var fs = require('fs');
		var path = require('path');
		var testFilePath = path.resolve( __dirname, 'test.txt' );

		promiseUtil.callback( null, fs.readFile, testFilePath, {encoding: 'utf8'} )
			.then( function(value) {
				assert.equal( value, 'Lorem ipsum' );
			} )
			.then(pass)
			.catch(fail);

	} )
	.addTest( 'promiseUtil.callback - context and function', function( pass, fail ) {

		var foo = {
			bar: 'foo'
		};
		var test = function( value, cb ) {
			cb( null, this.bar + ' ' + value );
		};

		promiseUtil.callback( foo, test, 'fee' )
			.then( function(value) {
				assert.equal( value, 'foo fee' );
			} )
			.then(pass)
			.catch(fail);

	} )
	.addTest( 'promiseUtil.callback - mutilple return values', function( pass, fail ) {

		var foo = {
			bar: 'foo'
		};
		var test = function( value, cb ) {
			cb( null, 'foo', value );
		};

		promiseUtil.callback( foo, test, 'fee' )
			.then( function(value) {
				assert.deepEqual( value, ['foo','fee'] );
			} )
			.then(pass)
			.catch(fail);

	} )
	.addTest( 'promiseUtil.callback - error - context and name', function( pass, fail ) {

		var fs = require('fs');
		var path = require('path');

		promiseUtil.callback( fs, 'readFile', path.resolve( __dirname, 'doesnotexist' )  ) 
			.catch( function(e) {
				assert.equal( e.code, 'ENOENT' );
			})
			.then(pass)
			.catch(fail);
	} )
	.addTest( 'promiseUtil.callback - error - function only', function( pass, fail ) {

		var fs = require('fs');
		var path = require('path');

		promiseUtil.callback( null, fs.readFile, path.resolve( __dirname, 'doesnotexist' )  ) 
			.catch( function(e) {
				assert.equal( e.code, 'ENOENT' );
			})
			.then(pass)
			.catch(fail);
	} )
	.addTest( 'promiseUtil.callback - error - context and function', function( pass, fail ) {

		var foo = {
			bar: 'foo'
		};
		var test = function( value, cb ) {
			cb( 'error' );
		};

		promiseUtil.callback( foo, test, 'fee' )
			.catch( function(e) {
				assert.equal( e, 'error' );
			})
			.then(pass)
			.catch(fail);

	} );

	// Generates the tests.  Running the tests returns a promise

var assert = require('assert');
var promiseUtil = require('promise-util');

module.exports = [
	{	name: 'Spawn',
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
	}
];



*/