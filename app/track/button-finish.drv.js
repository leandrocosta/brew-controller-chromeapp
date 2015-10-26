(function() {
    'use strict';

    angular.module('App')
        .directive('buttonFinish', function() {
            return {
                scope: {
                    onClick: '&',
                    myDisabled: '@'
                },
                template: '<button-base on-click="onClick()" my-disabled="{{myDisabled}}" aria-label="Finish" ' +
                    'icon="skip_next" class="md-fab" fill="white"></button-base>'
            }
        });
})();
