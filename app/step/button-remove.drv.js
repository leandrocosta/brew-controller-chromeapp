(function() {
    'use strict';

    angular.module('App')
        .directive('buttonRemove', function() {
            return {
                scope: {
                    onClick: '&'
                },
                template: '<button-base on-click="onClick()" aria-label="Remove" icon="close" class="md-icon-button" ' +
                    'fill="dimgray" style="position:absolute;right:-13px;top:-6px;"></button-base>'
            }
        });
})();
