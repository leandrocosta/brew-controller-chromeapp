(function() {
    'use strict';

    angular.module('App')
        .directive('buttonStop', function() {
            return {
                scope: {
                    onClick: '&',
                    myDisabled: '@'
                },
                template: '<button-base on-click="onClick()" my-disabled="{{myDisabled}}" aria-label="Stop" icon="stop" ' +
                    'class="md-fab" fill="white"></button-base>'
            };
        });
})();
