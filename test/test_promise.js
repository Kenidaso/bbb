const util = require('util');
const async = require('async');


const fn = (time, callback) => {
  setTimeout(() => {
    return time % 2000 == 0 ? callback('E2000', time) : callback(null, time);
  }, time)
}

const asyncFn = util.promisify(fn);

const promise1 = new Promise(function(resolve, reject) {
  setTimeout((value) => {
  	console.log('value=', value);
  	return resolve(value)
  }, 3e3, 'promise1');
});

const promise2 = new Promise(function(resolve, reject) {
  setTimeout((value) => {
  	console.log('value=', value);
  	return resolve(value)
  }, 2e3, 'promise2');
});

const promise3 = new Promise(function(resolve, reject) {
  setTimeout((value) => {
  	console.log('value=', value);
  	// return resolve(value)
    return reject(value)
  }, 1e3, 'promise3');
});

const promise4 = new Promise(function(resolve, reject) {
  setTimeout((value1, value2) => {
  	console.log('value=', value1, value2);
  	return resolve(value1, value2)
  }, 1e3, 'promise4', 'promise5');
});

let tasks = [promise1, promise2, promise3, promise4];
// let tasks = [1000, 2000, 1500, 1700];

async.eachLimit(tasks, 1, async (t, cb) => {
  try {
    // let value = await asyncFn(t);
    let value = await t;

    console.log('result value=', value);

    return cb(null, value);
  } catch (ex) {
    return cb(ex);
  }
}, (err, result) => {
  console.log('Done!');
  console.log('err=', err);
  console.log('result=', result);
})

// Promise.all([promise1, promise2, promise3]).then(function(values) {
//   console.log('Done:', values);
// });