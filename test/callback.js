'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.callback', function() {

    // Create a test object with a node type callback
    function Tester( value ) {
        this.value = value;
    }
    // This will call cb with, this.value and the supplied arguments, 
    // or as an error if the first argument is an error 
    Tester.prototype.callback = function( /* args.., cb */ ) {
        
        const args = Array.prototype.slice.call( arguments );
        const cb = args.pop();

        if ( args[0] instanceof Error ) {

            cb( args[0] );

        } else {
            
            args.unshift( this.value );
            args.unshift( null );
            cb.apply( null, args );
        }
    };
    const tester = new Tester( 'foo bar' );

    describe( 'calling with a context and function name', function() {

        it( 'returns the callback result as a promise', function() {

            return promiseUtil.callback( tester, 'callback' )
                .then( value => {
                    expect( value ).toBe( 'foo bar' );
                } );

        } );

        it( 'returns multiple arguments as an array', function() {

            return promiseUtil.callback( tester, 'callback', 'fee', 'fi' )
                .then( value => {
                    expect( value ).toEqual( ['foo bar', 'fee', 'fi'] );
                } );

        } );

        it( 'rejects the promise on an error', function() {

            return promiseUtil.callback( tester, 'callback', new Error( 'error' ) )
                .then( function() {
                    throw new Error( 'should not be called' );
                } )
                .catch( value => {
                    expect( value ).toBeA( Error );
                    expect( value.message ).toBe( 'error' );
                } );

        } );

    } );

    describe( 'calling with a function', function() {

        it( 'returns the callback result as a promise', function() {

            return promiseUtil.callback( null, tester.callback.bind( tester ) )
                .then( value => {
                    expect( value ).toBe( 'foo bar' );
                } );

        } );

        it( 'returns multiple arguments as an array', function() {

            return promiseUtil.callback( null, tester.callback.bind( tester ), 'fee', 'fi' )
                .then( value => {
                    expect( value ).toEqual( ['foo bar', 'fee', 'fi'] );
                } );

        } );

        it( 'rejects the promise on an error', function() {

            return promiseUtil.callback( null, tester.callback.bind( tester ), new Error( 'error' ) )
                .then( () => {
                    throw new Error( 'should not be called' );
                } )
                .catch( value => {
                    expect( value ).toBeA( Error );
                    expect( value.message ).toBe( 'error' );
                } );

        } );

    } );

    describe( 'calling with a context and function', function() {

        const tester2 = new Tester( 'fi fo' );

        it( 'returns the callback result as a promise', function() {

            return promiseUtil.callback( tester2, tester.callback )
                .then( value => {
                    expect( value ).toBe( 'fi fo' );
                } );

        } );

        it( 'returns multiple arguments as an array', function() {

            return promiseUtil.callback( tester2, tester.callback, 'fee', 'fi' )
                .then( value => {
                    expect( value ).toEqual( ['fi fo', 'fee', 'fi'] );
                } );

        } );

        it( 'rejects the promise on an error', function() {

            return promiseUtil.callback( tester2, tester.callback, new Error( 'error' ) )
                .then( () => {
                    throw new Error( 'should not be called' );
                } )
                .catch( value => {
                    expect( value ).toBeA( Error );
                    expect( value.message ).toBe( 'error' );
                } );

        } );

    } );

} );