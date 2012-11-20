var express = require('express')
  , main    = require('./routes/main.js')
  , tree    = require('./routes/tree.js')
  , plan    = require('./routes/plan.js')
  , detail  = require('./routes/detail.js')
  , dates   = require('./routes/dates.js')
  , gantt   = require('./routes/gantt.js')
  , sql     = require('./lib/sql-library.js')
  , browser = require('browserify')
  , sass    = require('node-sass')
  , mysql   = require('mysql')
  , http    = require('http')
  , util    = require('util')
  , path    = require('path');

var app = express();

util.log( util.inspect( sql.identity( { id: { major: 1, minor: 2, patch: 3 }, desc: "the description" } ) ) );

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
      src: __dirname + '/less' 
  }));
  app.use(browser({
    require : [ 'underscore', 
                'domready', 
                'jquery-browserify',
                'd3', 
                path.join(__dirname, 'js/entry.js') ]
  }));
  app.use(sass.middleware({
      src:   path.join( __dirname, '/sass' )
    , dest:  path.join( __dirname, '/public' )
    , debug: true
  }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', main.index);

app.get('/tree/show/:id', tree.show); 
app.get('/tree/json/:id', tree.json); 

app.get('/plan/show/:id', plan.show); 
app.get('/plan/json/:id', plan.json); 

app.get('/detail/show/:id', detail.show);
app.get('/detail/json/:id', detail.json);

app.get('/gantt/show/:id', gantt.show);
app.get('/gantt/json/:id', gantt.json);

app.get('/dates/list', dates.list);

http.createServer(app).listen(app.get('port'), "0.0.0.0", function(){
  console.log("Express server listening on port " + app.get('port'));
});
