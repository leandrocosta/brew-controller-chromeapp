(function() {
    angular.module('App')
        .controller('MainCtrl', function($scope, $mdDialog, appConfig, chromeStorage /*, $mdToast, $interval, */ , dataService, arduinoService) {
            var vm = this;
            $scope.vm = vm;

            vm.appConfig = appConfig;

            $scope.$watch('vm.appConfig.demoMode', function(newValue, oldValue) {
                if (newValue) {
                    arduinoService.startDemo();
                } else {
                    arduinoService.stopDemo();
                }
            });
            /*dataService.getData().then(function(response) {
                vm.tracks = response.data;
            });*/
            chromeStorage.getOrElse('tracks', function() {
                console.log('getting tracks from dataService');
                return dataService.getData().then(function(response) {
                    return response.data;
                });
            }).then(function(tracks) {
                vm.tracks = tracks;
            });

            $scope.$watch('vm.tracks', function(newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                    //console.log('update', vm.tracks);
                    chromeStorage.set('tracks', vm.tracks);
                }
            }, true);

            vm.addStep = function(track, stepIdx) {
                $scope.$broadcast('add-step', {
                    track: track,
                    stepIdx: stepIdx
                });
            };

            vm.delStep = function(track, stepIdx) {
                console.log('del');
                $scope.$broadcast('del-step', {
                    track: track,
                    stepIdx: stepIdx
                });
            };

            vm.playPause = function(track) {
                $scope.$broadcast('play-pause', track);
            };

            vm.stop = function(track) {
                $scope.$broadcast('stop', track);
            };

            vm.forwardStep = function(track, stepIdx) {
                $scope.$broadcast('forward-step', track, stepIdx);
            };

            vm.finish = function(track) {
                $scope.$broadcast('finish', track);
            };

            vm.startBoil = function(track, stepIdx) {
                console.log('main.startBoil');
                $scope.$broadcast('start-boil', track, stepIdx);
            };

            vm.connectToArduino = function() {
                arduinoService.connect();
            };

            vm.disconnectFromArduino = function() {
                arduinoService.disconnect();
            };

            vm.isConnected = function() {
                return arduinoService.isConnected();
            };

            vm.openGeneralConfigDialog = function(ev) {
                var dialog = $mdDialog.show({
                    templateUrl: 'app/general-config-dialog.tpl.html',
                    controller: function($scope, $mdDialog) {
                        $scope.config = angular.copy(arduinoService.config);

                        $scope.save = function() {
                            arduinoService.config = angular.copy($scope.config);
                            $mdDialog.hide();
                        };

                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        };

                        $scope.refresh = function() {
                            getDevices();
                        };

                        function getDevices() {
                            console.log('getting USB ports');
                            chrome.serial.getDevices(function(ports) {
                                $scope.ports = ports;
                                /*if (!angular.isDefined($scope.config.usbPort)) {*/
                                $scope.config.usbPort = $scope.ports[0].path;
                                arduinoService.config = angular.copy($scope.config);
                                /*}*/
                            });
                        }

                        getDevices();
                    },
                    targetEvent: ev,
                    clickOutsideToClose: true
                });
            };

            vm.openTrackConfigDialog = function(ev, track) {
                var outerScope = $scope;
                var dialog = $mdDialog.show({
                    templateUrl: 'app/track-config-dialog.tpl.html',
                    controller: function($scope, $mdDialog) {
                        $scope.config = angular.copy(track.config);

                        $scope.save = function() {
                            track.config = angular.copy($scope.config);
                            outerScope.$broadcast('save-config', track);
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

            vm.openChart = function(ev, track) {
                var dialog = $mdDialog.show({
                    templateUrl: 'app/chart-dialog.tpl.html',
                    controller: function($scope, $mdDialog) {
                        /*$scope.data = [];
                        for (var i = 0; i <= 120; i += 1) {
                            $scope.data.push({
                                x: new Date(new Date().getTime() + i * 60000),
                                y: 2 * i
                            });
                        }*/
                        $scope.data = track.series;

                        $scope.options = {
                            axes: {
                                x: {
                                    type: 'date',
                                    /*zoomable: true,*/
                                },
                                y: {},
                                y2: {
                                    ticks: 1,
                                    min: 0,
                                    max: 1,
                                }
                            },
                            series: [{
                                y: 'input',
                                axis: 'y',
                                type: 'area',
                                label: 'Temperature',
                                color: '#d62728', //'#8c564b'
                                /*lineMode: 'monotone',*/
                            }, {
                                y: 'outputSSR',
                                type: 'area', //'column',
                                axis: 'y2',
                                label: 'SSR Output',
                                color: '#ff7f0e', //'#ffaa00'
                                /*lineMode: 'basis-open',*/
                            }],
                            /*lineMode: 'monotone',*/
                            drawDots: false,
                        };

                        $scope.close = function() {
                            $mdDialog.hide();
                        };

                        $scope.Math = window.Math;
                    },
                    targetEvent: ev,
                    clickOutsideToClose: true
                });
            }

            vm.arduinoState = arduinoService.state;
        });
})();
