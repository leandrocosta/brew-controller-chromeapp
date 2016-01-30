(function() {
    'use strict';

    angular.module('App')
        .directive('buttonRemove', function() {
            return {
                scope: {
                    onClick: '&'
                },
                template: '<button-base on-click="onClick()" aria-label="Remove" icon="close" class="md-icon-button" fill="dimgray"></button-base>'
            };
        });
})();
