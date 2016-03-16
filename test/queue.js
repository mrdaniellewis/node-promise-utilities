'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.Queue', function() {

    it( 'is a function', function() {

        expect( promiseUtil.Queue ).toBeA( Function );

    } );

    it( 'creates a Queue instance', function() {

        expect( new promiseUtil.Queue( x => x ) )
            .toBeA( promiseUtil.Queue );

    } );

    it( 'throws an error if not supplied with a function', function() {

        expect( () => {
            return new promiseUtil.Queue( {} );
        } ).toThrow( 'first argument must be a function' );

    } );

    describe( 'add and run', function() {

        it( 'runs queued actions to completion', function() {

            const spy = expect.createSpy().andCall( value => value );
            const queue = new promiseUtil.Queue( spy );
            [1, 2, 3, 4].forEach( item => queue.add( item ) );

            return queue.run()
                .then( () => {

                    expect( spy.calls.length ).toBe( 4 );
                    expect( spy )
                        .toHaveBeenCalledWith( 1 )
                        .toHaveBeenCalledWith( 2 )
                        .toHaveBeenCalledWith( 3 )
                        .toHaveBeenCalledWith( 4 );

                } );

        } );

        it( 'runs a queue supplied with a generator to completion', function() {


            const spy = expect.createSpy().andCall( value => value );
            function *generator( value ) {
                yield spy( value );
            }

            const queue = new promiseUtil.Queue( generator );
            [1, 2, 3, 4].forEach( item => queue.add( item ) );

            return queue.run()
                .then( () => {

                    expect( spy.calls.length ).toBe( 4 );
                    expect( spy )
                        .toHaveBeenCalledWith( 1 )
                        .toHaveBeenCalledWith( 2 )
                        .toHaveBeenCalledWith( 3 )
                        .toHaveBeenCalledWith( 4 );

                } );

        } );

        it( 'accepts multiple arguments to add', function() {


            const spy = expect.createSpy().andCall( value => value );
            function *generator( value ) {
                yield spy( value );
            }

            const queue = new promiseUtil.Queue( generator );
            queue.add( 1, 2, 3, 4 );
            
            return queue.run()
                .then( () => {

                    expect( spy.calls.length ).toBe( 4 );
                    expect( spy )
                        .toHaveBeenCalledWith( 1 )
                        .toHaveBeenCalledWith( 2 )
                        .toHaveBeenCalledWith( 3 )
                        .toHaveBeenCalledWith( 4 );

                } );

        } );

        it( 'add returns this', function() {


            const spy = expect.createSpy().andCall( value => value );
            function *generator( value ) {
                yield spy( value );
            }

            const queue = new promiseUtil.Queue( generator );
            expect( queue.add() ).toBe( queue );

        } );

    } );

    describe( 'stop', function() {

        it( 'stops a running queue', function() {
            
            let count = 0;
            const queue = new promiseUtil.Queue( x => x() );
            const runners = Array.from( Array( 3 ), () => () => {
                ++count;
                queue.stop();
            } );

            runners.forEach( item => queue.add( item ) );

            return queue.run()
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => { 
                    expect( e.message ).toBe( 'stopped' );
                } );    

        } );

        it( 'passes a custom error', function() {
            
            let count = 0;
            const queue = new promiseUtil.Queue( x => x() );
            const runners = Array.from( Array( 3 ), () => () => {
                ++count;
                queue.stop( new Error( 'foobar' ) );
            } );
            runners.forEach( item => queue.add( item ) );

            return queue.run()
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => { 
                    expect( e.message ).toBe( 'foobar' );
                } );    

        } );

    } );

    describe( 'pause and resume', function() {

        it( 'pauses and resumes a queue', function() {
            
            const runners = [
                promiseUtil.defer(),
                promiseUtil.defer(),
                promiseUtil.defer(),
            ];

            const queue = new promiseUtil.Queue( x => x() );
            let ran = false;

            queue.add( () => runners[0].resolve() );
            queue.add( () => {
                queue.pause();
                runners[1].resolve();
            } );
            queue.add( () => {
                ran = true;
                runners[2].resolve();
            } );

            Promise.all( [runners[0], runners[1]] )   
                .then( () => {
                    // Runner 3 should not have run
                    expect( ran ).toBe( false );
                    return promiseUtil.wait( 0 );
                } )
                .then( () => {
                    // This should start it running
                    queue.resume();
                } );

            queue.run();    

            // We can only exit if all three runners have run
            return Promise.all( runners );

        } );

        it( 'adding an item does not resume a paused queue', function() {
            
            const runners = [
                promiseUtil.defer(),
                promiseUtil.defer(),
                promiseUtil.defer(),
            ];

            const queue = new promiseUtil.Queue( x => x() );
            let ran = false;

            queue.add( () => runners[0].resolve() );
            queue.add( () => {
                queue.pause();
                runners[1].resolve();
                process.nextTick( () => {
                    queue.add( x => x );
                } );
            } );
            queue.add( () => {
                ran = true;
            } );

            queue.run();

            // Wait until the first two runners finish
            return Promise.all( [runners[0], runners[1]] )
                .then( () => promiseUtil.wait( 0 ) )
                .then( () => {
                    // It should have paused.
                    // Make sure three never run
                    expect( ran ).toBe( false );
                } );
        } );

    } );

    describe( 'collect option', function() {
        
        it( 'returns the result of all queue operations', function() {
            
            const queue = new promiseUtil.Queue( value => value, { collect: true } );
            [1, 2, 3, 4].forEach( item => queue.add( item ) );

            return queue.run()
                .then( values => {

                    expect( values ).toEqual( [1, 2, 3, 4] );

                } );

        } );

    } );

    describe( 'parallel option', function() {

        it( 'runs the queue in parallel', function() {

            let testValue = 0;

            function *generator() {

                let count = testValue;
                ++testValue;
                yield 1;
                count += yield Promise.resolve( 1 );
                ++testValue;
                return count;   
            }

            const queue = new promiseUtil.Queue( generator, { parallel: 2, collect: true } );
            [1, 2, 3].forEach( item => queue.add( item ) );

            return queue.run()  
                .then( results => {
                    
                    // The result is the value of testValue
                    // when the generator started processing plus 1
                    // If all three items start at once the output would be [1,2,3]
                    // If they ran one at a time it would be [1,3,5]

                    expect( results ).toEqual( [1, 2, 5] );
                    expect( testValue ).toBe( 6 );
                } );


        } );

    } );

    describe( 'infinite option', function() {
        
        it( 'keeps the queue open after all items have been processed', function() {
            const runners = Array.from( Array( 5 ), () => promiseUtil.defer() );
            const queue = new promiseUtil.Queue( x => x.resolve(), { infinite: true } );
            runners.forEach( item => queue.add( item ) );

            queue.run();

            return Promise.all( runners )
                .then( () => promiseUtil.wait( 0 ) )
                .then( () => {
                    const newItem = promiseUtil.defer();
                    queue.add( newItem );
                    return newItem;
                } );

        } );

    } );

    describe( 'iterator option', function() {

        it( 'can take a custom iterator using the wait symbol', function() {
            
            function *iterator() {
                yield 1;
                yield 2;
                yield promiseUtil.Queue.waitSymbol;
                yield 3;
            }

            const queue = new promiseUtil.Queue( x => x, { 
                iterator: iterator(), 
                collect: true,
            } );

            let paused = false;

            // If the queue does not pause this test
            // will complete before this is run
            setImmediate( () => {
                paused = true;
                queue.resume();
            } );

            return queue.run()
                .then( values => {
                    expect( values ).toEqual( [1, 2, 3] );
                    expect( paused ).toBe( true );
                } );

        } );

    } );

} );