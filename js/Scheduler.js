var Scheduler = function (algorithm) {
    'use strict';
    this.algorithm = algorithm;  // call algorithm(args) with its arguments to configure it
    this.queue = [];  // there must be a queue
    this.endedQueue = [];  // stores the finished processes
    this.tick = null;  // there must be a tick function to increase the clock
    this.currently = 'idle';
};
