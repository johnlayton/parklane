var express = require('express')
  , sock    = require('socket.io')
  , main    = require('./routes/main.js')
  , tree    = require('./routes/tree.js')
  , detail  = require('./routes/detail.js')
  , dates   = require('./routes/dates.js')
  , gantt   = require('./routes/gantt.js')
  , lib     = require('./lib/sql-library.js')
  , qry     = require('./lib/sql-query.js')
  , obj     = require('./lib/obj-merge.js')
  , browser = require('browserify')
  , sass    = require('node-sass')
  , mysql   = require('mysql')
  , http    = require('http')
  , util    = require('util')
  , path    = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ 
      src:   path.join( __dirname, '/less' )
    , dest:  path.join( __dirname, '/public' )
  }));
  app.use(browser({
    require : [ 'util',
                'underscore',
                'domready', 
                'traverse',
                'jquery-browserify',
                'd3', 
                path.join(__dirname, 'lib/obj-merge.js') ]
  }));
  app.use(sass.middleware({
      src:   path.join( __dirname, '/sass' )
    , dest:  path.join( __dirname, '/public' )
    , debug: true
  }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.get('/', main.index);

app.get('/tree/show/:id', tree.show); 
app.get('/tree/json/:id', tree.json); 

app.get('/detail/show/:id', detail.show);
app.get('/detail/json/:id', detail.json);

app.get('/gantt/show/:id', gantt.show);
app.get('/gantt/json/:id', gantt.json);

app.get('/dates/json', dates.json);

var server = http.createServer(app).listen(app.get('port'), "0.0.0.0", function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = sock.listen(server);
io.of('/gantt').on('connection', function (socket) {
  socket.on('query', function (query) {
    var inter;
    socket.set('query', query, function () {
      clearInterval( inter );
      socket.get('query', function (err, name) {
        var node = {
          id:   name.id,
          name: name.name,
          query: [
            {
              start   : name.from ? new Date( Date.parse( name.from ) ) : new Date( Date.now() - ( 2 * 24 * 60 * 60 * 1000 ) ),
              finish  : name.to   ? new Date( Date.parse( name.to ) )   : new Date( Date.now() + ( 7 * 24 * 60 * 60 * 1000 ) )
            }
          ]
        }
        inter = setInterval( function() {
          var db = mysql.createConnection({
            host     : '192.168.56.101',
            database : 'tree',
            user     : 'tree',
            password : 'tree'
          });
          qry.query(db, lib.node, node, function( top ) {
            socket.emit('update', top);
            db.end()
          });
        }, 2000);
      });
    });
  });
});


