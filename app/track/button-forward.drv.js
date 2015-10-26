(function() {
    'use strict';

    angular.module('App')
        .directive('buttonForward', function() {
            return {
                scope: {
                    onClick: '&',
                    myDisabled: '@'
                },
                template: '<button-base on-click="onClick()" my-disabled="{{myDisabled}}" aria-label="Forward" ' +
                    'icon="fast_forward" class="md-fab" fill="white"></button-base>'
            }
        });
})();
