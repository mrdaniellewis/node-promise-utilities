/* jshint node:true, mocha: true */
"use strict";

var Promise = require('require-promise');
var promiseUtil = require('../');
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

describe( 'defer', function() {

	it( 'returns a promise', function() {
		expect( promiseUtil.defer() ).toBeA( Promise );
	} );

	it( 'resolves with the provided value when resolve is called', function() {
		var defer = promiseUtil.defer();

		defer.resolve( 'foo bar' );

		return defer
			.then( function(value) {
				expect( value ).toEqual( 'foo bar' );
			} );

	} );

	it( 'rejects to the provided value when reject is called', function() {
		var defer = promiseUtil.defer();

		defer.reject( 'foo bar' );

		return defer
			.then( function() {
				throw new Error('should not be called');
			} )
			.catch( function(value) {
				expect( value ).toEqual( 'foo bar' );
			} );

	} );

	it( 'returns the native promise when available', function() {

		if ( global.Promise && global.Promise.toString() === 'function Promise() { [native code] }' ) {
			var defer = promiseUtil.defer();

			expect(defer).toBeA( global.Promise );
		}
		
	} );

} );

describe( 'callback', function() {

	// Create a test object with a node type callback
	function Tester(value) {
		this.value = value;
	}
	// This will call cb with, this.value and the supplied arguments, 
	// or as an error if the first argument is an error 
	Tester.prototype.callback = function( /* args.., cb */ ) {
		
		var args = Array.prototype.slice.call( arguments );
		var cb = args.pop();

		if ( args[0] instanceof Error ) {

			cb( args[0] );

		} else {
			
			args.unshift( this.value );
			args.unshift( null );
			cb.apply( null, args );
		}
	};
	var tester = new Tester('foo bar');


	describe( 'calling with a context and function name', function() {

		it( 'returns the callback result as a promise', function() {

			return promiseUtil.callback( tester, 'callback' )
				.then( function(value) {
					expect( value ).toBe( 'foo bar' );
				} );

		} );

		it( 'returns multiple arguments as an array', function() {

			return promiseUtil.callback( tester, 'callback', 'fee', 'fi' )
				.then( function(value) {
					expect( value ).toEqual( [ 'foo bar', 'fee', 'fi' ] );
				} );

		} );

		it( 'rejects the promise on an error', function() {

			return promiseUtil.callback( tester, 'callback', new Error('error') )
				.then( function() {
					throw new Error('should not be called');
				} )
				.catch( function(value) {
					expect( value ).toBeA( Error );
					expect( value.message ).toBe( 'error' );
				} );

		} );

	} );

	describe( 'calling with a function', function() {

		it( 'returns the callback result as a promise', function() {

			return promiseUtil.callback( null, tester.callback.bind(tester) )
				.then( function(value) {
					expect( value ).toBe( 'foo bar' );
				} );

		} );

		it( 'returns multiple arguments as an array', function() {

			return promiseUtil.callback( null, tester.callback.bind(tester), 'fee', 'fi' )
				.then( function(value) {
					expect( value ).toEqual( [ 'foo bar', 'fee', 'fi' ] );
				} );

		} );

		it( 'rejects the promise on an error', function() {

			return promiseUtil.callback( null, tester.callback.bind(tester), new Error('error') )
				.then( function() {
					throw new Error('should not be called');
				} )
				.catch( function(value) {
					expect( value ).toBeA( Error );
					expect( value.message ).toBe( 'error' );
				} );

		} );

	} );

	describe( 'calling with a context and function', function() {

		var tester2 = new Tester('fi fo');

		it( 'returns the callback result as a promise', function() {

			return promiseUtil.callback( tester2, tester.callback )
				.then( function(value) {
					expect( value ).toBe( 'fi fo' );
				} );

		} );

		it( 'returns multiple arguments as an array', function() {

			return promiseUtil.callback( tester2, tester.callback, 'fee', 'fi' )
				.then( function(value) {
					expect( value ).toEqual( [ 'fi fo', 'fee', 'fi' ] );
				} );

		} );

		it( 'rejects the promise on an error', function() {

			return promiseUtil.callback( tester2, tester.callback, new Error('error') )
				.then( function() {
					throw new Error('should not be called');
				} )
				.catch( function(value) {
					expect( value ).toBeA( Error );
					expect( value.message ).toBe( 'error' );
				} );

		} );

	} );

} );



/*

	
	
	


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