# Promise utilities

[![npm version](https://badge.fury.io/js/promise-util.svg)](http://badge.fury.io/js/promise-util)

A collection of utilities for working with Promises in node.

Plenty of other libraries ([q](https://www.npmjs.com/package/q), [bluebird](https://www.npmjs.com/package/bluebird), [co](https://www.npmjs.com/package/co)) contain similar functions and much more.  And also work in the browser.

```bash
npm install promise-util
```

## `defer()`

Creates a closure so you don't have to.  Returns a promise with `resolve()` and `reject()` methods.  

Useful for converting callbacks to promises.

```js
const promiseUtil = require( 'promise-util' );

const defer = promiseUtil.defer();
fs.readFile( filename, ( e, contents ) => {
	if ( e ) {
		defer.reject( e );
	}
	defer.resolve( contents );
} );
```

## `callback( context, fn, ...args )`

Calls a function using the node callback pattern as a promise.

* `context` is the context to call the function in.
* `fn` can be the function name as a string, or the function itself.
* `...args` arguments to pass to the function

If the callback returns more than one argument, they will be returned as an array.

```js
const promiseUtil = require( 'promise-util' );

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

## `coroutine( generator, arg... )`

Given a generator, run the generator resolving any yielded value as a promise and return the final value.

* `generator` A generator function
* `arg` One or more arguments to apply to the generator

See the "Bonus round: Promises and Generators" section in www.html5rocks.com/en/tutorials/es6/promises/.

Unlike, say, [co](https://www.npmjs.com/package/co), this resolves values as a Promise using Promise.resolve.  It will not automatically resolve arrays using Promise.all, object properties or generators for you. 

```js
const promiseUtil = require( 'promise-util' );

function *generator( count ) {
	count += 1;
	count += yield Promise.resolve( 1 );
}

promiseUtil.coroutine( generator, 1 )
	.then( value => {
		// value = 3
	} );
```

To create a reusable coroutine use bind.
```
const reusable = promiseUtil.coroutine.bind( null, generator );
```

Note that a generator can be resolved using:

```
function *generator( count ) {
	yield* generator;
}
```

## `sequence( ar, initial )`

Given an array of functions run then as a sequence of Promises.

* `ar` The array of functions
* `initial` A starting value to pass to the first funtion

Returns a Promise resolving to the value of the final function.

```js
const promiseUtil = require( 'promise-util' );
const fn = x => Promise.resolve( ++x );
const sequence = [fn, fn, fn];

promiseUtil.sequence( sequence, 10 )
    .then( x => {
        expect( x ).toEqual( 13 );
    } );
```

## `series( fn, iterable, options )`

Run a function on a series of values.

* `fn` The function to run
* `iterable` The values to run the function on.  This can be an array, or any iterable.
* `options.parallel` Integer = 1. The number of parallel series to run.
* `options.collect` Boolean = true.  If false do not collect the results in an array.

Returns a Promise resolving to an array of the values returned by the function.  If collect is false this is an empty array.

```js
const promiseUtil = require('promise-util');

promiseUtil.series( 
	x => Promise.resolve( x + 1 ),
	[1, 2, 3, 4, 5]
)
.then( values => {
	// value = [2, 3, 4, 5, 6]
} );
```

## `Queue( fn, options )`

Create a queue of values to to be processed by a function, promise or generator.

The queue runs in series, but can run multiple items in parallel, to pause and resume and new items can be added while it is running.

* `fn` The function to run
* `option` See below

```js
const promiseUtil = require( 'promise-util' );

// A function that does stuff
const fn = x => console.log( x );

// Create a new queue
const queue = new Queue( fn );

// Add some values to process
queue.add( 1 );
queue.add( 2 );

// Run the queue of tasks
queue.run()
	.then( () =>
		// Console will have logged
		// 1
		// 2
	} );

```

### Options

#### options.parallel

Type: Integer<br>
Default: 1

How many items can be run in parallel.

#### options.collect

Type: Boolean<br>
Default: false

Collect all the values and return them when the queue finished.

#### options.infinite

Type: Boolean<br>
Default: false

If true, do not end the queue when the iterator runs out of values and all items have been processed.

This means `run()` will never resolve and the queue can only be stopped by using `stop()` or it being garbage collected.

#### options.interator

Type: Iterator

A custom iterator to supply values to the queue.

To be compatible the iterator must:
* return `Queue.waitSymbol` when no items remain
* implement a `length` property that returns the current queue length.
* implement a `push()` method to add values. `add()` will error without this.

### Instance methods

#### `Queue.prototype.add( ...args )`

Add one or more values to be processed.

* `resolveFn` _optional_ function to resolve with
* `rejectFn` _optional_ function to reject with

Returns the `Queue` instance for chaining.

#### `Queue.prototype.run()`

Starts the queue running.  

Returns a `Promise` that will resolve then the queue is empty - the iterator runs out of values and all running functions have returned - or `stop()` is called.

If the `collect` option is true then this will resolve to an array of values returned by `fn`.

#### `Queue.prototype.stop( error )`

Stop the queue.  This will cause the promise returned by run to reject to the supplied error, or 'stopped' if if error is not supplied.

#### `Queue.prototype.pause()`

Pause the queue from starting any further actions.

#### `Queue.prototype.resume()`

Resume the queue.

If using a custom iterator this can be used to restart the queue running if additional items have been added to the iterator.

## `fifo( fn, options )`

A first in first out queue.  Runs a task in the order they are given ensuring tasks complete before the next one starts.

* `options.parallel` Integer, the number of tasks to run in parallel.  Defaults to `1`.

Returns a `Function` that adds additional items to the queue.

The function will return a Promise resolving when the item finishes.  Items an be functions, values, promises or generators.

```js
// Create a fifo queue
const promiseUtil = require('promise-util').;

// Add a task
fifo( () => {	
		return someLongProcessReturningAPromise();
	} )
	.then( value => {
		// Do something when it finishes
	} );
```

## `wait( milliseconds, value )`

`setTimeout` wrapped in a promise.

* `milliseconds` Integer, time to wait
* `value` value to return

```js
const promiseUtil = require( 'promise-util' ;

promiseUtil.wait( 1000, value )
	.then( value => {
		// Do something 1 second later
	} );
```
