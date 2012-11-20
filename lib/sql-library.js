var util = require('util')
var du = require('date-utils')
var _ = require('underscore')

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

var range = function( start, finish ) {
  return "select * from tree.dates " + 
         "where start between '" + format( start ) + "' " + 
         "and '" + format( finish ) + "'";
}

//exports.range = debug( range );
exports.range = range;

var details = function( node ) {
  return "select detail.name, details.value from tree.detail detail " +
         "inner join tree.details details on detail.id = details.detail " +
         "inner join tree.task task on task.id = details.task " +
         "where task.id = " + identity( node );
}

//exports.details = debug( details )
exports.details = details

var valid = function( node ) {
  return "select dates.start, dates.finish from tree.dates dates " +
         "inner join tree.valid valid on dates.id = valid.dates " +
         "inner join tree.task task on task.id = valid.task " +
         "where task.id = " + identity( node );
}

//exports.valid = debug( valid )
exports.valid = valid

var linked = function( parent ) {
  if ( identity( parent ) == 'root' ) {
    return valid;
  } else {
    return function( node ) {

      var sql = "select dates.start, dates.finish from tree.dates dates " +
                "inner join tree.linked linked on dates.id = linked.dates " +
                "inner join tree.tasks tasks on tasks.id = linked.tasks " +
                "where tasks.parent = " + identity( parent ) + " " +
                "and tasks.child = " + identity( node ) + " ";

      if ( parent.linked && parent.linked.length > 0 ) {
        var clause = _.toArray( _.map( parent.linked, function(lnk) { 
          return "( dates.start between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" " + 
                 "  and dates.finish between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" )"
        })).join( " or " )
        sql += ( "and ( " + clause + " )" )
      }

      return sql;
    };
  }
}

// exports.linked = debug( linked )
exports.linked = linked

var child = function( node ) {

  util.log( "Child (of " +  node.id + ", " + node.linked + ")")

  var sql = "select task.id, task.name from tree.task task " +
            "inner join tree.tasks tasks on task.id = tasks.child " +
            "where tasks.parent = " + identity( node ) + " ";
  
  if ( node.linked && node.linked.length > 0 ) {
    var clause = _.toArray( _.map( node.linked, function(lnk) { 
      return "( dates.start between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" " + 
             "  and dates.finish between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" )"
    })).join( " or " )
    var select = "and task.id in ( " +
                 "select task.id from tree.task " +
                 "inner join tree.tasks tasks on tasks.child = task.id " +
                 "inner join tree.linked linked on tasks.id = linked.tasks " +
                 "inner join tree.dates dates on dates.id = linked.dates " +
                 "where (" + clause + ")" +
                 ")"
    sql += select;
  } else {
    sql += " and tasks.child is null"
  }

  util.log( "Child (of " +  node.id + ", " + node.linked + ") -> " + sql )

  return sql;
}

// exports.child = debug( child )
exports.child = child

var root = function( node ) {
  var sql = "select task.id, task.name from tree.task task " +
            "left outer join tree.tasks tasks on task.id = tasks.child "+
            "where tasks.parent is null "

  if ( node.linked && node.linked.length > 0 ) {
    var clause = _.toArray( _.map( node.linked, function(lnk) { 
      return "( dates.start between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" " + 
             "  and dates.finish between \"" + format( lnk.start ) + "\" and \"" + format( lnk.finish ) + "\" )"
    })).join( " or " )
    var select = "and task.id in ( " +
                 "select task.id from tree.task " +
                 "inner join tree.tasks tasks on tasks.parent = task.id " +
                 "inner join tree.linked linked on tasks.id = linked.tasks " +
                 "inner join tree.dates dates on dates.id = linked.dates " +
                 "where (" + clause + ")" +
                 ")"
    sql += select;
  } else {
    sql += " and tasks.child is null"
  }

  util.log( "Root (of " +  node.id + ", " + node.linked + ") -> " + sql )

  return sql;

}

// exports.root = debug( root )
exports.root = root

var node = function( parent ) {

  var sql = "select child.id as id, child.name as name, " +
            "parent.id as parent_id, parent.name as parent_name, " +
            "valid_dates.start as valid_start, valid_dates.finish as valid_finish, " +
            "linked_dates.start as linked_start, linked_dates.finish as linked_finish, " +
            "detail.name as detail_name, details.value as detail_value " +
            "from tree.task child " +
            "left outer join tree.tasks tasks        on tasks.child = child.id " +
            "left outer join tree.task parent        on parent.id = tasks.parent " +
            "left outer join tree.linked linked      on linked.tasks = tasks.id " +
            "left outer join tree.dates linked_dates on linked_dates.id = linked.dates " +
            "left outer join tree.valid valid        on valid.task = child.id " +
            "left outer join tree.dates valid_dates  on valid_dates.id = valid.dates " +
            "left outer join tree.details details    on details.task = child.id " +
            "left outer join tree.detail detail      on detail.id = details.detail "

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