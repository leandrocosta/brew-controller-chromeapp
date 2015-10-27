(function() {
    angular
        .module('App')
        .service('arduinoService', arduinoService);

    arduinoService.$inject = ['$q', '$interval'];

    function arduinoService($q, $interval) {
        var that = this;

        var promises = {
            "set": {},
            "play": {},
            "stop": {},
            "temp": {}
        };

        var connection = new SerialConnection();

        connection.onConnect.addListener(function() {
            console.log('connected to ' + that.config.usbPort + ' at ' + that.config.bitrate);
            that.state.desc = 'Connected!';
            promises["connect"].resolve();
            delete promises["connect"];
        });

        connection.onConnectError.addListener(function() {
            console.log('onConnectError');
            that.state.desc = 'Connection failed!';
            promises["connect"].reject();
            delete promises["connect"];
        });

        connection.onError.addListener(function(error) {
            console.log('onError', error);
            that.state.desc = 'Connection error!';
        });

        this.state = {
            desc: 'Not connected.'
        };

        this.config = {
            //usbPort: '/dev/ttyUSB0',
            bitrate: 9600
        };

        chrome.serial.getDevices(function(ports) {
            console.log('usb ports', ports);
            if (ports && ports.length) {
                that.config.usbPort = ports[0].path;
            }
        });

        this.set = function(track, step) {
            // S 0 11 10 10000 0 0 10000 35.0
            // {"cmd":"set","idx":0,"pinSSR":11,"pinDS18B20":10,"kp":10000,"ki":0,"kd":0,"windowSize":10000,"setpoint":35}
            /*var obj = {
                "cmd": "set",
                "idx": track.id,
                "pinSSR": track.config.pinSSR,
                "pinDS18B20": track.config.pinDS18B20,
                "kp": track.config.kp,
                "ki": track.config.ki,
                "kd": track.config.kd,
                "windowSize": track.config.windowSize,
                "setpoint": step.temperature
            };

            return this.sendCmdObj(track.id, obj);*/
            return this.sendCmdStr(track.id, 'set', [
                'S', track.id, track.config.pinSSR, track.config.pinDS18B20,
                track.config.kp, track.config.ki, track.config.kd, track.config.windowSize, step.temperature
            ].join(' '));
        };

        this.play = function(track) {
            // {"cmd":"play","idx":0}
            //return this.sendCmd(track.id, "play");
            return this.sendCmdStr(track.id, 'play', ['P', track.id].join(' '));
        };

        this.stop = function(track) {
            // {"cmd":"stop","idx":0}
            //return this.sendCmd(track.id, "stop");
            return this.sendCmdStr(track.id, 'stop', ['T', track.id].join(' '));
        };

        this.getTemperature = function(track) {
            //return track.mock_temperature;
            // {"cmd":"temp":"idx":0}
            //return this.sendCmd(track.id, "temp");
            return this.sendCmdStr(track.id, 'temp', ['E', track.id].join(' '));
        };

        /* this.sendCmd = function(trackId, cmd) {
             return this.sendCmdObj(trackId, {
                 "cmd": cmd,
                 "idx": trackId
             });
         };

         this.sendCmdObj = function(trackId, obj) {
             return this.sendCmdStr(trackId, obj.cmd, JSON.stringify(obj));
         };*/

        this.sendCmdStr = function(trackId, cmd, str) {
            //console.log('SEND: [' + str + ']');
            connection.send(str + '\n');
            var deferred = $q.defer();
            promises[cmd][trackId] = deferred;
            return deferred.promise;
        }

        connection.onReadLine.addListener(function(line) {
            //console.log('RECV: [' + line + ']');
            if (line.indexOf('LOG:') !== 0) {
                var obj = JSON.parse(line);
                if (angular.isDefined(obj.cmd) && angular.isDefined(obj.success)) {
                    promises[obj.cmd][obj.idx].resolve(obj);
                    delete promises[obj.cmd][obj.idx];
                } else if (angular.isDefined(obj.idx)) {
                    //console.log('REPORT: ', obj.idx, obj);
                    that.listeners[obj.idx](obj);
                }
            }
        });

        this.connect = function() {
            that.state.desc = 'Connecting...';
            var deferred = $q.defer();
            promises["connect"] = deferred;
            connection.connect(this.config.usbPort, this.config.bitrate);
            return deferred.promise;
        };

        //this.connect();
        this.listeners = {};
        this.registerListener = function(trackId, handler) {
            that.listeners[trackId] = handler;
        };
    }
})();

// Serial used from your Arduino board
//const DEVICE_PATH = 'COM11'; // PC
//const DEVICE_PATH = '/dev/ttyACM0'; //MAC
const DEVICE_PATH = '/dev/ttyUSB0';
const serial = chrome.serial;

/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function(buf) {
    var bufView = new Uint8Array(buf);
    //console.log('abs2str', bufView);
    var encodedString = String.fromCharCode.apply(null, bufView);
    //console.log('abs2str', encodedString);
    return decodeURIComponent(escape(encodedString));
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function(str) {
    var encodedString = unescape(encodeURIComponent(str));
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};


////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var SerialConnection = function() {
    this.connectionId = -1;
    this.lineBuffer = "";
    this.boundOnReceive = this.onReceive.bind(this);
    this.boundOnReceiveError = this.onReceiveError.bind(this);
    this.onConnect = new chrome.Event();
    this.onConnectError = new chrome.Event();
    this.onReadLine = new chrome.Event();
    this.onError = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
    if (!connectionInfo) {
        console.log("Connection failed.");
        this.onConnectError.dispatch();
        return;
    }
    console.log('onConnectComplete', connectionInfo);
    this.lineBuffer = "";
    this.connectionId = connectionInfo.connectionId;
    chrome.serial.onReceive.addListener(this.boundOnReceive);
    chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
    this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function(receiveInfo) {
    //console.log('SerialConnection.prototype.onReceive', receiveInfo);

    if (receiveInfo.connectionId !== this.connectionId) {
        return;
    }

    var dataBuffer = ab2str(receiveInfo.data);
    //console.log('dataBuffer: [' + dataBuffer + ']');
    this.lineBuffer += dataBuffer;

    //console.log('lineBuffer:', this.lineBuffer);

    var index;
    while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
        var line = this.lineBuffer.substr(0, index + 1);
        this.onReadLine.dispatch(line);
        this.lineBuffer = this.lineBuffer.substr(index + 1);
    }

};

SerialConnection.prototype.onReceiveError = function(errorInfo) {
    console.log('onReceiveError', errorInfo);

    if (errorInfo.connectionId === this.connectionId) {
        this.onError.dispatch(errorInfo.error);
    }
};

SerialConnection.prototype.connect = function(path, bitrate) {
    console.log('trying to connect to ' + path + ' at ' + bitrate);
    serial.connect(path, {
        bitrate: bitrate
    }, this.onConnectComplete.bind(this));
};

SerialConnection.prototype.send = function(msg) {
    if (this.connectionId < 0) {
        throw 'Invalid connection';
    }
    serial.send(this.connectionId, str2ab(msg), function(info) {
        //console.log('send', info);
    });
    serial.flush(this.connectionId, function(info) {
        //console.log('flush', info);
    });
};

SerialConnection.prototype.disconnect = function() {
    if (this.connectionId < 0) {
        throw 'Invalid connection';
    }
    serial.disconnect(this.connectionId, function() {});
};
