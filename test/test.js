/*jshint node:true*/
"use strict";

var assert = require('assert');

var TestQueue = require('test-queue');
var promiseUtil = require('promise-util');

if ( typeof Promise === 'undefined' ) {
	var Promise = require('promise-polyfill');
}


var testQueue = new TestQueue()
	.addTest( 'promiseUtil.wait', function( pass, fail ) {

		promiseUtil.wait( 1000, 'foo' )
			.then( function(value) {
				assert.equal( value, 'foo' );
			} )
			.then(pass)
			.catch(fail);

	} )
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

	} )
	.addTest( 'promiseUtil.bindAll - resolving', function( pass, fail ) {

		var foo = {
			bar: 'foo'
		};
		var test = function( value1, value2, cb ) {
			cb( null, this.bar, value1, value2 );
		};

		Promise.resolve( 'quack' )
			.then( promiseUtil.bindAll( foo, test, 'moo', 'cow' ) )
			.then( function( value ) {
				assert.deepEqual( value, ['foo','moo','cow'] );
				pass();
			} )
			.catch(fail);

	} )
	.addTest( 'promiseUtil.bindAll - rejecting', function( pass, fail ) {

		var fs = require('fs');
		var path = require('path');

		Promise.resolve( 'quack' )
			.then( promiseUtil.bindAll( null, fs.readFile, path.resolve( __dirname, 'doesnotexist' ) ) )
			.catch( function(e) {
				assert.equal( e.code, 'ENOENT' );
			})
			.then(pass)
			.catch(fail);

	} );
	

module.exports = testQueue;

