(function() {
    angular
        .module('App')
        .service('toastQueue', toastQueue);

    function toastQueue($interval, $mdToast, alarmService) {
        var _toasts = [];
        var _taskRunning = false;

        this.add = function(toast) {
            if (!_taskRunning) {
                _taskRunning = true;
                runTask(toast);
            } else {
                _toasts.push(toast);
            }
        };

        function runTask(toast) {
            showToast(toast).finally(function() {
                if (_toasts.length) {
                    runTask(_toasts.shift());
                } else {
                    _taskRunning = false;
                }
            });
        }

        function showToast(toast) {
            alarmService.play();

            return $mdToast.show(toast).finally(function() {
                alarmService.stop();
            });
        }
    }
})();
