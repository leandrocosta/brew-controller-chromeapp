(function() {
    angular
        .module('App')
        .factory('dataService', dataService);

    dataService.$inject = ['$http'];

    function dataService($http) {
        return {
            getData: getData
        };

        function getData() {
            return $http.get('app/data.json')
                .then(getDataComplete)
                .catch(getDataFailed);

            function getDataComplete(response) {
                return response;
            }

            function getDataFailed(error) {
                console.log('XHR Failed for getData.' + error.data);
            }
        }
    }
})();
