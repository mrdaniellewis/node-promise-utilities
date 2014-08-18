# Test queue

Simple test framework that allows you to queue up a sequence of async tests.

## Usage

```javascript
var TestQueue = require('test-queue');

new TestQueue()
	.addTest( function( pass, fail ) {
		// Async task
	} )
	.addTest( function( pass, fail ) {
		// Async task
	} )
	.setup( function() {
		// function run before the tests start
	} )
	.teardown( function() {
		// function run after all the tests have finished whether they pass or fail
	} )
	.on( 'pass', function(name) {
		console.log( name, ' has passed' );
	} )
	.on( 'fail', function( name, e ) {
		console.log( name, ' has failed with error', e );
	} )
	.run()
		.then( 
			function(stats) {
				console.log( 'All tests passed')
			},
			function(stats) {
				console.log( 'Some tests did\'t pass ');
			}
		);
```

### Constructor

```javascript
var testQueue = new TestQueue(options) 
```

`options.stopOnFail` - Boolean, optional, default = `true`.  Stop running tests if a test fails.

testQueue is an event emitter.

### Events

`pass` A test has passed.  The name of the test is passed as the first argument

`fail` A test has failed.  The name of the test is passed as the first argument and the error message as the second.

### Methods

```javascript
testQueue.addTest( name, function(pass,fail){
	// The test goes here
} )
```

`name` - String - The name of the test

`function(pass,fail){}` - Function - The test.  Use the callbacks pass and fail to return the outcome of the test.  Pass an error to fail.

If the function throws an uncaught error this will be caught and the test will be failed.

Returns the `TestQueue` object for chaining

----

```javascript
testQueue.setup( function(){
	// Setup tasks
} )
```
The setup function is run before all tests.
Return a Promise object if setup is async.

----

```javascript
testQueue.teardown( function(){
	// Teardown tasks
} )
```
The teardown function is run after all tests have finished
whether they passed or failed.

Return a Promise object if teardown is async.


----

```javascript
testQueue.run()
```

Run the queued tests.

Returns a promise.

The promise will resolve or reject with a object with the properties

* `total`: total number of tests
* `passed`: number of tests passed
* `failed`: number of tests failed

### Static methods

```javascript
TestQueue.toConsole(testQueue)
```

Modifies an existing instance of TestQueue so it outputs to the console
each time a test passes or fails and the statistics when the tests finish.

Output is coloured red and green as appropriate.



