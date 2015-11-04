(function() {
    'use strict';

    angular.module('App')
        .directive('buttonPlayPause', function() {
            return {
                scope: {
                    onClick: '&',
                    showPlay: '@',
                    showPause: '@',
                    myDisabled: '@'
                },
                /*template: '<button-base on-click="onClick()" arial-label="Play / pause" icon="play_arrow" class="md-fab" fill="white"></button-base>'*/
                template: '<md-button ng-click="onClick()" ng-disabled="myDisabled === ' + "'true'" + '" ng-enter="onClick()" ' +
                    'class="md-fab" aria-label="Play / pause" ng-mouseenter="mouseover=true" ng-mouseleave="mouseover=false" ng-class="{' + "'md-focused'" + ':mouseover}">' +
                    '<button-icon icon="play_arrow" ng-if="showPlay === ' + "'true'" + '" fill="white"></button-icon>' +
                    '<button-icon icon="pause" ng-if="showPause === ' + "'true'" + '" fill="white"></button-icon>' +
                    '</md-button>'
            };
        });
})();
