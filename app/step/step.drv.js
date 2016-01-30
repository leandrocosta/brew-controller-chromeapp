(function() {
    'use strict';

    angular.module('App')
        .directive('step', function() {
            return {
                scope: {
                    model: '='
                },
                controllerAs: 'vm',
                bindToController: true,
                controller: function($scope) {
                    var vm = this;

                    vm.step = vm.model;

                    $scope.$watch('vm.step.temperature', function(newValue, oldValue) {
                        fixAlarmsOrder();
                    });

                    $scope.$watch('vm.step.alarms', function(newValue, oldValue) {
                        if (newValue.length >= oldValue.length) {
                            fixAlarmsOrder();
                        }
                    }, true);

                    function fixAlarmsOrder() {
                        if (vm.step.temperature) {
                            vm.step.alarms.sort(function(a, b) {
                                return a - b;
                            });
                        } else {
                            vm.step.alarms.sort(function(a, b) {
                                return b - a;
                            });
                        }
                    }
                }
            };
        });
})();
