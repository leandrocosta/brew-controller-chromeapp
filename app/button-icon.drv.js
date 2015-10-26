(function() {
    'use strict';

    angular.module('App')
        .directive('buttonIcon', function() {
            return {
                scope: {
                    icon: '@',
                    fill: '@'
                },
                template: '<ng-md-icon icon="{{icon}}" style="fill:{{fill}};position:relative;top:6px;"></ng-md-icon>'
            };
        });
})();
