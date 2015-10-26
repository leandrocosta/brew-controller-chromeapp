(function() {
    'use strict';

    angular.module('App')
        .directive('buttonStartBoil', function() {
            return {
                scope: {
                    onClick: '&',
                    myDisabled: '@'
                },
                templateUrl: 'app/step/button-start-boil.drv.html'
            };
        });
})();
