'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.defer', function() {

    it( 'returns a promise', function() {
        expect( promiseUtil.defer() ).toBeA( Promise );
    } );

    it( 'resolves with the provided value when resolve is called', function() {
        const defer = promiseUtil.defer();

        defer.resolve( 'foo bar' );

        return defer
            .then( value => {
                expect( value ).toEqual( 'foo bar' );
            } );

    } );

    it( 'rejects to the provided value when reject is called', function() {
        const defer = promiseUtil.defer();

        defer.reject( 'foo bar' );

        return defer
            .then( () => {
                throw new Error( 'should not be called' );
            } )
            .catch( value => {
                expect( value ).toEqual( 'foo bar' );
            } );

    } );

    it( 'can be resolved with a promise', function() {
        const defer = promiseUtil.defer();

        defer.resolve( Promise.resolve( 'foo bar' ) );

        return defer
            .then( value => {
                expect( value ).toEqual( 'foo bar' );
            } );

    } );

    it( 'can be rejected with a promise', function() {
        const defer = promiseUtil.defer();

        defer.resolve( Promise.reject( 'foo bar' ) );

        return defer
            .then( () => {
                throw new Error( 'should not be called' );
            } )
            .catch( value => {
                expect( value ).toEqual( 'foo bar' );
            } );

    } );


} );