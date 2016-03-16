'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'queue.fifo', function() {

    it( 'returns a function', function() {

        expect( promiseUtil.fifo( x => x ) ).toBeA( Function );

    } );

    describe( 'queuing', function() {
        
        it( 'returns a promise', function() {

            const fifo = promiseUtil.fifo( x => x );

            return fifo( 1 )
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'resolves promises', function() {

            const fifo = promiseUtil.fifo( x => x );

            return fifo( Promise.resolve( 1 ) )
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'resolves no argument', function() {

            const fifo = promiseUtil.fifo( () => 1 );

            return fifo()
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'resolves generators as coroutines', function() {

            function *generator() {
                const value = yield Promise.resolve( 1 );
                return value;
            }

            const fifo = promiseUtil.fifo( generator );

            return fifo()
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'rejects rejecting promises', function() {

            const fifo = promiseUtil.fifo( () => Promise.reject( 'error' ) );

            return fifo( 0 )
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toEqual( 'error' );
                } );

        } );

        it( 'rejects erroring promises', function() {

            const fifo = promiseUtil.fifo( () => { 
                throw 'error'; // eslint-disable-line no-throw-literal
            } );

            return fifo()
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toEqual( 'error' );
                } );

        } );

        it( 'rejects erroring generators', function() {

            function *generator() {
                const value = yield Promise.reject( 'error' );
                return value;
            }

            const fifo = promiseUtil.fifo( generator );

            return fifo()
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toEqual( 'error' );
                } );

        } );

        it( 'runs added functions in order', function() {

            const fifo = promiseUtil.fifo( x => x() );

            const action = x => Promise.resolve( x );

            const actions = [
                fifo( action.bind( null, 1 ) ),
                fifo( action.bind( null, 2 ) ),
                fifo( action.bind( null, 3 ) ),
                fifo( action.bind( null, 4 ) ),
            ];

            return Promise.all( actions )
                .then( values => {
                    expect( values ).toEqual( [1, 2, 3, 4] );
                } );
        } );

        it( 'keeps resolving functions infinitely', function() {

            const fifo = promiseUtil.fifo( x => x() );

            const action = x => Promise.resolve( x );

            const actions = [
                fifo( action.bind( null, 1 ) ),
                fifo( action.bind( null, 2 ) ),
            ];

            return Promise.all( actions )
                .then( () => {
                    actions.push( fifo( action.bind( null, 3 ) ) );
                    actions.push( fifo( action.bind( null, 4 ) ) ); 
                    return Promise.all( actions );
                } )
                .then( values => {
                    expect( values ).toEqual( [1, 2, 3, 4] );
                } );
        } );

        it( 'keeps resolving after an error', function() {

            const fifo = promiseUtil.fifo( x => x() );

            fifo( () => {
                throw 'error'; // eslint-disable-line no-throw-literal
            } )
            .catch( e => {
                expect( e ).toEqual( 'error' );
                return fifo( () => 1 );
            } )
            .then( value => {    
                expect( value ).toEqual( 1 );
            } );
              
        } );

        it( 'rejects if a function is not supplied', function() {

            expect( () => {
                promiseUtil.fifo()( {} );
            } ).toThrow( 'first argument must be a function' );

        } );


    } );

    describe( 'parallel option', function() {

        it( 'runs items in parallel', function() {

            let testValue = 0;

            function *generator() {

                let count = testValue;
                ++testValue;
                yield 1;
                count += yield Promise.resolve( 1 );
                ++testValue;

                return count;   
            }

            const fifo = promiseUtil.fifo( generator, { parallel: 2 } );

            const actions = [
                fifo( generator ),
                fifo( generator ),
                fifo( generator ),
            ];

            return Promise.all( actions )
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

} );