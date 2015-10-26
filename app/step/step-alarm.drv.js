(function() {
    'use strict';

    angular.module('App')
        .directive('stepAlarm', function($log) {
            return {
                scope: {
                    alarmedAlarms: '='
                },
                require: '^^myTrack',
                link: function(scope, elem, attrs, trackVm) {
                    scope.$watch('alarmedAlarms', function(newValue, oldValue) {
                        //$log.debug('stepAlarm.link() - $watch(alarmedAlarms) - newValue, oldValue: ', newValue, oldValue);
                        if (newValue) {
                            if (newValue[newValue.length - 1] === scope.$parent.$chip) {
                                elem.parent().parent().addClass('alarmed');
                                //$log.debug('alarm - scope: ', scope);
                                trackVm.alarm(scope.$parent.$chip);
                            }
                        } else {
                            elem.parent().parent().removeClass('alarmed');
                        }
                    }, true);
                }
            };
        });
})();
