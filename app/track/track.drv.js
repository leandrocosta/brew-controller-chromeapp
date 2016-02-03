(function() {
    angular
        .module('App')
        .directive('myTrack', myTrack);

    function myTrack($mdDialog, trackService, chartService) {
        return {
            scope: {
                track: '=model',
                appConfig: '=',
                arduinoConnected: '@'
            },
            templateUrl: 'app/track/track.drv.html',
            controllerAs: 'vm',
            bindToController: true,
            controller: function($scope, $element, $mdToast, trackService, toastQueue) {
                var vm = this;

                vm.addStep = function(index) {
                    trackService.addStep(vm.track, index);
                };

                vm.delStep = function(index) {
                    trackService.delStep(vm.track, index);
                };

                vm.playPause = function() {
                    if (!vm.track.running) {
                        trackService.play(vm.track).then(function() {

                        }, function(errorMsg) {
                            var toast = $mdToast.simple()
                                .content(errorMsg)
                                .action('OK')
                                .hideDelay(0)
                                .highlightAction(false)
                                .position('bottom right')
                                .parent($element);
                            $mdToast.show(toast);
                        });
                    } else if (vm.track.paused) {
                        trackService.unpause(vm.track);
                    } else {
                        trackService.pause(vm.track);
                    }
                };

                vm.stop = function() {
                    trackService.stop(vm.track).then(function() {}, function(errorMsg) {
                        var toast = $mdToast.simple()
                            .content(errorMsg)
                            .action('OK')
                            .hideDelay(0)
                            .highlightAction(false)
                            .position('bottom right')
                            .parent($element);
                        $mdToast.show(toast);
                    });
                };

                vm.forwardStep = function(stepIdx) {
                    trackService.forwardStep(vm.track, stepIdx);
                };

                vm.finish = function() {
                    trackService.finish(vm.track);
                };

                vm.startTimer = function(stepIdx) {
                    trackService.startTimer(vm.track, stepIdx);
                };

                vm.saveConfig = function() {
                    trackService.saveConfig(vm.track);
                };

                vm.alarm = function(value) {
                    var toast = $mdToast.simple()
                        .content('Alarm (' + value + ' min)')
                        .action('OK')
                        .hideDelay(0)
                        .highlightAction(false)
                        .position('bottom right')
                        .parent($element);
                    toastQueue.add(toast);
                };

                vm.openTrackConfigDialog = function(ev) {
                    var outerScope = $scope;
                    var dialog = $mdDialog.show({
                        templateUrl: 'app/track/config-dialog.tpl.html',
                        controller: function($scope, $mdDialog) {
                            $scope.config = angular.copy(vm.track.config);

                            $scope.save = function() {
                                vm.track.config = angular.copy($scope.config);
                                if (vm.arduinoConnected || vm.appConfig.demoMode) {
                                    vm.saveConfig();
                                }
                                $mdDialog.hide();
                            };

                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };
                        },
                        targetEvent: ev,
                        clickOutsideToClose: true
                    });
                };

                vm.openChart = function(ev) {
                    chartService.showDialog(ev, vm.track);
                };

                trackService.registerListener(vm.track);

                vm.track.running = false;
                vm.track.status = {};
                vm.track.series = vm.track.series || [];
                vm.track.steps = vm.track.steps || [];
                vm.track.steps.forEach(function(step) {
                    step.running = false;
                    delete step.run;
                });
            }
        };
    }
})();
