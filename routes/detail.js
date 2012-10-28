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

  function child( node ) {
    return "select task.id, task.name, detail.name as label, details.value from tree.task task " +
           "inner join tree.details details on details.task = task.id " +
           "inner join tree.detail detail on details.detail = detail.id " +
           "inner join tree.tasks tasks on task.id = tasks.child " +
           "where tasks.parent = " + identity( node ) + " " +
           "order by task.id "
  }

  function root() {
    return "select task.id, task.name, detail.name as label, details.value from tree.task task "+
           "inner join tree.details details on details.task = task.id " +
           "inner join tree.detail detail on details.detail = detail.id " +
           "left outer join tree.tasks tasks on task.id = tasks.child "+
           "where tasks.parent is null"
  }
  
  function query( conn, generator, node, list, callback ) {
    conn.query( generator(node), function( err, rows, fields) {
      if (err) {
        util.log( util.inspect( err ) )
      }

      if (rows && rows.length > 0) {
        var called = 0;
        var nodes = underscore.groupBy( rows, identity )
        var pairs = underscore.pairs( nodes );
        underscore.each( pairs, function( pair ) { 
          list.push( pair[1] )
          query( conn, child, { id: pair[1][0].id }, list, function( self ) { 
            called = called + 1;
            if ( called == pairs.length ) {
              callback( list );
            }
          })
        })  

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

/*
  if ( req.params.id == "root" ) {
    query(db, root, {}, [], function( top ) { 
      util.log( util.inspect( top, true, 10 ) )
      res.render('detail', { 
        title:  'Details', 
        parent: req.params.id,
        tasks:  'hello'
      });
      res.
      db.end()
    });
  } else {
    query(db, child, { 'id': req.params.id }, [], function( top ) { 
      util.log( util.inspect( top, true, 10 ) ) 
      res.render('detail', { 
        title: 'Details', 
        parent: req.params.id,
        tasks: 'hello'
      });
      db.end()
    });
  }    
*/
}

