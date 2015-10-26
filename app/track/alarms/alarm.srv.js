(function() {
    angular
        .module('App')
        .service('alarmService', alarmService);

    function alarmService($document, $interval) {
        var timer = null;

        this.play = function() {
            if (!timer) {
                timer = $interval(function() {
                    $document.find('audio')[0].play();
                }, 1000);
            }
        };

        this.stop = function() {
            if (timer) {
                $interval.cancel(timer);
                timer = null;
            }
        }
    }
})();
