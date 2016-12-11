(function() {
    angular
        .module('App')
        .service('gistService', GistService);

    function GistService($http, $mdDialog, $base64, generalConfigService) {
        this.gist = function(ev, setup) {
            $mdDialog.show({
                templateUrl: 'app/gist/gist-dialog.tpl.html',
                controller: function($scope, $mdDialog) {
                    $http.get('app/gist/index.tpl.html').then(function(response) {
                        var indexHtmlContent = response.data;
                        var config = generalConfigService.getConfig();
                        var auth = $base64.encode(config.githubUsername + ':' + config.githubPassword);
                        $http.defaults.headers.common['Authorization'] = 'Basic ' + auth;

                        var gist = {
                            description: setup.name + '(' + new Date(setup.dateTime).toISOString().substring(0, 10) + ')',
                            public: true,
                            files: {
                                'index.html': {
                                    content: indexHtmlContent
                                }, 'data.json': {
                                    content: angular.toJson(setup)
                                }
                            }
                        };

                        $scope.promise = $http.post('https://api.github.com/gists', gist, {'Content-Type':'application/json'});
                        $scope.promise.then(function(response) {
                            $scope.data = response.data;
                        });
                    });

                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                },
                targetEvent: ev,
                clickOutsideToClose: true
            });
        };
    }
})();
