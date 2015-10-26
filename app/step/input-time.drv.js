(function() {
    'use strict';

    angular.module('App')
        .directive('inputTime', function() {
            return {
                scope: {
                    time: '=model',
                    trackRunning: '='
                },
                templateUrl: 'app/step/input-time.drv.html'
            };
        });
})();
