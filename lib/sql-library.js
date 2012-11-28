var util = require('util')
var du   = require('date-utils')
var _    = require('underscore')

var debug = function( original ) {
  return function () {
    var query = original.apply( this, arguments );
    util.log( query );
    return query;
  }
}; 

var identity = function( node ) {
 return node.id
}

//exports.identity = debug( identity )
exports.identity = identity

var format = function( date ) {
  return date.toFormat( "YYYY-MM-DD HH24:MI:SS" )
}

//exports.format = debug( format )
exports.format = format

/*
var range = function( start, finish ) {
  return "select * from tree.dates " + 
         "where start between '" + format( start ) + "' " + 
         "and '" + format( finish ) + "'";
}

// exports.root = debug( root )
exports.root = root
*/

var node = function( parent ) {
  var sql = "select child.id as id, child.name as name, " +
            "parent.id as parent_id, parent.name as parent_name, " +
            "valid_dates.start as valid_start, valid_dates.finish as valid_finish, " +
            "linked_dates.start as linked_start, linked_dates.finish as linked_finish, " +
            "detail.name as detail_name, details.value as detail_value " +
            "from tree.task child " +
            "left outer join tree.tasks tasks on tasks.child = child.id " +
            "left outer join tree.task parent on parent.id = tasks.parent " +
            "left outer join tree.linked linked on linked.tasks = tasks.id " +
            "left outer join tree.dates linked_dates on linked_dates.id = linked.dates " +
            "left outer join tree.valid valid on valid.task = child.id " +
            "left outer join tree.dates valid_dates on valid_dates.id = valid.dates " +
            "left outer join tree.details details on details.task = child.id " +
            "left outer join tree.detail detail on detail.id = details.detail "
  if ( parent.id == 'root' ) {
    sql += "where tasks.parent is null ";
  } else {
    sql += "where tasks.parent = " + parent.id + " ";
  }
  if ( parent.linked && parent.linked.length > 0 ) {
    var tables = [ "valid_dates", "linked_dates" ]
    sql += "and ( "
    sql += _.toArray( _.map( tables, function(tbl) { 
              return _.toArray( _.map( parent.linked, function(lnk) { 
                  return "( " + tbl + ".start between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" and " + 
                                tbl + ".finish between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" )"
                }))
                .join(" or ")
              }))
              .join( " or " ) 
    sql += ")"
  }
  if ( parent.query && parent.query.length > 0 ) {
    var tables = [ "valid_dates", "linked_dates" ]
    sql += "and ( "
    sql += _.toArray( _.map( tables, function(tbl) { 
              return _.toArray( _.map( parent.query, function(lnk) { 
                  return "( " + tbl + ".start between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" and " + 
                                tbl + ".finish between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" )"
                }))
                .join(" or ")
              }))
              .join( " or " ) 
    sql += ")"
  }
  return sql;
}

//exports.node = debug( node )
exports.node = node