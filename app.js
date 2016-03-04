'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dgram = require('dgram');
var udpserver = dgram.createSocket('udp4');

app.use(express.static('data'));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

http.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});

function generateData(socket) {
  var data;
  fs.readFile('data/accelerometer_data.json', 'utf8', function(err, file) {
    data = JSON.parse(file);
    var i = 0;
    var l = data.data.length;
    var interval = setInterval(function() {
      if (i < l) {
        socket.emit('receiveData', data.data[i++]);
      } else {
        clearInterval(interval);
      }
    }, 16);
  });
};

io.on('connection', function(socket){
  console.log('User connected');

  socket.on('generateData', function(){
    // generateData(socket);
  });

  socket.on('disconnect', function(){
    console.log('User disconnected');
  });
});

// UDP socket
udpserver.on('error', (err) => {
  console.log(`UDP error:\n${err.stack}`);
  server.close();
});

udpserver.on('message', (msg, rinfo) => {
  io.emit('receiveData', JSON.parse(msg));
  console.log(`UDP server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

udpserver.on('listening', () => {
  var address = udpserver.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

udpserver.bind(1234);
