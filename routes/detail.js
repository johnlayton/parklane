var util    = require('util')
var mysql   = require('mysql')
var _       = require('underscore')
var dates   = require('date-utils')
var treeify = require('treeify')
var sql   = require('../lib/sql-library.js')
var query = require('../lib/sql-query.js')
var merge = require('../lib/obj-merge.js')

exports.show = function(req, res){
  res.render('detail', { 
    title:  'Details', 
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

    util.debug( treeify.asTree( top ) ) 

    res.send( top )
    db.end()
  });
    
}
