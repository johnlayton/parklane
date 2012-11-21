var util  = require('util')
var mysql = require('mysql')
var dates = require('date-utils')
var _     = require('underscore')
var sql   = require('../lib/sql-library.js')

exports.json = function(req, res){

  var db = mysql.createConnection({
      host     : '192.168.56.101'
    , database : 'tree'
    , user     : 'tree'
    , password : 'tree'
  });

  var sql = sql.range( Date.parse( 'Thu Oct 31 2012 00:00:00 GMT+1100' )
                     , Date.parse( 'Thu Nov 01 2012 00:00:00 GMT+1100' ) )

  db.query( sql, function( err, results, fields ) {

    results.push( { query: sql } )

    _.each( results, function( date ) {
      util.log( util.inspect( date ) );
      util.log( new Date( Date.parse( date.start ) ) );
    })

    res.send( results )

    db.end();
  });

}