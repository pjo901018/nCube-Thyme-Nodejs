

var net = require('net');

var SerialPort = null;
var myPort = null;
var tas_state = 'init';
var ultraOn = false;

useparentport = 3105;
useparenthostname = 'localhost';
ctname = 'cnt-ultrasonic';

function logger(msg) {
  // console.log(msg)
}

function tas_watchdog() {
  if(tas_state == 'init') {
    upload_client = new net.Socket();

    // upload_client.on('data', on_receive);
    upload_client.on('data', logger);

    upload_client.on('error', function(err) {
      console.log(err);
      tas_state = 'reconnect';
    });

    upload_client.on('close', function() {
      console.log('Connection closed');
      upload_client.destroy();
      tas_state = 'reconnect';
    });

    if(upload_client) {
      console.log('tas init ok');
      tas_state = 'init_serial';
    }
  }
  else if(tas_state == 'init_serial') {
    console.log("init");
    tas_state = 'connect';
  }
  else if(tas_state == 'connect' || tas_state == 'reconnect') {
    upload_client.connect(useparentport, useparenthostname, function() {
      console.log('upload Connected');
      console.log('download Connected - ' + ctname + ' hello');
      var cin = {ctname: ctname, con: 'hello'};
      var str = JSON.stringify(cin);

      console.log('write before', str);
      upload_client.write(str + '<EOF>');
      console.log('write after');

      tas_state = 'upload';
    });
  }
  else if(tas_state == 'upload') {
    // console.log('upload');
    var ultra = require('./ultrasonic');
    // console.log('ultra', ultra); 
    function write_upload_client(value) {
      var cin = {ctname: ctname, con: value};
      upload_client.write(JSON.stringify(cin) + '<EOF>');
    }
    if(!ultraOn) {
      console.log("execute ultra");
      ultra(write_upload_client);
      ultraOn = true;
    }
  }
}

cycle_delay = (1)*1000;
setInterval(tas_watchdog, cycle_delay);
