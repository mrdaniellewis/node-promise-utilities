'use strict';

const memwatch = require( 'memwatch-next' );
const promiseUtil = require( '..' );
const util = require( 'util' );

// This is a runs a very long queue to checks if it leaks memory
// The memory output needs to be manually inspected
( function() {

    console.log( 'This takes may take a while to run' );
    console.log( 'A large array is expected' );

    let maxLength = 10000000;
    let started = false;
    let hd;
    const collection = [0];

    return promiseUtil.series( () => {
        if ( !started ) {
            hd = new memwatch.HeapDiff();
            started = true;
        } else if ( maxLength === 0 ) {
            console.log( util.inspect( hd.end(), { depth: null } ) );
        }

        if ( maxLength > 0 ) {
            --maxLength;
            collection.push( maxLength );
        }
    }, collection, { collect: false } )
        .then( () => {
            console.log( 'done' );
        } )
        .catch( e => {
            console.log( 'ERROR', e );
        } );

}() );