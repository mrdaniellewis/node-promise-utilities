/**
 *  Utilities to help with working with promises
 */
'use strict';

/**
 *  A wrapper for setTimeout
 */
exports.wait = function( time, value ) {
    return new Promise( resolve => {
        setTimeout( () => resolve( value ), time || 0 );     
    } );
};

/**
 *  Creates a closure so you don't have to
 */
const defer = exports.defer = function() {
    
    let resolveProxy;
    let rejectProxy;

    const promise = new Promise( ( resolve, reject ) => {
        resolveProxy = resolve;
        rejectProxy = reject;
    } );

    promise.resolve = resolveProxy;
    promise.reject = rejectProxy;

    return promise;
};

/**
 *  Call a function using a node style callback as a Promise
 *  @param {Object} context The context to call it in
 *  @param {Function|String} fn The function, or name of the function to call
 */
exports.callback = function( context, fn /* args...*/ ) {
    
    const deferred = defer();
    const args = Array.prototype.slice.call( arguments, 2 );

    args.push( function( e, value ) {
        if ( e ) {
            deferred.reject( e );
        } else if ( arguments.length > 2 ) {
            deferred.resolve( Array.prototype.slice.call( arguments, 1 ) );
        } else {
            deferred.resolve( value );
        }
    } );

    if ( context && typeof fn === 'string' ) {
        context[fn].apply( context, args );
    } else {
        fn.apply( context, args );
    }

    return deferred;
};

/**
 *  Run a sequence of functions as a promise
 *  Each function is resolved with the previous functions return value
 *
 *  @param {Function[]} fns Array of functions
 *  @param {Object} [start] Starting value to pass to the first function
 */
exports.sequence = function( fns, start ) {

    return fns.reduce( ( previous, current ) => {
        
        return previous.then( x => {
            return current( x );
        } );

    }, Promise.resolve( start ) );

};

// Used to test is a function is a generator function
const GeneratorFunction = Object.getPrototypeOf( function *() {} ).constructor;

/**
 *  Given a generator, create function that will
 *  run the generator to completion using promises
 *
 *  @param {GeneratorFunction} fn The function to run
 *  @returns {Function} A function that will run the generator
 */
const coroutine = exports.coroutine = function( fn ) {

    if ( !( fn instanceof GeneratorFunction ) ) {
        throw new TypeError( 'first argument must be a generator' );
    }

    // Run in a promise rather than chaining promises
    // Chaining promises creates a big memory leak
    // See comment in https://github.com/tj/co/blob/master/index.js
    return new Promise( ( resolve, reject ) => {
        
        const iterator = fn.apply( null, Array.from( arguments ).slice( 1 ) );

        function runner( arg, isError ) {

            let result;
            try {
                if ( isError ) {
                    result = iterator.throw( arg );
                } else {
                    result = iterator.next( arg );
                }
                
            } catch ( e ) {
                reject( e );
            }
            
            if ( result.done ) {
                resolve( result.value );
                return;
            }

            Promise.resolve( result.value )
                .then( value => runner( value, false ) )
                .catch( e => runner( e, true ) );
        }

        runner( undefined, false );

    } );

};

/**
 *  A wrapper for returning the result of a function as a promise
 *  while catching and returning a rejected promise if there is an error.
 */
const resolveFunction = exports.resolve = function( fn, value ) {

    try {
        return Promise.resolve( fn( value ) );
    } catch ( e ) {
        return Promise.reject( e );
    }
    
};


/**
 *  Run a function against iterable values in a series
 *  @param {Function|GeneratorFunction} fn A function to run
 *  @param {Iterable} iterable An iterable of some sort
 *  @param {Object} [options]
 *  @param {Integer} [options.parallel=1] Number of parallel runners to run 
 *  @param {Boolean} [options.collect=true] Collect all the results in an array
 *  @returns {Promise}
 */
const series = exports.series = function( fn, iterable, options ) {

    if ( !fn || !( fn instanceof Function ) ) {
        throw new TypeError( 'first argument must be a function' );
    }

    const iterator = ( function *() {   
        yield* iterable;
    }() );

    const parallel = options && options.parallel || 1;
    const collect = !options || options.collect !== false;

    const collected = [];

    let yielder;
    if ( fn instanceof GeneratorFunction ) {
        yielder = coroutine.bind( null, fn );
    } else {
        yielder = resolveFunction.bind( null, fn );
    }
   
    function *run() {

        let result;
        let value;

        /* eslint-disable no-constant-condition */

        while ( true ) {

            result = iterator.next();
            if ( result.done ) {
                return;
            }

            value = yield yielder( result.value );

            if ( collect ) {
                collected.push( value );
            }
        } 

        /* eslint-enable no-constant-condition */

    }

    const runner = coroutine.bind( null, run );
    const running = Array.from( Array( parallel ), () => runner() );

    return Promise.all( running )
        .then( () => collected );

};


const wait = Symbol( 'wait' );

/**
 *  A queue of actions that can be added to
 *  @param {Function} fn A function to run for each action
 *  @param {Object} [options]
 *  @param {Integer} [options.parallel=1] Number of parallel runners to run 
 *  @param {Boolean} [options.infinite=true] Run forever.  If false start will
 *      resolve when the last queued item is completed
 *  @param {Boolean} [options.collect=false] If true run will resolve with the
 *      results all all actions.  Bad idea if the queue is very long
 */
const Queue = exports.Queue = class {

    constructor( fn, options ) {

        if ( !fn || !( fn instanceof Function ) ) {
            throw new TypeError( 'first argument must be a function' );
        }

        this.parallel = options && options.parallel || 1;
        this.infinite = options && options.infinite === true;
        this.collect = !!( options && options.collect );

        this._count = 0;
        this._resume = [];
        this._pause = false;
        this._stop = false;
        this._results = [];

        if ( fn instanceof GeneratorFunction ) {
            this._yielder = coroutine.bind( null, fn );
        } else {
            this._yielder = resolveFunction.bind( null, fn );
        }

        if ( options && options.iterator ) {

            this._iterator = options.iterator;

        } else {

            this._iterator = [];
            this._iterator[Symbol.iterator] = () => ( {
                next: () => this._next(),
            } );
        }
    }

    /**
     *  Add a value to the queue
     *  @param {Object} value
     */ 
    add() {
        
        this._iterator.push.apply( this._iterator, arguments );

        if ( !this._pause ) {
            this.resume();
        }
        
        return this;
    }

    /**
     *  Start queue running
     *  @return {Promise}
     */
    run() {

        return series( this._action.bind( this ), this._iterator, {
            parallel: this.parallel,
            collect: this.collect,
        } )
        .then( () => this._results );
    }

    /**
     *  Stop the iterator running
     */
    stop( e ) {
        this._stop = e || new Error( 'stopped' );
        this.resume();
    }

    /**
     *  Pause the queue
     */
    pause() {
        this._pause = true;
    }

    /**
     *  yield the value, or wait for a value to be added
     */
    *_action( value ) {

        if ( this._stop ) {
            throw this._stop;
        }

        if ( value === wait ) {
            yield new Promise( resolve => {
                this._resume.push( resolve );
            } );
            return;
        }

        ++this._count;
        const result = yield this._yielder( value );
        --this._count;

        if ( this.collect ) {
            this._results.push( result );
        }

    }

    /**
     *  restart all paused actions
     */
    resume() {
        this._pause = false;
        while ( this._resume.length ) {
            this._resume.shift()();
        }
    }

    /**
     *  Next function for our infinite iterator
     */
    _next() {
        
        const hasValues = this._iterator.length;

        if ( !this._pause && hasValues ) {
            const value = this._iterator.shift();
            return { value, done: false };
        }

        // If infinite is false do end when the queue is 0
        // and all actions are completed
        if ( !hasValues && !this.infinite && this._count === 0 ) {
            this.resume();
            return { value: undefined, done: true };
        }

        return { value: wait, done: false };

    }

};

exports.Queue.waitSymbol = wait;

/**
 *  Returns a function that will actions to be run in sequence
 *  returning a promise that will resolve when each action is completed.
 */
exports.fifo = function( fn, options ) {

    if ( !fn || !( fn instanceof Function ) ) {
        throw new TypeError( 'first argument must be a function' );
    }

    let yielder;
    if ( fn instanceof GeneratorFunction ) {
        yielder = coroutine.bind( null, fn );
    } else {
        yielder = resolveFunction.bind( null, fn );
    }

    function run( runner ) {
        return runner();
    }

    const parallel = options && options.parallel || 1;
    
    const queue = new Queue( run, { parallel, collect: false, infinite: true } );

    let started = false;
    return function( value ) {

        const promise = new Promise( ( resolve, reject ) => {

            const runner = () => {

                return yielder( value )
                    .then( resolve, reject );
                    
            };

            queue.add( runner );

            if ( !started ) {
                process.nextTick( () => {
                    queue.run();
                } );
                started = true;
            }

        } );

        return promise;
    };

};