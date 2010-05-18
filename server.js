HOST = null; // localhost
PORT = 8001;

var fu = require("./fu"),
    sys = require("sys"),
    url = require("url"),
    qs = require("querystring");

var MESSAGE_BACKLOG = 200,
    SESSION_TIMEOUT = 60 * 1000;
    
var MAX_PATHS = 100;

var sketchroom = new function () {
  var paths = [],
      callbacks = [];
      
  this.appendPath = function (rawPath) {
    var path = {path: rawPath, timestamp: (new Date()).getTime()};
    paths.push(path);
    
    while( callbacks.length > 0 ) {
      callbacks.shift().callback([path]);
    }
    
    while( paths.length > MAX_PATHS )
    {
      paths.shift();
    }
  };
  
  this.query = function(since, callback) {
    var matching = [];
    
    for( var i = 0; i < paths.length; i++ ) {
      var path = paths[i];
      if( path.timestamp > since ) {
        matching.push(path);
      }
    }
    
    if( matching.length != 0 ) {
      callback(matching);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  }
};

fu.listen(PORT, HOST);

fu.get("/", fu.staticHandler("index.html"));
fu.get("/javascripts/raphael.js", fu.staticHandler("javascripts/raphael.js"));
fu.get("/javascripts/json2.js", fu.staticHandler("javascripts/json2.js"));
fu.get("/javascripts/raphael.sketchpad.js", fu.staticHandler("javascripts/raphael.sketchpad.js"));
fu.get("/javascripts/sketchroom.js", fu.staticHandler("javascripts/sketchroom.js"));
fu.get("favicon.ico", fu.staticHandler("favicon.ico")); // annoyed by 404 errors in browser :P

fu.get("/recv", function (req, res) {
  if (!qs.parse(url.parse(req.url).query).since) {
    res.simpleJSON(400, { error: "Must supply since parameter" });
    return;
  }

  var since = parseInt(qs.parse(url.parse(req.url).query).since, 10);

  sketchroom.query(since, function (paths) {
    res.simpleJSON(200, { paths: paths });
  });
});

fu.get("/send", function (req, res) {
  var path = qs.parse(url.parse(req.url).query).path;
  sys.puts(path);
  sketchroom.appendPath(path);
  res.simpleJSON(200, {});
});
