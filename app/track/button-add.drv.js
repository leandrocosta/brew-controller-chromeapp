(function() {
    'use strict';

    angular.module('App')
        .directive('buttonAdd', function() {
            return {
                scope: {
                    onClick: '&'
                },
                template: '<button-base on-click="onClick()" aria-label="Add" icon="add" class="md-fab" fill="white"></button-base>'
            };
        });
})();
