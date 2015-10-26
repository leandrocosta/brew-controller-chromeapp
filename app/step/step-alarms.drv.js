(function() {
    'use strict';

    angular.module('App')
        .directive('stepAlarms', function() {
            return {
                scope: {
                    alarms: '=',
                    alarmedAlarms: '=',
                    readonly: '@'
                },
                templateUrl: 'app/step/step-alarms.drv.html',
                controllerAs: 'vm',
                bindToController: true,
                /*require: '^myTrack',
                link: function(scope, elem, attrs, trackVm) {
                    scope.trackVm = trackVm;
                },*/
                controller: function($scope) {
                    var vm = this;

                    vm.toNumber = function(chip) {
                        return Number(chip);
                    };

                    /*$scope.$watch('vm.alarmedAlarms', function(newValue, oldValue) {
                        console.log('watch alarmedAlarms', newValue, oldValue);
                        if (newValue !== oldValue) {
                            vm.onAlarm({
                                track: 1,
                                value: 2
                            });
                        }
                    }, true);*/
                    /*$scope.$on('alarm', function(event, obj) {
                        console.log('stepAlarms directive - on alarm', obj);
                    });*/
                }
            };
        });
})();
