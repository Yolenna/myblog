var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var flash = require('connect-flash');
var settings = require('./settings');


var routes = require('./routes/index');
var users = require('./routes/users');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', { flag: 'a' });
var errorLog = fs.createWriteStream('error.log', { flag: 'a' });
var app = express();
var passsport = require('passport')
, GithubStrategy = require('passport-github').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream:accessLog}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
    secret: 'yolanda',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 1 },//1days
    store: new MongoStore({
        url: 'mongodb://localhost:27017/myblog'
    }),
    resave: true,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(function (err, req, res, next) {     //添加日志文件
    var meta = '[' + new Date() + ']' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
})
app.use(flash());
app.use(passsport.initialize());//初始化passport
app.use('/', routes);
app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace

passsport.use(new GithubStrategy({
    clientID: "a742937a8297bb191d55",
    clientSecret: "54f57fd7c28bc7ee1226d6e6ac01cb052e076eb4",
    callbackURL: "http://localhost:3000/login/github/callback"

}, function (accessToken, refreshToken, profile, done) {
    done(null, profile);
}
    ));

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
