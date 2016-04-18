/**
 * Created by daniel.irwin on 4/9/16.
 */

var express = require('express');
var path = require('path');
var app = express();
var portNum = 1337;
var WinkAPI = require('node-winkapi');
var config = require('./config.json');
var winky = new WinkAPI.WinkAPI(config);
var aOk = false;
var bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, 'public')));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


winky.login(config.userName, config.passPhrase, loggedIn)
    .on('error', function (err) {
        console.log('background error: ' + err.message);
    });


function loggedIn() {
    console.log('logged into wink');
    aOk = true;
}

var client = null;

function writeToFrontend(data){
    if(client){
        client.write('data:'+JSON.stringify(data) + '\n\n');
    }
}

app.get('/listen', function(req, res) {
    initData();
    req.socket.setTimeout(2147483647);

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    res.write('\n');

    if(!client){
        console.log('Client Connected!');
        client = res;
    }

    req.on("close", function() {
        console.log('Connection Closed');
        client = null;
    });

});

var routes = {
    update : function update(req, res){
        console.log('', req.body);

        winky.setDevice(req.body, req.body, function cb(err, data){
            if(!err){

                if(data.path){

                    var type = 'unknown';

                    var regex = new RegExp("\/(.*)\/[0-9]*");

                    var result = data.path.match(regex);

                    type = result[1];
                    console.log('', result);

                    data.type = type;
                }

                return res.json(deviceManip(data));
            }
            return res.json({ error : err});
        });
    }
};

app.post('/update', routes.update);

function deviceManip(device) {
    var d = {
        name: device.name,
        type: device.type,
        path: device.path
    };

    if (device.type == 'powerstrip' && device.outlets) {
        d.outlets = [];
        Object.keys(device.outlets).forEach(function (outlet) {
            d.outlets.push(device.outlets[outlet]);
        });
        console.log('', d);
    }
    else if (device.props && device.props.last_reading) {
        d.props = device.props.last_reading;
    }
    return d;
}


function adevice(device){
    var d = deviceManip(device);
    writeToFrontend(d);
}

function initData(){
    if(aOk){

        winky.getIcons(function(err, icons){
            if(!err){
                icons.forEach(function iconIt(icon){
                    writeToFrontend({
                        type: 'icon',
                        data : icon
                    });
                });
            }

        });

        winky.getDevices(function initDevices(err, devices){
            if(!err){
                devices.forEach(adevice);
            }
        });
    }
}
/**
 *  @returns {undefined} nothing
 */
function bootstrap() {
    console.log('listening on port ' + portNum + '!');
}

app.listen(portNum, bootstrap);