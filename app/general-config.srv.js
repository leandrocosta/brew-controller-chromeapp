(function() {
    angular
        .module('App')
        .service('generalConfigService', generalConfigService);

    generalConfigService.$inject = ['$mdDialog', 'arduinoService'];

    function generalConfigService($mdDialog, arduinoService) {
        this.showDialog = function(ev) {
            $mdDialog.show({
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
                onComplete: function() {
                    angular.element(document.body).find('md-dialog').find('input')[0].focus();
                },
                targetEvent: ev,
                clickOutsideToClose: true
            });
        };
    }
})();
