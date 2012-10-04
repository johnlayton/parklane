var util = require('util')
var mysql = require('mysql')

exports.show = function(req, res){
  res.render('tree', { 
    title: 'Express', 
    parent: req.params.id
  });
}

exports.json = function(req, res){

  util.log( util.inspect( req.params ) )
  
  var db = mysql.createClient({
    host     : 'localhost',
    user     : 'tree',
    password : 'tree'
  });

  function child( node ) {
    return "select task.id, task.name from tree.task task "+
           "inner join tree.tasks on task.id = tasks.child "+
           "where tasks.parent = " + node.id
  }

  function root() {
    return "select task.id, task.name from tree.task task "+
           "left outer join tree.tasks tasks on task.id = tasks.child "+
           "where tasks.parent is null"
  }
  
  function query( conn, generator, node, callback ) {
    
    util.log( generator(node) );
    
    conn.query( generator(node), function( err, rows, fields) { 
      if (rows && rows.length > 0) {
        var called = 0;
        node.children = []
        node.link = "http://localhost:3000/tree/show/" + node.id
        for ( var i = 0 ; i < rows.length ; i ++ ) {
          node.children.push( rows[i] )
          query( conn, child, rows[i], function( self ) { 
            called = called + 1;
            if ( called == rows.length ) {
              callback( node );
            }
          });
        }
      } else {
        node.link = "http://localhost:3000/tree/show/" + node.id
        callback( node );
      }
    });

  }

  if ( req.params.id == "root" ) {
    query(db, root, {}, function( top ) { 
      util.log( util.inspect( top, true, 10 ) )	
      res.send( top )
      db.end()
    });
  } else {
    query(db, child, { 'id': req.params.id }, function( top ) { 
      util.log( util.inspect( top, true, 10 ) )	
      res.send( top )
      db.end()
    });
  }    
    
}
