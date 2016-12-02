(function() {
    angular
        .module('App')
        .service('generalConfigService', generalConfigService);

    function generalConfigService($mdDialog, chromeStorage) {
        var config;

        chromeStorage.getOrElse('config', function() {
            return $q(function(resolve, reject) {
                resolve({ bitrate: 9600 });
            });
        }).then(function(c) {
            config = c;

            chrome.serial.getDevices(function(ports) {
                console.log('usb ports', ports);
                if (ports && ports.length) {
                    config.usbPort = ports[0].path;
                }
            });
        });

        this.getConfig = function() {
            return config;
        };

        this.showDialog = function(ev) {
            $mdDialog.show({
                templateUrl: 'app/general-config-dialog.tpl.html',
                controller: function($scope, $mdDialog) {
                    $scope.config = angular.copy(config);

                    $scope.save = function() {
                        config = angular.copy($scope.config);
                        chromeStorage.set('config', config);
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
                            $scope.config.usbPort = $scope.ports[0].path;
                            config = angular.copy($scope.config);
                        });
                    }

                    getDevices();
                },
                onComplete: function() {
                    angular.element(document.body).find('md-dialog').find('input')[0].focus();
                },
                targetEvent: ev,
                clickOutsideToClose: true
            });
        };
    }
})();
