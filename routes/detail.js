var util       = require('util')
var mysql      = require('mysql')
var underscore = require('underscore')

exports.show = function(req, res){
  res.render('detail', { 
    title:  'Details', 
    parent: req.params.id,
  })
}

exports.json = function(req, res){

  var db = mysql.createClient({
    host     : '192.168.56.101',
    database : 'tree',
    user     : 'tree',
    password : 'tree'
  });

  function identity( node ) {
    return node.id
  }

  function details( node ) {
    return "select detail.name, details.value from tree.detail detail " +
           "inner join tree.details details on detail.id = details.detail " +
           "inner join tree.task task on task.id = details.task " +
           "where task.id = " + identity( node );
  }

  function child( node ) {
    return "select task.id, task.name from tree.task task " +
           "inner join tree.tasks tasks on task.id = tasks.child " +
           "where tasks.parent = " + identity( node )
  }

  function root() {
    return "select task.id, task.name from tree.task task "+
           "left outer join tree.tasks tasks on task.id = tasks.child "+
           "where tasks.parent is null"
  }

  function props( conn, generator, node, list, callback ) {
    conn.query( generator( node ), function( err, results, fields ) {
      if (err) {
        util.log( util.inspect( err ) )
      }
      else {
        var called = 0;
        node.properties = []
        for ( var i = 0 ; i < results.length ; i ++ ) {
          node.properties.push( results[i] )
          called = called + 1
          if ( called == results.length ) {
            callback( node );
          }
        }
      }
    });
  }

  function query( conn, generator, node, list, callback ) {
    conn.query( generator( node ), function( err, results, fields) {
      if (err) {
        util.log( util.inspect( err ) )
      }
      else if (results && results.length > 0) {
        var called = 0;
        for ( var i = 0 ; i < results.length ; i ++ ) {
          var inner = results[i]
          list.push( inner )

          //add props to inner
          props( conn, details, inner, list, function( self ) {
            called = called + 1;
            if ( called == ( results.length + 1 ) ) {
              callback( list );
            }
          })

          // add children to list
          query( conn, child, inner, list, function( self ) {
            called = called + 1;
            if ( called == ( results.length + 1 ) ) {
              callback( list );
            }
          });
        }
      } else {
        callback( list );
      }
    });
  }

  if ( req.params.id == "root" ) {
    query(db, root, {}, [], function( top ) { 
      util.log( util.inspect( top, true, 10 ) ) 
      res.send( top )
      db.end()
    });
  } else {
    query(db, child, { 'id': req.params.id }, [], function( top ) { 
      util.log( util.inspect( top, true, 10 ) ) 
      res.send( top )
      db.end()
    });
  }    

}

