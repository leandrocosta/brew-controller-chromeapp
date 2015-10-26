(function() {
    'use strict';

    angular.module('App')
        .directive('buttonBase', function() {
            return {
                scope: {
                    onClick: '&',
                    myDisabled: '@',
                    ariaLabel: '@',
                    icon: '@',
                    fill: '@',
                    class: '@'
                },
                templateUrl: 'app/button-base.drv.html'
            };
        });
})();
