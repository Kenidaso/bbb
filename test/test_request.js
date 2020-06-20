const request = require('request').defaults({
  headers: {
    origin: 'chickyky-by-pass'
  }
});

request({
  url: `http://localhost:3222/categories`,
  method: 'GET',
}, (err, response, body) => {
  console.log(`err= ${err}`);
  console.log(`body= ${body}`);
})