'use strict';

const promiseUtil = require( '../' );
const expect = require( 'expect' );

describe( 'promiseUtil.sequence', function() {

    it( 'returns a Promise', function() {

        expect( promiseUtil.sequence( [] ) ).toBeA( Promise );

    } );

    it( 'resolves the supplied functions in a sequence', function() {

        function addOneAsync( x ) {

            return Promise.resolve( x )
                .then( () => x + 1 );

        }

        const sequence = [addOneAsync, addOneAsync, addOneAsync];

        return promiseUtil.sequence( sequence, 10 )
            .then( x => {
                expect( x ).toEqual( 13 );
            } );

    } );

} );