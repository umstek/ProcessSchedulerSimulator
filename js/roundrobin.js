var roundRobin = function (quantum, switchTime) {
    'use strict';

    // set the time quantum and the time required for context switching
    this.quantum = quantum;
    this.switchTime = switchTime;

    // run a process if available instead of dispatcher at the beginning
    // it's zero = 0 when the dispatcher takes no time to switch
    this.switchAt = this.switchTime > 0 ? (quantum + 1) % (quantum + switchTime) : 0;
    this.time = 0;
    this.processEnded = false;

    this.tick = function () {  // happens in a single unit of time
        this.time += 1;  // increase time

        // there should be some processes to run, otherwise return the same this.queue given
        if (this.queue.length < 1) {
            // if idle, dispatcher has enough time - it should start the next process as soon as it arrives
            this.switchAt = (this.time) % (this.quantum + this.switchTime);
            this.currently = 'idle';
            return;
        }

        if (this.switchTime > 0) {  // dispatcher takes time to switch
            if (this.time % (this.quantum + this.switchTime) == this.switchAt) {  // switching needed
                if (this.processEnded) {  // we only have to remove one ended process
                    this.endedQueue.push(this.queue.shift());  // remove ended process
                    this.currently = 'waste';
                    this.processEnded = false;  // clear the flag
                } else {  // perform task switching
                    this.currently = 'waste';
                    this.queue.push(this.queue.shift());
                }
            } else if (this.processEnded) {  // process ended in the previous round
                this.endedQueue.push(this.queue.shift());  // remove ended process
                this.processEnded = false;  // clear the flag
                this.currently = 'waste';
                // restart switch timer - we're actually using the last unit of switch time for switching
                this.switchAt = this.time % (this.quantum + this.switchTime);
            } else if ((this.time - this.switchAt + this.quantum + this.switchTime)
                % (this.quantum + this.switchTime) < this.switchTime) {
                this.currently = 'waste';
                // we don't have to do anything
            } else {  // normally run the process - this is not a switching time
                if (this.queue[0].time == 0) {  // process is running for the first time
                    this.queue[0].service = this.time - 1;  // set the actual start time of the process (add -1)
                    this.queue[0].wait = this.queue[0].service - this.queue[0].arrival;  // set the wait
                }

                this.queue[0].time += 1;  // run the process
                this.currently = "" + this.queue[0].id;  // running state

                if (this.queue[0].time == this.queue[0].execution) {  // process has just ended
                    this.queue[0].end = this.time;  // set the time when the process has ended
                    this.processEnded = true;  // mark process for removal
                }
            }
        } else {  // dispatcher does not take time to switch
            if (this.queue[0].time == 0) {
                this.queue[0].service = this.time - 1;
                this.queue[0].wait = this.queue[0].service - this.queue[0].arrival;
            }

            this.queue[0].time += 1;
            this.currently = "" + this.queue[0].id;  // running state

            if (this.queue[0].time == this.queue[0].execution) {  // process has finished execution
                this.queue[0].end = this.time;
                this.endedQueue.push(this.queue.shift());  // do the process removal now
                this.switchAt = this.time % this.quantum;  // restart switch timer n.b.: this.switchTime = 0
            } else if (this.time % this.quantum == this.switchAt) {  // switchTime needed
                this.queue.push(this.queue.shift());  // perform task switchTime
            }
        }

    };
};

// static variables of the function
roundRobin.processFlagsIn = [
    {
        flag: 'name',  // attribute of the object to track
        name: 'Name',  // actual text to be displayed in the tables
        description: 'Name of the process',  // bootstrap's placeholders
        initial: "'process_' + Math.floor(Math.random()  * 1000)"  // will be called with eval()
    },
    {
        flag: 'arrival',
        name: 'Arrival',
        description: 'When the process is started by the user',
        initial: "0"
    },
    {
        flag: 'execution',
        name: "Length",
        description: 'Length of the process',
        initial: "10"
    }
];  // these flags tell what will be the inputs
roundRobin.processInternal = [{flag: 'id'}];  // these flags tell what extra details to store in the tape
roundRobin.processFlagsOut = [
    {flag: 'time', name: 'Position'},
    {flag: 'service', name: 'Service time'},
    {flag: 'wait', name: 'Waiting time'},
    {flag: 'end', name: 'Ending time'}
];  // these flags tell what to be captured as the result

roundRobin.algorithmFlagsIn = [
    {
        flag: 'quantum',
        name: 'Quantum',
        description: 'Time quantum',
        initial: "5"
    },
    {
        flag: 'switchTime',
        name: 'Switch Time',
        description: 'Time taken for context switching',
        initial: "1"
    }
];
roundRobin.algorithmInternal = [{flag: 'switchAt'}, {flag: 'processEnded'}, {flag: 'currently'}];
roundRobin.algorithmFlagsOut = [{flag: 'time', name: 'Time'}];
