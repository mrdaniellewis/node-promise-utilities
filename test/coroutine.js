'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.coroutine', function() {

    it( 'resolves all yielded promises before continuing', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 2;
            count += yield Promise.resolve( 4 )
                .then( value => value + 8 );

            count += yield 16;
            return count;   
        }

        return promiseUtil.coroutine( generator, 1 )
            .then( function( value ) {
                expect( value ).toBe( 1 + 2 + 4 + 8 + 16 );
            } );

    } );

    it( 'accepts multiple arguments', function() {

        function *generator( a, b, c ) {
            
            yield;

            return [a, b, c];   
        }

        return promiseUtil.coroutine( generator, 1, 2, 3 )
            .then( function( value ) {
                expect( value ).toEqual( [1, 2, 3] );
            } );

    } );

    it( 'accepts no arguments', function() {

        function *generator() {
            
            yield;

            return 'foobar';   
        }

        return promiseUtil.coroutine( generator )
            .then( function( value ) {
                expect( value ).toEqual( 'foobar' );
            } );

    } );

    it( 'throws an error if anything but a generator is supplied', function() {

        expect( () => {
            promiseUtil.coroutine( 'x' ); 
        } ).toThrow( 'first argument must be a generator' );

        expect( () => {
            promiseUtil.coroutine( x => x ); 
        } ).toThrow( 'first argument must be a generator' );

    } );

    it( 'returns a rejected promise if the generator contains rejected promises', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 2;
            count += yield Promise.reject( 4 );
            count += yield 8;

            return count;   
        }

        return promiseUtil.coroutine( generator, 1 )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toBe( 4 );
            } );

    } );

    it( 'returns a rejected promise if the generator throws an error', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 2;
            throw 4; // eslint-disable-line no-throw-literal
            count += yield 8; // eslint-disable-line no-unreachable

            return count; // eslint-disable-line no-unreachable
        }

        return promiseUtil.coroutine( generator, 1 )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toBe( 4 );
            } );

    } );

    it( 'allows rejected promises to be caught as errors', function() {

        function *generator( _count ) {

            let count = _count;

            count += yield 2;

            try {
                count += yield Promise.reject( 4 );
            } catch ( e ) {
                count += e;
            }

            count += yield 8;

            return count;
        }

        return promiseUtil.coroutine( generator, 1 )
            .then( function( value ) {
                expect( value ).toBe( 1 + 2 + 4 + 8 );
            } );
    } );

    it( 'resolves sub generators', function() {

        function *sub( _count ) {

            let count = _count;
            count += yield Promise.resolve( 1 );
            count += yield Promise.resolve( 1 );

            return count;   
        }

        function *generator( _count ) {

            let count = _count;

            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield* sub( count );
            return count;   
        }

        return promiseUtil.coroutine( generator, 1 )
            .then( function( value ) {
                expect( value ).toBe( 8 );
            } );

    } );

} );