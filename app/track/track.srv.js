(function() {
    'use strict';

    angular.module('App')
        .service('trackService', function($interval, $timeout, arduinoService, timerService) {
            var that = this;

            this.addStep = function(track, index) {
                track.steps.splice(index, 0, {
                    temperature: undefined,
                    time: undefined,
                    alarms: []
                });
            };

            this.delStep = function(track, index) {
                track.steps.splice(index, 1);
            };

            this.saveConfig = function(track) {
                console.log('saving config');
                arduinoService.set(track, track.steps[0]).then(function(response) {
                    console.log('set - success: ' + response);
                });
            };

            this.play = function(track) {
                arduinoService.set(track, track.steps[0]).then(function(response) {
                    console.log('set - success: ' + response);
                    arduinoService.play(track).then(function(response) {
                        console.log('play - success: ' + response);
                        track.running = true;
                        track.paused = false;
                        that.playStep(track, 0).then(function() {
                            that.recursivelyGetTemperature(track);
                        });
                        track.series = [];
                    });
                });
            };

            this.stop = function(track) {
                stopLoop(track);
                arduinoService.stop(track).then(function(response) {
                    track.running = false;
                    track.steps[track.current_step_idx].running = false;
                    track.steps.forEach(function(step) {
                        delete step.run;
                    });
                });
            };

            this.pause = function(track) {
                arduinoService.stop(track).then(function(response) {
                    track.paused = true;
                    track.steps[track.current_step_idx].paused = true;

                    if (track.steps[track.current_step_idx].run.timer) {
                        track.steps[track.current_step_idx].run.timer.pause();
                    }
                });
            };

            this.unpause = function(track) {
                arduinoService.play(track, track.current_step).then(function(response) {
                    console.log('arduinoService response: ' + response);
                    track.paused = false;
                    track.steps[track.current_step_idx].paused = false;

                    if (track.steps[track.current_step_idx].run.timer) {
                        track.steps[track.current_step_idx].run.timer.unpause();
                    }
                });
            };

            this.playStep = function(track, stepIdx) {
                track.current_step_idx = stepIdx;
                //track.current_step = angular.copy(track.steps[stepIdx]);
                track.steps[track.current_step_idx].running = true;
                track.steps[track.current_step_idx].paused = false;
                track.steps[track.current_step_idx].run = {
                    "init_temp": null,
                    "curr_temp": null,
                    "curr_time": null,
                    "timer": null,
                    "alarmed": []
                };
                //track.steps[track.current_step_idx].run.init_temp = track.steps[track.current_step_idx].run.curr_temp = arduinoService.getTemperature(track);
                return arduinoService.getTemperature(track).then(function(response) {
                    track.steps[track.current_step_idx].run.init_temp = track.steps[track.current_step_idx].run.curr_temp = response.value;
                    console.log(response);
                });
            };

            this.stopStep = function(step) {
                step.running = false;
            };

            this.forwardStep = function(track, stepIdx) {
                this.stopStep(track.current_step);
                this.playStep(track, stepIdx);
            };

            this.finish = function(track) {
                this.stopStep(track.current_step);
                stopLoop(track);
            };

            this.startBoil = function(track, stepIdx) {
                console.log('startBoil');
                var step = track.current_step;

                if (!step.run.timer) {
                    step.run.timer = timerService.new();
                    step.run.timer.start();
                }
            };

            this.recursivelyGetTemperature = function(track) {
                /*track.loop = $interval(function() {
                    var step = track.current_step;
                    step.run.curr_temp = arduinoService.getTemperature(track);
                    this.handleCurrTemp(track);

                }, 1000);*/
                var step = track.steps[track.current_step_idx];
                arduinoService.getTemperature(track).then(function(response) {
                    if (step.run) {
                        step.run.curr_temp = response.value;
                        that.handleCurrTemp(track, step);

                        if (track.steps[track.current_step_idx].running) {
                            that.recursivelyGetTemperature(track);
                        }
                    }
                });
            }

            this.handleCurrTemp = function(track, step) {
                if (!step.run.timer && step.run.curr_temp >= step.temperature) {
                    // start counting, play alarms
                    step.run.timer = timerService.new();
                    step.run.timer.start();
                }

                if (!step.paused && step.run.timer) {
                    step.run.curr_time = step.run.timer.time() / 1000;
                    if (!step.temperature) {
                        step.run.curr_time = step.time - step.run.curr_time;
                    }
                    var next_alarm_idx = step.run.alarmed.length;

                    if (step.temperature) {
                        if (step.alarms.length > next_alarm_idx &&
                            step.run.curr_time >= step.alarms[next_alarm_idx]) {
                            /*angular.element('audio').play();*/
                            /*alarmService.play();*/
                            step.run.alarmed.push(step.alarms[next_alarm_idx]);
                        }

                        if (step.time && step.run.curr_time >= step.time) {
                            if (track.current_step_idx + 1 < track.steps.length) {
                                that.forwardStep(track, track.current_step_idx + 1);
                            } else {
                                that.finish(track);
                            }
                        }
                    } else { // boiling step
                        if (step.alarms.length > next_alarm_idx &&
                            step.run.curr_time <= step.alarms[next_alarm_idx]) {
                            /*angular.element('audio').play();*/
                            step.run.alarmed.push(step.alarms[next_alarm_idx]);
                        }

                        if (step.time && step.run.curr_time <= 0) {
                            if (track.current_step_idx + 1 < track.steps.length) {
                                that.forwardStep(track, track.current_step_idx + 1);
                            } else {
                                that.finish(track);
                            }
                        }

                    }
                }
            };

            this.registerListener = function(track) {
                arduinoService.registerListener(track.id, function(obj) {
                    //console.log('track status', obj);
                    $timeout(function() {
                        track.status.pinSSR = obj.pinSSR;
                        track.status.pinDS18B20 = obj.pinDS18B20;
                        track.status.kp = obj.kp;
                        track.status.ki = obj.ki;
                        track.status.kd = obj.kd;
                        track.status.input = obj.input;
                        track.status.output = obj.output;
                        track.status.setpoint = obj.setpoint;
                        track.status.windowSize = obj.windowSize;
                        track.status.running = obj.running;
                        track.status.outputSSR = obj.outputSSR;
                        track.series.push(angular.extend({
                            x: new Date()
                        }, angular.copy(track.status)));
                    });
                });
            };

            function stopLoop(track) {
                //console.log('stop_loop');
                if (angular.isDefined(track.loop)) {
                    $interval.cancel(track.loop);
                    track.loop = undefined;
                }
            }
        });
})();
