'use strict';

const promiseUtil = require( '..' );
const memwatch = require( 'memwatch-next' );
const util = require( 'util' );


// This is a runs a very long queue to checks if it leaks memory
// The memory output needs to be manually inspected
( function() {

    console.log( 'This may take while to run' );

    let maxLength = 10000000;
    let started = false;
    let hd;

    const queue = new promiseUtil.Queue( () => {
        if ( !started ) {
            hd = new memwatch.HeapDiff();
            started = true;
        } else if ( maxLength === 0 ) {
            console.log( util.inspect( hd.end(), { depth: null } ) );
        }

        if ( maxLength > 0 ) {
            --maxLength;
            queue.add( maxLength );
        }
    } );

    queue.add( 0 );


    queue.run()
        .then( () => {
            console.log( 'done' );
        } );

}() );