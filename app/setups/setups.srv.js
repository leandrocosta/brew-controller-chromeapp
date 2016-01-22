(function() {
    angular
        .module('App')
        .service('setupsService', SetupsService);

    function SetupsService($rootScope, chromeStorage) {
        this.setups = [];

        chromeStorage.getOrElse('setups', function() {
            return $q(function(resolve, reject) {
                resolve([]);
            });
        }).then(function(value) {
            console.log('setups', value);
            this.setups = value;
        });

        $rootScope.$watch(function() {
            return this.setups;
        }, function(newValue, oldValue) {
            if (angular.isDefined(newValue)) {
                console.log('setupsService - update setups', vm.setups);
                chromeStorage.set('setups', vm.setups);
            }
        }, true);
    }
})();
