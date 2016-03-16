'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.wait', function() {

    it( 'resolve a promise after the time provided in the first argument', function() {

        const time = Date.now();

        return promiseUtil.wait( 100 )
            .then( () => {
                expect( Date.now() ).toBeGreaterThan( time - 100 );
            } );

    } );

    it( 'resolves to the value of the second argument', function() {

        return promiseUtil.wait( 0, 'foo bar' )
            .then( value => {
                expect( value ).toEqual( 'foo bar' );
            } );

    } );

} );