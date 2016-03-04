'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const dgram = require('dgram');
const udpserver = dgram.createSocket('udp4');

app.use('/data', express.static('data'));
app.use('/js', express.static('js'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname+'/index.html'));
});

http.listen(8080, () => {
  console.log('Example app listening on port 8080!');
});

function generateData(socket) {
  var data;
  fs.readFile('data/accelerometer_data.json', 'utf8', (err, file) => {
    data = JSON.parse(file);
    var i = 0;
    var l = data.data.length;
    var interval = setInterval(() => {
      if (i < l) {
        socket.emit('receiveData', data.data[i++]);
      } else {
        clearInterval(interval);
      }
    }, 16);
  });
};

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('disconnect', () => {
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
