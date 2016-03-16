'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.resolve', function() {

    it( 'resolves a function and single argument as a promise', function() {

        return promiseUtil.resolve( x => x, 'foobar' )
            .then( value => {
                expect( value ).toBe( 'foobar' );
            } );

    } );

    it( 'rejects a function that errors using a promise', function() {

        return promiseUtil.resolve( x => {
            throw new Error( x );
        }, 'foobar' )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e.message ).toBe( 'foobar' );
            } );

    } );

} );