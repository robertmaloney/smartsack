'use strict';

const influx = require('influx');
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const dgram = require('dgram');
const udpserver = dgram.createSocket('udp4');
const WEB_PORT = 8080;
const UDP_PORT = 1234;
const INFLUXDB_HOST = 'sackdb.d.mycased.com';
const INFLUXDB_PORT = 9999;
const INFLUXDB_PUSH_INTERVAL = 1000;

app.use('/data', express.static('data'));
app.use('/js', express.static('js'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname+'/index.html'));
});

http.listen(WEB_PORT, () => {
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

var influx_client = influx({
  host : INFLUXDB_HOST,
  port : INFLUXDB_PORT,
  protocol : 'http',
  database: 'testsack'
})
var data_buffer = [];

udpserver.on('message', (msg, rinfo) => {
  var data = JSON.parse(msg);
  io.emit('receiveData', data);
  data.time = new Date();
  data_buffer.push([
    data
  ]);
  console.log(`UDP server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

udpserver.on('listening', () => {
  var address = udpserver.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

udpserver.bind(UDP_PORT);

setInterval(() => {
  console.log(`Post data to influxdb`)
  if (data_buffer.length > 0) {
    influx_client.writePoints('raw_data', data_buffer, []);
    data_buffer = [];
  }  
}, INFLUXDB_PUSH_INTERVAL);

