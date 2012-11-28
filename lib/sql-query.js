var _     = require("underscore")
var util  = require("util")
var sql   = require("./sql-library.js")
var merge = require("./obj-merge.js")

var nest = function( prps, ctx, lst ) {
  _.reduce( prps, function( ctx, prp  ){
    var path  = prp[0].split('_');
    var name  = _.last( path );
    var value = prp[1];
    if ( value ) {
      _.reduce( _.initial( path ), function( tar, fld ) { 
        if ( _.contains( lst, fld ) ) {
          if ( !tar[fld] ) {
             tar[fld] = [{}];
          }
          if ( _.contains( _.keys( tar[fld] ), name ) ) {
            _.last( tar[fld] ).push({})
          }
          return _.last( tar[fld] );
        } else {
          if ( !tar[fld] ) {
            tar[fld] = {};
          }
          return tar[fld];
        }
      }, ctx )[ name ] = value
    }
    return ctx;
  }, ctx);
  return ctx;
}

exports.nest = nest

var query = function( conn, generator, node, callback ) {
//  node.link = "http://localhost:3001/gantt/show/" + node.id +
//              "?name=" + node.name +
//              "&from=" + sql.format( node.linked ? node.linked[0].start : new Date( Date.now() - ( 2 * 24 * 60 * 60 * 1000 ) ) ) +
//              "&to=" + sql.format( node.linked ? node.linked[0].finish : new Date( Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) ) )
  conn.query( generator( node ), function( err, rows, fields ) {
    if (err) {
      util.log( util.inspect( err ) )
    } 
    else if ( rows && rows.length > 0 ) {
      var map = _.groupBy( rows, function(row){
        return row.id;
      });
      var val = _.values( map );
      var results = _.map( val, function( record ) {
        var temp = _.reduce( record, function( ctx, itm ) {
          return merge.merge( nest( _.pairs( itm ), {}, ["linked", "valid", "detail"] ), ctx )
        }, {})
        return temp;
      })
      node.children = []
      var called = 0;
      var total  = results.length
      for ( var i = 0 ; i < results.length ; i ++ ) {
        var current = results[i];
        node.children.push( current )
        query( conn, generator, current, function( obj ) {
          called = called + 1;
          if ( called == total ) {
            callback( node );
          }
        } );
      }
    } else {
      callback( node )
    }
  });
}

exports.query = query;
