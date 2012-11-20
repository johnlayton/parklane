var _ = require('underscore')

var merge = function(first, second) {
    var cache = {}
    copy( first, cache )
    copy( second, cache )
    return cache;
}

var copy = function( src, trg ) {
    for (prop in src) {
        if (src.hasOwnProperty(prop)) {
            if ( _.isUndefined( trg[prop] ) ) {
                trg[prop] = src[prop];
            } else  if ( _.isEqual( src[prop], trg[prop] ) ) {
                // Ignore
            } else if ( _.isArray( trg[prop] ) ) {
                if ( _.isArray( src[prop] ) ) {
                    _.each( src[prop], function( itm ) {  
                        if ( !_.find( trg[prop], function( val ) { return _.isEqual( itm, val ); } ) ) {
                            trg[prop].push( itm );
                        }
                    });
                } else if ( _.isObject( src[prop] ) ) {
                    if ( !_.find( trg[prop], function( val ) { return _.isEqual( val, src[prop] ); } ) ) {
                        trg[prop].push( src[prop] );
                    }
                } else {
                    trg[prop].push( src[prop] );
                }
            } else if ( _.isObject( trg[prop] ) ) {
                trg[prop] = [ src[prop], trg[prop] ]
            } else if ( _.isNumber( trg[prop] ) || _.isString( trg[prop] ) ) {
                trg[prop] += src[prop];
            } else {
                trg[prop] = src[prop];
            }
        }
    }
    return trg;    
}

module.exports = merge