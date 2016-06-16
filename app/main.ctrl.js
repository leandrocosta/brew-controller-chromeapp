(function() {
    angular.module('App')
        .controller('MainCtrl', function($scope, $timeout, $q, $mdDialog, appConfig, chromeStorage, arduinoService, generalConfigService) {
            var vm = this;
            $scope.vm = vm;

            vm.borderTop = navigator.platform === 'Win32' ? '1px solid' : undefined;
            vm.borderColor = navigator.platform === 'Win32' ? 'rgba(0,0,0,.12)' : undefined;

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
                vm.tracks = angular.copy(vm.currentSetup.tracks);
                vm.logMessages = [];
            }

            resetCurrentSetup();

            vm.arduinoState = arduinoService.state;

            vm.connectToArduino = function() {
                arduinoService.connect().then(function() {
                    $timeout(function() {
                        $scope.$broadcast('save-config');
                    });
                });
            };

            vm.disconnectFromArduino = function() {
                arduinoService.disconnect();
            };

            vm.isConnected = function() {
                return arduinoService.isConnected();
            };

            vm.searchSetups = function() {
                var filteredItems = vm.setups.filter(function(item) {
                    return !vm.setupsSearchText || item.name.toLowerCase().indexOf(vm.setupsSearchText.toLowerCase()) >= 0;
                }).sort(function(a, b) {
                    return b.dateTime - a.dateTime;
                });
                return filteredItems;
            };

            vm.onSelectedSetupChange = function() {
                if (vm.selectedSetup === vm.currentSetup) {
                    return;
                }

                var setup = vm.selectedSetup;

                if (setup) {
                    vm.currentSetup = setup;
                    vm.tracks = angular.copy(vm.currentSetup.tracks || []);

                    angular.forEach(vm.tracks, function(track) {
                        var key = 'series_' + track.id + '_' + vm.currentSetup.dateTime;
                        console.log('get ' + key);
                        chromeStorage.getOrElse(key, function() {
                            return $q(function(resolve, reject) {
                                resolve([]);
                            });
                        }).then(function(series) {
                            track.series = series;
                            angular.forEach(track.series, function(series) {
                                angular.forEach(series.data, function(sample) {
                                    if (!(sample.x instanceof Date)) {
                                        sample.x = new Date(sample._xDateTime);
                                    }
                                });
                            });
                        });
                    });

                    var key = 'log_' + vm.currentSetup.dateTime;
                    console.log('get ' + key);
                    chromeStorage.getOrElse(key, function() {
                        return $q(function(resolve, reject) {
                            resolve([]);
                        });
                    }).then(function(logMessages) {
                        vm.logMessages = logMessages;
                    });

                    $timeout(function() {
                        $scope.$broadcast('save-config');
                    });
                } else {
                    resetCurrentSetup();
                }
            };

            arduinoService.registerLogListener(function(msg) {
                if (arduinoService.config.enableLog) {
                    vm.logMessages.push(msg);
                }
            });

            vm.openGeneralConfigDialog = function(ev) {
                generalConfigService.showDialog(ev);
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
                                return !$scope.searchText || item.name.indexOf($scope.searchText) >= 0;
                            });
                            return filteredItems;
                        };

                        $scope.save = function() {
                            var name = $scope.name;

                            var setupToSaveInto = $scope.selectedItem || vm.currentSetup;
                            var dateTime = setupToSaveInto.dateTime || new Date().getTime();

                            angular.extend(setupToSaveInto, {
                                name: name,
                                tracks: vm.tracks.map(function(track) {
                                    var key = 'series_' + track.id + '_' + dateTime;
                                    console.log('set ' + key);
                                    chromeStorage.set(key, track.series);
                                    return {
                                        id: track.id,
                                        config: angular.copy(track.config),
                                        steps: angular.copy(track.steps)
                                    };
                                })
                            });

                            var key = 'log_' + dateTime;
                            console.log('set ' + key);
                            chromeStorage.set(key, vm.logMessages);

                            if (!setupToSaveInto.dateTime) {
                                setupToSaveInto.dateTime = dateTime;
                                vm.setups.push(setupToSaveInto);
                            }

                            vm.selectedSetup = setupToSaveInto;

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
                    controller: function($scope, $mdDialog, FileSaver) {
                        $scope.items = vm.setups;

                        $scope.clone = function(item) {
                            console.log('clone', item);
                            resetCurrentSetup();
                            angular.merge(vm.currentSetup.tracks, item.tracks);
                            vm.tracks = angular.copy(vm.currentSetup.tracks);
                            angular.forEach(vm.tracks, function(track) {
                                track.series = [];
                            });
                            vm.selectedSetup = undefined;
                            $mdDialog.hide();
                        };

                        $scope.export = function(item) {
                            var itemToExport = angular.copy(item);
                            var promises = [];

                            itemToExport.tracks.map(function(track) {
                                var promise = chromeStorage.getOrElse('series_' + track.id + '_' + itemToExport.dateTime, function() {
                                    return $q(function(resolve, reject) {
                                        resolve([]);
                                    });
                                }).then(function(series) {
                                    track.series = series;
                                    track.series.map(function(series) {
                                        series.data.map(function(sample) {
                                            if (!(sample.x instanceof Date)) {
                                                sample.x = new Date(sample._xDateTime);
                                            }
                                        });
                                    });
                                });
                                promises.push(promise);
                            });

                            var promise = chromeStorage.getOrElse('log_' + itemToExport.dateTime, function() {
                                return $q(function(resolve, reject) {
                                    resolve([]);
                                });
                            }).then(function(logMessages) {
                                itemToExport.logMessages = logMessages;
                            });

                            promises.push(promise);

                            $q.all(promises).then(function() {
                                FileSaver.saveAs(new Blob([JSON.stringify(itemToExport)]), new Date(itemToExport.dateTime).toISOString() + ' - ' + itemToExport.name + '.json');
                            });
                        };

                        $scope.delete = function(item) {
                            chromeStorage.drop('log_' + item.dateTime);
                            angular.forEach(item.tracks, function(track) {
                                chromeStorage.drop('series_' + track.id + '_' + item.dateTime);
                            });
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

            vm.openLogDialog = function(ev) {
                var dialog = $mdDialog.show({
                    templateUrl: 'app/log-dialog.tpl.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    controller: function($scope, $mdDialog) {
                        $scope.logMessages = vm.logMessages;
                        $scope.close = function() {
                            $mdDialog.hide();
                        };
                    }
                });
            };
        });
})();
