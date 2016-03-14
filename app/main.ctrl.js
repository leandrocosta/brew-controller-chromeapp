(function() {
    angular.module('App')
        .controller('MainCtrl', function($scope, $q, $mdDialog, appConfig, chromeStorage, arduinoService, generalConfigService) {
            var vm = this;
            $scope.vm = vm;

            vm.borderTop = navigator.platform === 'Win32' ? '1px solid':undefined;
            vm.boderColor = navigator.platform === 'Win32' ? 'rgba(0,0,0,.12)':undefined;

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
                    }],
                    logMessages: []
                };
                vm.tracks = vm.currentSetup.tracks || [];
                vm.logMessages = vm.currentSetup.logMessages || [];
            }

            resetCurrentSetup();

            vm.arduinoState = arduinoService.state;

            vm.connectToArduino = function() {
                arduinoService.connect().then(function() {
                    $scope.$broadcast('save-config');
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
                var setup = vm.selectedSetup;

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
                    vm.tracks = vm.currentSetup.tracks || [];
                    vm.logMessages = vm.currentSetup.logMessages || [];
                } else {
                    resetCurrentSetup();
                }

                //console.log(vm.tracks[0]);
                //$scope.$broadcast('save-config');
            };

            arduinoService.registerLogListener(function(msg) {
                vm.logMessages.push(msg);
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
                            if ($scope.selectedItem) {
                                $scope.selectedItem.name = $scope.name;
                                $scope.selectedItem.tracks = angular.copy(vm.tracks);
                                $scope.selectedItem.logMessages = angular.copy(vm.logMessages);
                                vm.selectedSetup = $scope.selectedItem;
                            } else {
                                var setup = {
                                    name: $scope.name,
                                    dateTime: new Date().getTime(),
                                    tracks: angular.copy(vm.tracks),
                                    logMessages: angular.copy(vm.logMessages)
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

                        $scope.clone = function(item) {
                            console.log('clone', item);
                            resetCurrentSetup();
                            angular.merge(vm.tracks, item.tracks);
                            angular.forEach(vm.tracks, function(track) {
                                track.series = [];
                            });
                            vm.selectedSetup = undefined;
                            $mdDialog.hide();
                        };

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
