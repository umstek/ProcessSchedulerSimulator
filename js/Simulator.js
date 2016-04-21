var extractState = function (obj, keys) {
    'use strict';
    // used to create state representations of processes and algorithm for each clock pulse
    var state = {};
    for (var i = 0; i < keys.length; i++) {
        var arg = keys[i];
        state[arg] = obj[arg];
    }
    return state;
};

var restoreState = function (state, obj, keys) {
    // used to restore old states in case if travelling back in time is needed
    for (var i = 0; i < keys.length; i++) {
        var arg = keys[i];
        obj[arg] = state[arg];
    }
};

var sortByKey = function (objArray, key) {
    // sorts objects using the given key
    objArray.sort(function (o1, o2) {
        return o1[key] - o2[key];
    });
};


var Simulator = function (scheduler, delay, initialProcesses) {
    this.delay = delay;  // the delay between clock pulses in milliseconds - must be managed externally
    this.scheduler = scheduler;  // configured scheduler to be used with the simulator
    this.tape = [];  // stack to store the time-line of process execution
    this.initialProcesses = initialProcesses;  // add processes here to be automatically started at the arrival time
    sortByKey(this.initialProcesses, 'arrival');  // in-place sort

    this.maxid = 0;  // find the maximum id
    this.initialProcesses.forEach(function (element) {
        this.maxid = Math.max(this.maxid, (typeof element.id == 'undefined' || element.id === null) ? 0 : element.id);
    }, this);
    // those who have no ids will be given ids
    for (var q = 0; q < this.initialProcesses.length; q++) {
        var element = this.initialProcesses[q];
        if (typeof element.id == 'undefined' || element.id === null) {
            element.id = ++this.maxid;  // pre increment
        }
    }

    this.tick = function () {  // single step forward
        while (this.initialProcesses.length > 0 && this.initialProcesses[0].arrival == this.scheduler.time) {
            this.scheduler.queue.push(this.initialProcesses.shift());  // move from initial to ready queue
        }  // we have to all processes arrived now
        this.saveState();  // when saving, save processes that are added now
        // console.log(this.tape);  // TODO remove
        this.scheduler.tick();  // clock pulse
    };

    this.back = function () {  // single step backward
        this.loadState();  // travel back in time
    };

    this.createProcess = function (process) {  // add a process while running the simulation
        process.arrival = this.scheduler.time;  // arrival time is set to now when adding processes in runtime
        if (typeof process.id == 'undefined' || process.id === null) {
            process.id = ++this.maxid;
        }
        this.initialProcesses.push(process);  // add to the end of the initial processes queue
        sortByKey(this.initialProcesses, 'arrival');  // sort - there can be pre-added processes arriving after this
    };

    this.killProcess = function (process) {  // kill a process which is currently in the ready queue
        this.scheduler.queue.splice(this.scheduler.queue.indexOf(process), 1);
    };

    this.algorithmArgs = [].concat(  // setup algorithm args for saving state
        this.scheduler.algorithm.algorithmFlagsIn,
        this.scheduler.algorithm.algorithmInternal,
        this.scheduler.algorithm.algorithmFlagsOut
    );

    this.processArgs = [].concat(  // setup process args for saving state
        this.scheduler.algorithm.processFlagsIn,
        this.scheduler.algorithm.processInternal,
        this.scheduler.algorithm.processFlagsOut
    );

    this.saveState = function () {  // saves current state into the tape
        var algorithmState = extractState(
            this.scheduler,
            this.algorithmArgs.map(function (flagBox) {
                return flagBox.flag;  // 1 only give the .flag of the flags - see also 2, 3, 4
            })
        );
        var processStates = [];
        for (var i = 0; i < this.scheduler.queue.length; i++) {
            var process = this.scheduler.queue[i];
            var processState = extractState(
                process,
                this.processArgs.map(function (flagBox) {
                    return flagBox.flag;  // 2
                })
            );
            processStates.push(processState);
        }

        var state = {
            algorithm: algorithmState,
            processes: processStates
        };
        this.tape.push(state);
    };  // end saveState

    this.loadState = function () {  // retrieves the previous state from the tape
        if (this.tape.length === 0) {
            return;
        }
        var state = this.tape.pop();

        restoreState(
            state.algorithm,
            this.scheduler,
            this.algorithmArgs.map(function (flagBox) {
                return flagBox.flag;  // 3
            })
        );

        var processStates = state.processes;
        // this.scheduler.queue.length = 0;
        this.scheduler.queue = [];  // (new) empty queue as the scheduler ready queue
        for (var i = 0; i < processStates.length; i++) {
            var processState = processStates[i];
            var process = {};
            restoreState(
                processState,
                process,
                this.processArgs.map(function (flagBox) {
                    return flagBox.flag;  // 4
                })
            );
            this.scheduler.queue.push(process);

            // cross-check with id whether the process has ended and added into the endedQueue
            // if so, remove it from the endedQueue - a process cannot be ended and ready at the same time
            for (var r = 0; r < this.scheduler.endedQueue.length; r++) {
                var element = this.scheduler.endedQueue[r];
                if (element.id == process.id) {
                    this.scheduler.endedQueue.splice(this.scheduler.endedQueue.indexOf(element), 1);
                }
            }
        }
    };  // end loadState

    this.getFutureQueue = function () {
        return this.initialProcesses;
    };

    this.getQueue = function () {
        return this.scheduler.queue;
    };

    this.getEndedQueue = function () {
        return this.scheduler.endedQueue;
    };

    this.getAllProcesses = function () {
        var allProcesses = [].concat(
            this.getEndedQueue(),
            this.getQueue(),
            this.getFutureQueue()
        );

        var processStates = [];
        for (var i = 0; i < allProcesses.length; i++) {
            var process = allProcesses[i];
            var processState = extractState(
                process,
                this.processArgs.map(function (flagBox) {
                    return flagBox.flag;  // 2
                })
            );
            processStates.push(processState);
        }

        sortByKey(processStates, 'id');

        return processStates;
    };
    // TODO add a killed list

};  // end Simulator
