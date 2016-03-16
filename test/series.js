'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.series', function() {

    it( 'runs a function on each item in an iterator', function() {

        const spy = expect.createSpy().andCall( value => value );

        return promiseUtil.series( spy, [1, 2, 3, 4] )
            .then( values => {

                expect( spy.calls.length ).toBe( 4 );
                expect( spy )
                    .toHaveBeenCalledWith( 1 )
                    .toHaveBeenCalledWith( 2 )
                    .toHaveBeenCalledWith( 3 )
                    .toHaveBeenCalledWith( 4 );

                expect( values ).toEqual( [1, 2, 3, 4] );

            } );

    } );

    it( 'throws an error if not supplied with a function', function() {

        expect( () => {
            return promiseUtil.series( {} );
        } ).toThrow( 'first argument must be a function' );

    } );

    it( 'resolves returned promises', function() {

        return promiseUtil.series( value => Promise.resolve( value ), [1, 2, 3, 4] )
            .then( values => {
                expect( values ).toEqual( [1, 2, 3, 4] );
            } );

    } );

    it( 'rejects errors', function() {

        return promiseUtil.series( value => Promise.reject( value ), [1, 2, 3, 4] )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toEqual( 1 );
            } );

    } );

    it( 'resolves a generator', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield 1;
            return count;   
        }

        return promiseUtil.series( generator, [1, 2, 3, 4] )
            .then( values => {
                
                expect( values ).toEqual( [4, 5, 6, 7] );

            } );

    } );

    it( 'resolves a generator yielding generators', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield 1;
            count += yield* subGenerator();
            return count;   
        }

        function *subGenerator() {

            let count = 0;
            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield 1;
            return count;   
        }

        return promiseUtil.series( generator, [1, 2, 3, 4] )
            .then( values => { 
                expect( values ).toEqual( [7, 8, 9, 10] );
            } );

    } );

    it( 'rejects errors in a generator', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 1;
            throw 'x'; // eslint-disable-line no-throw-literal
        }

        return promiseUtil.series( generator, [1, 2, 3, 4] )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toEqual( 'x' );
            } );

    } );

    it( 'allows an array iterable to be added to', function() {

        const iterable = [1];
        function doAction( value ) {
            if ( value < 4 ) {
                iterable.push( value + 1 );
            }
            return value;
        }

        return promiseUtil.series( doAction, iterable )
        .then( values => {
            expect( values ).toEqual( [1, 2, 3, 4] );
        } );

    } );

    describe( 'collect option', function() {

        it( 'suppresses returning values', function() {

            const spy = expect.createSpy().andCall( value => value );

            return promiseUtil.series( spy, [1, 2, 3, 4], { collect: false } )
                .then( values => {
                    
                    expect( values ).toEqual( [] );
                   
                } );

        } );

    } );

    describe( 'parallel option', function() {

        it( 'runs the series in parallel', function() {

            function *generator( _count ) {

                let count = _count;

                count += yield 1;
                count += yield Promise.resolve( 1 );
                return count;   
            }

            return promiseUtil.series( generator, [0, 1, 2, 3, 4, 5], { parallel: 2 } )  
                .then( results => {
                    expect( results ).toEqual( [2, 3, 4, 5, 6, 7] );
                } );

        } );

        it( 'runs the series in parallel where parallel exceeds items', function() {

            function *generator( _count ) {

                let count = _count;

                count += yield 1;
                count += yield Promise.resolve( 1 );
                return count;   
            }

            return promiseUtil.series( generator, [0, 1, 2, 3, 4, 5], { parallel: 100 } )  
                .then( results => {
                    expect( results ).toEqual( [2, 3, 4, 5, 6, 7] );
                } );

        } );

        it( 'actually runs items in parallel', function() {

            let testValue = 0;

            function *generator() {

                let count = testValue;
                ++testValue;
                yield 1;
                count += yield Promise.resolve( 1 );
                ++testValue;
                return count;   
            }

            return promiseUtil.series( generator, [null, null, null], { parallel: 2 } )  
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