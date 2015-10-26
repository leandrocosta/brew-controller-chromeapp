(function() {
    'use strict';

    angular.module('App')
        .directive('progressTemperature', function() {
            return {
                scope: {
                    stepTemperature: '@',
                    initTime: '@',
                    initTemp: '@',
                    currTemp: '@'
                },
                templateUrl: 'app/step/progress-temperature.drv.html'
            };
        });
})();
