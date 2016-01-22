(function() {
    angular.module('App')
        .controller('MainCtrl', function($scope, $q, $mdDialog, appConfig, chromeStorage, dataService, arduinoService, chartService, generalConfigService) {
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

            chromeStorage.getOrElse('setups', function() {
                return $q(function(resolve, reject) {
                    resolve([]);
                });
            }).then(function(setups) {
                vm.setups = setups;
            });

            $scope.$watch('vm.setups', function(newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                    console.log('update setups', vm.setups);
                    chromeStorage.set('setups', vm.setups);
                }
            }, true);

            function resetCurrentSetup() {
                vm.currentSetup = {
                    tracks: [{
                        id: 0,
                        config: {},
                    }, {
                        id: 1,
                        config: {},
                    }, {
                        id: 2,
                        config: {},
                    }]
                };
            }

            resetCurrentSetup();

            $scope.$watch('vm.currentSetup', function(newValue, oldValue) {
                vm.tracks = vm.currentSetup.tracks;
            });

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
                generalConfigService.showDialog(ev);
            };

            vm.openTrackConfigDialog = function(ev, track) {
                console.log('MainCtrl.openTrackConfigDialog(ev)', ev, track);

                var outerScope = $scope;
                var dialog = $mdDialog.show({
                    templateUrl: 'app/track-config-dialog.tpl.html',
                    controller: function($scope, $mdDialog) {
                        $scope.config = angular.copy(track.config);

                        $scope.save = function() {
                            track.config = angular.copy($scope.config);
                            if (arduinoService.isConnected() || vm.appConfig.demoMode) {
                                outerScope.$broadcast('save-config', track);
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

            vm.openChart = function(ev, track) {
                chartService.showDialog(ev, track);
            };

            vm.searchSetups = function() {
                var filteredItems = vm.setups.filter(function(item) {
                    return item.name.toLowerCase().indexOf(vm.setupsSearchText.toLowerCase()) >= 0;
                }).sort(function(a, b) {
                    return b.dateTime - a.dateTime;
                });
                return filteredItems;
            };

            vm.onSelectedSetupChange = function() {
                var setup = vm.selectedSetup;
                console.log('onSelectedSetupChange', setup);

                if (setup) {
                    vm.currentSetup = angular.copy(setup);
                    vm.currentSetup.tracks.map(function(track) {
                        track.series.map(function(series) {
                            series.data.map(function(sample) {
                                if (!(sample.x instanceof Date)) {
                                    sample.x = new Date(sample._xDateTime);
                                }
                            });
                        });
                    });
                } else {
                    resetCurrentSetup();
                }
            };

            vm.openSaveDialog = function(ev) {
                console.log('MainCtrl.openSaveDialog(ev)', ev);

                var dialog = $mdDialog.show({
                    templateUrl: 'app/setups/save-dialog.tpl.html',
                    controller: function($scope, $mdDialog) {
                        $scope.name = vm.currentSetup.name;
                        $scope.selectedItem = vm.selectedSetup;

                        $scope.search = function() {
                            var filteredItems = vm.setups.filter(function(item) {
                                return item.name.indexOf($scope.searchText) >= 0;
                            });
                            return filteredItems;
                        };

                        $scope.save = function() {
                            if ($scope.selectedItem) {
                                $scope.selectedItem.name = $scope.name;
                                $scope.selectedItem.tracks = angular.copy(vm.tracks);
                                vm.selectedSetup = $scope.selectedItem;
                            } else {
                                var setup = {
                                    name: $scope.name,
                                    dateTime: new Date().getTime(),
                                    tracks: angular.copy(vm.tracks),
                                };
                                vm.setups.push(setup);
                                vm.selectedSetup = setup;
                            }
                            vm.onSelectedSetupChange();
                            $mdDialog.hide();
                        };

                        $scope.cancel = function() {
                            $mdDialog.hide();
                        };
                    },
                    onComplete: function() {
                        angular.element(document.body).find('md-dialog').find('input')[0].focus();
                    },
                    targetEvent: ev,
                    clickOutsideToClose: true
                });
            };

            vm.openListDialog = function(ev) {
                var dialog = $mdDialog.show({
                    templateUrl: 'app/setups/list-dialog.tpl.html',
                    controller: function($scope, $mdDialog) {
                        $scope.items = vm.setups;

                        $scope.delete = function(item) {
                            vm.setups.splice(vm.setups.indexOf(item), 1);
                        };

                        $scope.close = function() {
                            $mdDialog.hide();
                        };
                    },
                    targetEvent: ev,
                    clickOutsideToClose: true
                });
            };

            vm.arduinoState = arduinoService.state;

            vm.addStep = function(track, stepIdx) {
                $scope.$broadcast('add-step', {
                    track: track,
                    stepIdx: stepIdx
                });
            };

            vm.delStep = function(track, stepIdx) {
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

            vm.startTimer = function(track, stepIdx) {
                $scope.$broadcast('start-timer', track, stepIdx);
            };
        });
})();
