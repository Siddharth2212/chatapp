var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var appRoutes = require('./routes/app');
var messageRoutes = require('./routes/messages');
var userRoutes = require('./routes/user');

var app = express();
// call socket.io to the app
app.io = require('socket.io')();
mongoose.connect('localhost:27017/node-angular');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
    next();
});

app.use('/message', messageRoutes);
app.use('/user', userRoutes);
app.use('/', appRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    return res.render('index');
});


var people = {};
// start listen with socket.io
app.io.on('connection', function(socket){
    socket.on('newMessage', function(msg){
        console.log('new message: ' + JSON.stringify(msg));
        app.io.emit('chatMessage', msg);
    });
    socket.on("join", function(user){
        console.log('socketinformation');
        people[user.userid] = {socketuserid: socket.id, firstname: user.firstname, userid: user.userid};
        console.log(people);
        //socket.emit("update", "You have connected to the server.");
        //app.io.emit("update", name + " has joined the server.")
        app.io.emit("updatePeople", people);
    });
    socket.on('unjoin', function(user){
        console.log('user disconnected')
        app.io.emit("userDisconnected", user);
    });
});

module.exports = app;
