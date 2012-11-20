var util  = require('util')
var mysql = require('mysql')
var _     = require('underscore')
var dates = require('date-utils')
var sql   = require('../lib/sql-library.js')

exports.show = function(req, res){

  util.log( util.inspect( req.query ) );

  res.render('tree', { 
    title  : 'Structure', 
    parent : req.params.id,
    from   : req.query.from ? new Date( Date.parse( req.query.from ) ) : new Date( Date.now() - ( 2 * 24 * 60 * 60 * 1000 ) ),
    to     : req.query.to   ? new Date( Date.parse( req.query.to ) )   : new Date( Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) )
  });
}

exports.json = function(req, res){

  util.log( util.inspect( req.query ) )
  
  var from = new Date( Date.parse( req.query.from ) ).clearTime();
  var to   = new Date( Date.parse( req.query.to ) ).clearTime().add({ days: 1 })

  var db = mysql.createClient({
    host     : '192.168.56.101',
    database : 'tree',
    user     : 'tree',
    password : 'tree'
  });


  function nest( prps, ctx ) {
    _.reduce( prps, function( ctx, prp  ){
      _.reduce( _.initial( prp[0].split('_') ), function( tar, fld ) { 
        if ( !tar[fld] ) { tar[fld] = {}; } return tar[fld]  
      }, ctx )[ _.last( prp[0].split('_') )] = prp[1]
      return ctx;
    }, ctx);
    return ctx;
  }
  
  function props( conn, type, generator, node, callback ) {
    conn.query( generator( node ), function( err, results, fields ) {
      if (err) {
        util.log( util.inspect( err ) )
      }
      else {
        node[type] = results;
        callback( node );
      }
    });
  }

  function query( conn, generator, node, callback ) {
    conn.query( generator(node), function( err, rows, fields) { 
      if ( err ) {
        util.log( util.inspect( err ) );
        return;
      }
      else {
        if (rows && rows.length > 0) {
          var called = 0;
          var total = ( rows.length  * 2 )

          node.children = []
          node.link = "http://localhost:3001/tree/show/" + node.id

          for ( var i = 0 ; i < rows.length ; i ++ ) {
            
            var stuff = rows[i]
            node.children.push( stuff )

            query( conn, sql.child, stuff, function( self ) { 
              called = ( called + 1 );
              if ( called == total) {
                callback( node );
              }
            });

            props( conn, "details", sql.details, stuff, function( self ) {
              called = ( called + 1 );
              if ( called == total ) {
                callback( node );
              }
            } );

          }
        } else {
          node.link = "http://localhost:3001/tree/show/" + node.id
          callback( node );
        }
      }
    });

  }

  if ( req.params.id == "root" ) {
    query(db, sql.root, { id: 'root' }, function( top ) { 
      util.log( util.inspect ( top, true, 7 ) )
      res.send( top )
      db.end()
    });
  } else {
    query(db, sql.child, { id: req.params.id }, function( top ) { 
      util.log( util.inspect ( top, true, 7 ) )
      res.send( top )
      db.end()
    });
  }    
    
}
