var _ = require('underscore')
var util = require('util')

var log = function( msg, obj ) {
  util.debug( msg + " " + util.inspect( obj ) );
  console.log( msg + " " + util.inspect( obj ) );
}

var merge = function (first, second, equalTo) {
  var equalTo = equalTo || function (a) {
    return function (b) {
      return _.isEqual(a, b);
    }
  };
  var cache = {};
  copy(first, cache, equalTo);
  copy(second, cache, equalTo);
  return cache;
}

exports.merge = merge

var copy = function (src, trg, equalTo) {
  var equalTo = equalTo || function (a) {
    return function (b) {
      return _.isEqual(a, b);
    }
  };
  _.each(_.keys( src ), function(prop) {
    if (src.hasOwnProperty(prop)) {
      if (_.isUndefined(trg[prop])) {
        trg[prop] = _.clone(src[prop]);
      } else if (_.isArray(trg[prop])) {
        if (_.isArray(src[prop])) {
          _.each(src[prop], function (itm) {
            var found = _.find( trg[prop], equalTo(itm) )
            if (found) {
              found = copy(itm, found, equalTo);
            } else {
              trg[prop].push( itm );
            }
          });
        } else if (_.isObject(src[prop])) {
          if (!_.find(trg[prop], function (val) {
            return _.isEqual(val, src[prop]);
          })) {
            trg[prop].push(src[prop]);
          }
        } else {
          trg[prop].push(src[prop]);
        }
      } else if (_.isObject(trg[prop])) {
        trg[prop] = copy(src[prop], trg[prop], equalTo);
      } else if (_.isNumber(trg[prop]) || _.isString(trg[prop])) {
        if (_.isEqual(trg[prop], src[prop])) {

        } else {
          trg[prop] = src[prop];
        }
      } else {
        trg[prop] = src[prop];
      }
    }
  });
  return trg;
}

exports.copy = copy
