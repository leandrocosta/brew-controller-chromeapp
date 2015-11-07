(function() {
    'use strict';

    angular.module('App')
        .directive('buttonStartTimer', function() {
            return {
                scope: {
                    onClick: '&',
                    myDisabled: '@'
                },
                templateUrl: 'app/step/button-start-timer.drv.html'
            };
        });
})();
