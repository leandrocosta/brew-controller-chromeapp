(function() {
    angular.module('App', ['ngMaterial', 'ngMdIcons', 'chromeStorage', 'ui.utils.masks', 'n3-line-chart'], function($provide) {
            // Prevent Angular from sniffing for the history API
            // since it's not supported in packaged apps.
            $provide.decorator('$window', function($delegate) {
                $delegate.history = null;
                return $delegate;
            });
        })
        .config(function($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue-grey') /*.primaryPalette('indigo')*/
                .accentPalette('blue-grey')
                .warnPalette('red')
                .backgroundPalette('grey');
        })
        .filter('secondsToDateTime', function() {
            return function(seconds) {
                var d = new Date(0, 0, 0, 0, 0, 0, 0);
                d.setSeconds(seconds);
                return d;
            };
        })
        .service('appConfig', function() {
            return {
                demoMode: false,
                mock: {
                    0: {
                        input: 0
                    },
                    1: {
                        input: 0
                    },
                    2: {
                        input: 0
                    }
                }
            };
        });
})();
