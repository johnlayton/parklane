var util = require('util')
var mysql = require('mysql')
var sql   = require('../lib/sql-library.js')

exports.show = function(req, res){

  util.log( util.inspect( req.params ) );

  res.render('plan', { 
    title: 'Planner', 
    parent: req.params.id
  });
}

exports.json = function(req, res){

  util.log( util.inspect( req.params ) )
  
  var db = mysql.createClient({
    host     : '192.168.56.101',
    database : 'tree',
    user     : 'tree',
    password : 'tree'
  });

  function query( conn, generator, node, callback ) {
    conn.query( generator(node), function( err, rows, fields) { 
      if (rows && rows.length > 0) {
        var called = 0;
        node.children = []
        node.link = "http://localhost:3001/detail/show/" + node.id
        for ( var i = 0 ; i < rows.length ; i ++ ) {
          node.children.push( rows[i] )
          query( conn, sql.child, rows[i], function( self ) { 
            called = called + 1;
            if ( called == rows.length ) {
              callback( node );
            }
          });
        }
      } else {
        node.link = "http://localhost:3001/detail/show/" + node.id
        callback( node );
      }
    });

  }

  if ( req.params.id == "root" ) {
    query(db, sql.root, {}, function( top ) { 
      util.log( util.inspect( top, true, 10 ) )	
      res.send( top )
      db.end()
    });
  } else {
    query(db, sql.child, { 'id': req.params.id }, function( top ) { 
      util.log( util.inspect( top, true, 10 ) )	
      res.send( top )
      db.end()
    });
  }    
    
}
