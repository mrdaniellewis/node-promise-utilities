/*jshint node:true*/
'use strict';

/**
 *	Utilities to help with working with promises
 */

if ( typeof Promise === 'undefined' ) {
	var Promise = require('promise-polyfill');
}

/**
 *	A wrapper for setTimeout
 */
exports.wait = function( time, value ) {
	return new Promise( function(resolve) {
		setTimeout( 
			function() {
				resolve(value);
			}, 
			time 
		);
	} );
};

/**
 *	Creates a closure so you don't have to
 */
exports.defer = function() {
	var resolveProxy, rejectProxy;
	var promise = new Promise( function( resolve, reject ) {
		resolveProxy = resolve;
		rejectProxy = reject;
	} );
	promise.resolve = resolveProxy;
	promise.reject = rejectProxy;

	return promise;
};

/**
 *	Call a function using a node style callback as a Promise
 *	@param {Object} context The context to call it in
 *	@param {Function|String} fn The function, or name of the function to call
 */
exports.callback = function( context, fn /* args...*/ ) {
	var deferred = exports.defer();
	var args = Array.prototype.slice.call(arguments,2);
	args.push( function( e, value) {
		if ( e ) {
			deferred.reject(e);
		} else if ( arguments.length > 2 ) {
			deferred.resolve(Array.prototype.slice.call(arguments,1));
		} else {
			deferred.resolve(value);
		}
	} );

	if ( context && typeof fn === 'string') {
		context[fn].apply( context, args );
	} else {
		fn.apply( context, args );
	}
	return deferred;
};