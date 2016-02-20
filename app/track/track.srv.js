(function() {
    'use strict';

    angular.module('App')
        .service('trackService', function($interval, $timeout, $q, appConfig, arduinoService, timerService) {
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
                var step = null;
                if (track.steps.length) {
                    step = track.steps[0];
                    if (track.running) {
                        step = track.steps[track.current_step_idx];
                    }
                }
                arduinoService.set(track, step).then(function(response) {
                    console.log('set - success: ', response);
                });
            };

            this.play = function(track) {
                return this.playStep(track, 0).then(function() {
                    track.running = true;
                    track.pause = false;
                    track.series.push({
                        dateTime: new Date().getTime(),
                        data: []
                    });
                });
            };

            this.playStep = function(track, stepIdx) {
                var step = track.steps[stepIdx];

                delete step.run;
                track.current_step_idx = stepIdx;

                if (step.temperature) {
                    return arduinoService.set(track, step).then(function(response) {
                        console.log('set - success', response);
                        arduinoService.play(track).then(function(response) {
                            console.log('play - success', response);
                            return arduinoService.getTemperature(track).then(function(response) {
                                console.log('get init temp - success', response.value);
                                step.run = {
                                    "init_temp": response.value,
                                    "curr_temp": null,
                                    "curr_time": null,
                                    "timer": null,
                                    "alarmed": []
                                };
                                step.running = true;
                                step.paused = false;
                            });
                        });
                    });
                } else {
                    // boiling step, Arduino's SSR not used, just start step
                    return arduinoService.getTemperature(track).then(function(response) {
                        console.log('get temp - success', response);
                        step.run = {
                            "init_temp": response.value,
                            "curr_temp": null,
                            "curr_time": null,
                            "timer": null,
                            "alarmed": []
                        };
                        step.running = true;
                        step.paused = false;
                    });
                }
            };

            this.stop = function(track) {
                /*arduinoService.stop(track).then(function(response) {
                    track.running = false;
                    track.steps[track.current_step_idx].running = false;
                    track.steps.forEach(function(step) {
                        delete step.run;
                    });
                });*/
                /*var step = track.steps[track.current_step_idx];
                if (step.temperature) {
                    return arduinoService.stop(track).then(function(response) {
                        track.running = false;
                        step.running = false;
                        track.steps.forEach(function(step) {
                            delete step.run;
                        });
                    });
                } else {
                    track.running = false;
                    step.running = false;
                    track.steps.forEach(function(step) {
                        delete step.run;
                    });
                    var deferred = $q.defer();
                    deferred.resolve(true);
                    return deferred.promise;
                }*/
                return this.stopCurrentStep(track).then(function(response) {
                    track.running = false;
                    track.steps.forEach(function(step) {
                        delete step.run;
                    });
                });
            };

            this.stopCurrentStep = function(track) {
                var step = track.steps[track.current_step_idx];
                if (step.temperature) {
                    return arduinoService.stop(track).then(function(response) {
                        step.running = false;
                    });
                } else {
                    step.running = false;
                    var deferred = $q.defer();
                    deferred.resolve(true);
                    return deferred.promise;
                }
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
                arduinoService.play(track, track.steps[track.current_step_idx]).then(function(response) {
                    console.log('arduinoService response: ' + response);
                    track.paused = false;
                    track.steps[track.current_step_idx].paused = false;

                    if (track.steps[track.current_step_idx].run.timer) {
                        track.steps[track.current_step_idx].run.timer.unpause();
                    }
                });
            };

            this.forwardStep = function(track, stepIdx) {
                this.stopCurrentStep(track);
                this.playStep(track, stepIdx);
            };

            this.finish = function(track) {
                this.stopCurrentStep(track);
            };

            this.startTimer = function(track, stepIdx) {
                console.log('startTimer');
                var step = track.steps[track.current_step_idx];

                if (!step.run.timer) {
                    step.run.timer = timerService.new();
                    step.run.timer.start();
                }
            };

            /*this.recursivelyGetTemperature = function(track) {
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
            }*/

            this.handleCurrTemp = function(track, step) {
                if (angular.isDefined(step.temperature) && step.temperature !== null && !step.run.timer && step.run.curr_temp >= step.temperature) {
                    // start counting, play alarms
                    step.run.timer = timerService.new();
                    step.run.timer.start();
                }

                if (!step.paused && step.run.timer) {
                    var time = step.time;
                    if (!appConfig.demoMode) {
                        time *= 60;
                    }

                    step.run.curr_time = step.run.timer.time() / 1000;
                    if (!step.temperature) {
                        step.run.curr_time = time - step.run.curr_time;
                    }

                    var next_alarm_idx = step.run.alarmed.length;
                    var alarm = (step.alarms.length > next_alarm_idx ? step.alarms[next_alarm_idx] : undefined);
                    if (alarm !== undefined && !appConfig.demoMode) {
                        alarm *= 60;
                    }

                    if (step.temperature) {
                        // TODO: alarms have time in minutes
                        if (alarm !== undefined && step.run.curr_time >= alarm) {
                            /* push the original value in minutes, not the value in seconds */
                            step.run.alarmed.push(step.alarms[next_alarm_idx]);
                        }

                        if (time && step.run.curr_time >= time) {
                            if (track.current_step_idx + 1 < track.steps.length) {
                                that.forwardStep(track, track.current_step_idx + 1);
                            } else {
                                that.finish(track);
                            }
                        }
                    } else { // boiling step
                        if (alarm !== undefined && step.run.curr_time <= alarm) {
                            /* push the original value in minutes, not the value in seconds */
                            step.run.alarmed.push(step.alarms[next_alarm_idx]);
                        }

                        if (time && step.run.curr_time <= 0) {
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
                    $timeout(function() {
                        track.status.pinSSR = obj.pSSR;
                        track.status.pinDS18B20 = obj.pDS18B20;
                        track.status.kp = obj.kp;
                        track.status.ki = obj.ki;
                        track.status.kd = obj.kd;
                        track.status.input = obj.i;
                        track.status.output = obj.o;
                        track.status.setpoint = obj.sp;
                        track.status.sampleTime = obj.st;
                        track.status.windowSize = obj.ws;
                        track.status.running = obj.r;
                        track.status.outputSSR = obj.oSSR;

                        // bug: sometimes DS18B20 returns -127 as temperature, we don't want to see these values in graph
                        if (track.status.input < 0) {
                            track.status.input = undefined;
                        }

                        if (track.running) {
                            var sample = angular.extend({
                                x: new Date()
                            }, angular.copy(track.status));
                            sample._xDateTime = sample.x.getTime();

                            var data = track.series[track.series.length - 1].data;

                            if (data.length >= 2) {
                                var lastSample = data[data.length - 1];
                                var secondToLastSample = data[data.length - 2];

                                if (sample.input === lastSample.input && sample.input === secondToLastSample.input &&
                                    sample.outputSSR === lastSample.outputSSR && sample.outputSSR === secondToLastSample.outputSSR) {
                                    data[data.length - 1] = sample;
                                } else {
                                    data.push(sample);
                                }
                            } else {
                                data.push(sample);
                            }
                            //data.push(sample);
                        }

                        if (track.running) {
                            var step = track.steps[track.current_step_idx];
                            if (step.running) {
                                step.run.curr_temp = track.status.input;
                                that.handleCurrTemp(track, step);
                            }
                        }
                    });
                });
            };
        });
})();
