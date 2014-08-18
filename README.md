# Promise utilities

Some utility functions for working with Promises in node

## `wait( milliseconds, value )`

`setTimeout` wrapped in a promise.

```js

promiseUtil.wait( 1000, value )
	.then( function(value) {
		// Do something 1 second later
	} );
```

## `defer()`

Creates a closure so you don't have to.  Returns a promise with `resolve()` and `reject()` methods.  

Useful for converting callbacks to promises.

```js
var defer = promiseUtil.defer();
fs.readFile( filename, function( e, contents ) {
	if (e) {
		defer.reject(e);
	}
	defer.resolve(contents);
} );
```

## `callback( context, fn, args... )`

Calls a function using the node callback pattern as a promise.

`context` is the context to call the function in.

`fn` can be the function name as a string, or the function itself.

If the callback returns more than one argument, they will be returned as an array.

```js
promiseUtil.callback( fs, 'readFile', filename )
	.then( /* do stuff */ );

// Is equivalent to

promiseUtil.callback( fs, fs.readFile, filename )
	.then( /* do stuff */ );

// Is equivalent to (but in this case only because fs functions require no context)

promiseUtil.callback( null, fs.readFile, filename )
	.then( /* do stuff */ ); 
```

If you want to transform a callback function into a function that generates
promises then do this. 

```js
var readFile = promiseUtil.callback.bind( null, fs, 'readFile' );
```

## `spawn( function *(){ ... } )`

This only works in Node 0.11 (or higher), if the `--harmony` flag is applied as it uses
generators.

See the bottom of here: http://www.html5rocks.com/en/tutorials/es6/promises/

It will run a generator to completion, pausing on any promises encountered
and returning the resolved value to the generator.

```js
function *doStuff() {
	
	var results = [];
	results.push( yield asyncTask1() );
	results.push( yield asyncTask2() );

	return results;
}

promiseUtil.spawn(doStuff)
	.then( /* do stuff with the results */ )
```
