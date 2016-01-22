(function() {
    angular
        .module('App')
        .service('chartService', ChartService);

    ChartService.$inject = ['$mdDialog'];

    function ChartService($mdDialog) {
        this.showDialog = function(ev, track) {
            $mdDialog.show({
                templateUrl: 'app/chart-dialog.tpl.html',
                controller: function($scope, $mdDialog) {
                    $scope.series = track.series;
                    $scope.selectedSeries = $scope.series[$scope.series.length - 1];
                    $scope.data = $scope.selectedSeries ? $scope.selectedSeries.data : undefined;

                    $scope.options = {
                        axes: {
                            x: {
                                type: 'date',
                                /*zoomable: true,*/
                            },
                            y: {},
                            y2: {
                                ticks: 1,
                                min: 0,
                                max: 1,
                            }
                        },
                        series: [{
                            y: 'input',
                            axis: 'y',
                            type: 'area',
                            label: 'Temperature',
                            color: '#d62728', //'#8c564b'
                            /*lineMode: 'monotone',*/
                        }, {
                            y: 'outputSSR',
                            type: 'area', //'column',
                            axis: 'y2',
                            label: 'SSR Output',
                            color: '#ff7f0e', //'#ffaa00'
                            /*lineMode: 'basis-open',*/
                        }],
                        /*lineMode: 'monotone',*/
                        drawDots: false,
                    };

                    $scope.deleteSeries = function(selectedSeries) {
                        var idx = $scope.series.indexOf(selectedSeries);
                        $scope.series.splice(idx, 1);
                        if (!$scope.series.length) {
                            $scope.selectedSeries = undefined;
                            $scope.data = undefined;
                        } else {
                            if (idx >= $scope.series.length) {
                                idx--;
                            }
                            $scope.selectedSeries = $scope.series[idx];
                            $scope.data = $scope.selectedSeries.data;
                        }
                    };

                    $scope.close = function() {
                        $mdDialog.hide();
                    };

                    $scope.Math = window.Math;
                },
                targetEvent: ev,
                clickOutsideToClose: true
            });
        };
    }
})();
