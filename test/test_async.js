const async = require('async');
const util = require('util');
const moment = require('moment');

/*async.auto({
    get_data: function (callback) {
        console.log('in get_data');

        // async code to get some data

        setTimeout(callback, 1e3, null, 'data', 'converted to array');
    },
    make_folder: function(callback) {
        console.log('in make_folder');
        // async code to create a directory to store a file in
        // this is run at the same time as getting the data
        setTimeout(callback, 1e3, null, 'folder');
        // callback(null, 'folder');
    },
    write_file: ['get_data', 'make_folder', function(results, callback) {
        console.log('in write_file', JSON.stringify(results));
        // once there is some data and the directory exists,
        // write the data to a file in the directory
        setTimeout(callback, 1e3, null, 'filename');
        // callback(null, 'filename');
    }],
    email_link: ['write_file', function(results, callback) {
        console.log('in email_link', JSON.stringify(results));
        // once the file is written let's email a link to it...
        // results.write_file contains the filename returned by write_file.
        setTimeout(callback, 1e3, null, {'file':results.write_file, 'email':'user@example.com'});
        // callback(null, {'file':results.write_file, 'email':'user@example.com'});
    }]
}, function(err, results) {
    console.log('err = ', err);
    console.log('results = ', results);
});*/

/*async.autoInject({
    get_data: function(callback) {
        console.log('in get_data');
        // async code to get some data
        setTimeout(callback, 1e3, null, 'data', 'converted to array');
        // callback(null, 'data', 'converted to array');
    },
    make_folder: function(callback) {
        console.log('in make_folder');
        // async code to create a directory to store a file in
        // this is run at the same time as getting the data
        callback(null, 'folder');
    },
    write_file: function(get_data, make_folder, callback) {
        console.log('in write_file', 'get_data=', get_data, 'make_folder=', make_folder);
        // once there is some data and the directory exists,
        // write the data to a file in the directory
        // callback(null, 'filename');
        setTimeout(callback, 1e3, null, 'folder');
    },
    email_link: function(write_file, callback) {
        console.log('in email_link', 'write_file=', write_file);
        // once the file is written let's email a link to it...
        // write_file contains the filename returned by write_file.
        // callback(null, {'file':write_file, 'email':'user@example.com'});
        setTimeout(callback, 1e3, null, {'file': write_file, 'email':'user@example.com'});
    }
}, function(err, results) {
    console.log('err = ', err);
    console.log('results = ', results);

    console.log('email_link = ', results.email_link);
});*/

/*// create a cargo object with payload 2
var cargo = async.cargo(function(tasks, callback) {
    for (var i=0; i<tasks.length; i++) {
        console.log('hello ' + tasks[i].name);
    }
    callback();
}, 2);

(async () => {

    // add some items
    cargo.push({name: 'foo'}, function(err) {
        console.log('finished processing foo');
    });

    cargo.push({name: 'bar'}, function(err) {
        console.log('finished processing bar');
    });

    // cargo.push({name: 'baz'}, function(err) {
    //     console.log('finished processing baz');
    // });

    await cargo.push({name: 'baz'});

    console.log('finished processing baz');


    // finished processing baz
    // hello foo
    // hello bar
    // finished processing foo
    // finished processing bar
    // hello baz

})()*/

/*// create a cargoQueue object with payload 2 and concurrency 2
var cargoQueue = async.cargoQueue(function(tasks, callback) {
    for (var i=0; i<tasks.length; i++) {
        console.log('hello ' + tasks[i].name);
    }
    callback();
}, 2, 2);

// add some items
cargoQueue.push({name: 'foo'}, function(err) {
    console.log('finished processing foo');
});
cargoQueue.push({name: 'bar'}, function(err) {
    console.log('finished processing bar');
});
cargoQueue.push({name: 'baz'}, function(err) {
    console.log('finished processing baz');
});
cargoQueue.push({name: 'boo'}, function(err) {
    console.log('finished processing boo');
});*/

/*async.concat(['dir1','dir2','dir3'], (name, cb) => {
    console.log('process:', name);

    setTimeout(cb, name === 'dir2' ? 2e3: 1e3, name === 'dir2' ? 'EXXX' : null, `${name}_123`);
}, function(err, files) {
    // files is now a list of filenames that exist in the 3 directories
    console.log('err=', err);
    console.log('files=', files);
});*/

/*async.every(['dir1','dir2','dir3'], function(name, cb) {
    console.log('process:', name);
    setTimeout(cb, name === 'dir2' ? 2e3: 1e3, name === 'dir22' ? 'EXXX' : null, `${name}_123`);
}, function(err, result) {
    // if result is true then every file exists
    console.log('err=', err);
    console.log('result=', result);
});*/

// async.reduce([1, 2, 3], 6, function(memo, item, callback) {
//     // pointless async:
//     process.nextTick(function() {
//         callback('EEE', memo + item)
//     });
// }, function(err, result) {
//     // result is now equal to the last value of memo, which is 6
//     console.log('err=', err);
//     console.log('result=', result);
// });

/*let asyncReduce = util.promisify(async.reduce);

(async () => {
    let result = null;
    try {
        result = await async.reduce([1, 2, 3], 6, function (memo, item, callback) {
            // pointless async:
            process.nextTick(function() {
                callback(null, memo + item)
            });
        })

        console.log('result=', result);
    } catch (ex) {
        console.log('ex=', ex);
    }
})()*/

/*function add1(n, callback) {
    setTimeout(function () {
        callback(null, n + 1);
    }, 10);
}

function mul3(n, callback) {
    setTimeout(function () {
        callback(null, n * 3);
    }, 10);
}

var add1mul3 = async.compose(mul3, mul3, add1);
add1mul3(4, function (err, result) {
    // result now equals 15
    console.log('result=', result);
});*/

/*let count = 0;
async.forever(
    function(next) {
        // next is suitable for passing to things that need a callback(err [, whatever]);
        // it will result in this function being called again.
        setTimeout(() => {
            count++;
            console.log('count=', count);
            if (count >= 10) return next('ESTOP');
            return next();
        }, 1e3)
    },
    function (err) {
        // if next is called with a value in its first parameter, it will appear
        // in here as 'err', and execution will stop.
        console.log('STOP! err=', err);
    }
);*/

/*async.tryEach([
    function getDataFromFirstWebsite(callback) {
        // Try getting the data from the first website
        console.log('111');
        callback('eee', '111');
    },
    function getDataFromSecondWebsite(callback) {
        // First website failed,
        // Try getting the data from the backup website
        console.log('222');
        callback('xxx', '222');
    }
],
// optional callback
function(err, results) {
    // Now do something with the data.
    console.log('err=', err);
    console.log('results=', results);
});*/

/*const MY_CONST = 40;
const MY_CONST_2 = 41;

async.waterfall([
    async.constant(MY_CONST),
    function (value, next) {
        // value === 42
        console.log('value=', value);
        return next();
    },
    async.constant(MY_CONST_2),
    //...
], (err, result) => {
    console.log('err=', err);
    console.log('result=', result);
});*/

/*var slow_fn = function(name, callback) {
    // do something
    // callback(null, result);
    setTimeout(() => {
        console.log('slow_fn done:', name);
        return callback(null, `${moment().format('YYYYMMDD_HH:mm:ss')}_${name}`);
    }, 3e3)
};
var fn = async.memoize(slow_fn);

// fn can now be used as if it were slow_fn

async.series({
    1: (next) => fn('AAA', next),
    2: (next) => fn('BBB', next),
    3: (next) => fn('CCC', next),
    4: (next) => fn('AAA', next),
    5: (next) => fn('BBB', next),
    6: (next) => fn('DDD', next),
}, (err, result) => {
    console.log('err=', err);
    console.log('result=', result);
})*/

async.parallel([
    async.reflect(function(callback) {
        // do some stuff ...
        callback(null, 'one');
    }),
    async.reflect(function(callback) {
        // do some more stuff but error ...
        callback('bad stuff happened');
    }),
    async.reflect(function(callback) {
        // do some more stuff ...
        callback(null, 'two');
    }),
    async.reflect(function(callback) {
        // do some more stuff ...
        callback({err: 'asdasdasdas'}, 'asdasdasd', 'cvxcvxvxcxc');
    })
],
// optional callback
function(err, results) {
    // values
    // results[0].value = 'one'
    // results[1].error = 'bad stuff happened'
    // results[2].value = 'two'
    console.log('err=', err);
    console.log('results=', results);
});

