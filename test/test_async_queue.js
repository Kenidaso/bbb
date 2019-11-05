const async = require('async');

//Code for processing the task
var processQueue = function (message, callback) {
    setTimeout(function() {
        console.log(`Task ${message} completed`);
        callback();
    }, 500);
}

//Queue initialization. This queue process 3 tasks at a time
var queue = async.queue(processQueue, 3);

//After all tasks completion queue process this function
queue.drain = function() {
    console.log('Yuppie all tasks completed');
}

//To add tasks to queue we are using this function.
var processTasks = function () {
    for (let index = 1; index <= 10; index++) {
        queue.push(index);
    }
}

processTasks();