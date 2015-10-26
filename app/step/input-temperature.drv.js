(function() {
    'use strict';

    angular.module('App')
        .directive('inputTemperature', function() {
            return {
                scope: {
                    temperature: '=model',
                    trackRunning: '='
                },
                templateUrl: 'app/step/input-temperature.drv.html'
            };
        });
})();
