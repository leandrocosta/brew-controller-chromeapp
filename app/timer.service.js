(function(){
    angular
    .module('App')
    .factory('timerService', timerService);

    function timerService() {
        return {
            new:function() {
                return new Timer();
            }
        };
    }

    var Timer = function(){
        this.running = false;
    };

    Timer.prototype.start = function() {
        this.acc_time = 0;
        this.init_time = new Date().getTime();
        this.running = true;
        this.paused = false;
    };

    Timer.prototype.pause = function() {
        this.acc_time += new Date().getTime() - this.init_time;
        this.paused = true;
    };

    Timer.prototype.unpause = function() {
        this.init_time = new Date().getTime();
        this.paused = false;
    };

    Timer.prototype.time = function() {
        var time = this.acc_time;

        if (! this.paused) {
            time += new Date().getTime() - this.init_time;
        }

        return time;
    };
})();