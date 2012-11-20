var util  = require('util')
var mysql = require('mysql')
var _     = require('underscore')
var dates = require('date-utils')
var sql   = require('../lib/sql-library.js')
var merge = require('../lib/obj-merge.js')

exports.show = function(req, res){

  util.log( util.inspect( req.query ) );

  res.render('gantt', { 
    title  : 'Timeline', 
    parent : req.params.id,
    name   : req.query.name,
    from   : req.query.from ? new Date( Date.parse( req.query.from ) ) : new Date( Date.now() - ( 2 * 24 * 60 * 60 * 1000 ) ),
    to     : req.query.to   ? new Date( Date.parse( req.query.to ) )   : new Date( Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) )
  });
}

exports.json = function(req, res){

  var db = mysql.createConnection({
    host     : '192.168.56.101',
    database : 'tree',
    user     : 'tree',
    password : 'tree'
  });

  function nest( prps, ctx, lst ) {
    _.reduce( prps, function( ctx, prp  ){
      var path  = prp[0].split('_')
      var value = prp[1]
      if ( value ) {
        _.reduce( _.initial( path ), function( tar, fld ) { 
          if ( _.contains( lst, fld ) ) {
            if ( !tar[fld] ) {tar[fld] = [{}]; } return _.last( tar[fld] );
          } else {
            if ( !tar[fld] ) {tar[fld] = {}; }   return tar[fld];
          }
        }, ctx )[ _.last( path )] = value
      }
      return ctx;
    }, ctx);
    return ctx;
  }

  function query( conn, generator, node, callback ) {
    node.link = "http://localhost:3001/gantt/show/" + node.id + 
                "?name=" + node.name + 
                "&from=" + sql.format( node.linked ? node.linked[0].start : new Date( Date.now() - ( 2 * 24 * 60 * 60 * 1000 ) ) ) + 
                "&to=" + sql.format( node.linked ? node.linked[0].finish : new Date( Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) ) )
    conn.query( generator( node ), function( err, rows, fields ) {
      if (err) {
        util.log( util.inspect( err ) )
      } 
      else if ( rows && rows.length > 0 ) {
        var results = _.map( _.values( _.groupBy( rows, "id" ) ), function( record ) {
          return _.reduce( record, function( ctx, itm ) {
            return merge( ctx, nest( _.pairs( itm ), {}, ["linked", "valid", "detail"] ) )
          }, {})  
        })
        node.children = []
        var called = 0;
        var total  = results.length
        for ( var i = 0 ; i < results.length ; i ++ ) {
          var current = results[i];
          node.children.push( current )
          query( conn, sql.node, current, function( obj ) {
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

  var node = {
    id:   req.params.id,
    name: req.query.name,
    query: [
      {
        start   : req.query.from ? new Date( Date.parse( req.query.from ) ) : new Date( Date.now() - ( 2 * 24 * 60 * 60 * 1000 ) ),
        finish  : req.query.to   ? new Date( Date.parse( req.query.to ) )   : new Date( Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) )
      }
    ]
  }

  query(db, sql.node, node, function( top ) { 
    res.send( top )
    db.end()
  });
  
}
