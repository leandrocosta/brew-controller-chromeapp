(function() {
    angular
        .module('App')
        .directive('myTrack', myTrack);

    function myTrack(trackService) {
        return {
            scope: {
                track: '=model'
            },
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

                $scope.$on('add-step', function(event, obj) {
                    if (obj.track === vm.track) {
                        vm.addStep(obj.stepIdx);
                    }
                });

                $scope.$on('del-step', function(event, obj) {
                    if (obj.track === vm.track) {
                        vm.delStep(obj.stepIdx);
                    }
                });

                $scope.$on('play-pause', function(event, t) {
                    if (t === vm.track) {
                        vm.playPause();
                    }
                });

                $scope.$on('stop', function(event, t) {
                    if (t === vm.track) {
                        vm.stop();
                    }
                });

                $scope.$on('forward-step', function(event, t, s) {
                    if (t === vm.track) {
                        vm.forwardStep(s);
                    }
                });

                $scope.$on('finish', function(event, t) {
                    if (t === vm.track) {
                        vm.finish();
                    }
                });

                $scope.$on('start-timer', function(event, t, s) {
                    if (t === vm.track) {
                        vm.startTimer(s);
                    }
                });

                $scope.$on('save-config', function(event, t) {
                    if (t === vm.track) {
                        vm.saveConfig();
                    }
                });

                $scope.$on('alarm', function(event, obj) {
                    console.log('track directive - on alarm', obj);
                });

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
        }
    }
})();
