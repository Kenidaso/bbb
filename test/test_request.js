require('http').Server(function (req, res) {})
.listen(28423, '127.0.0.1', function () {
  var request = require('request')

  request({
    "method": "GET",
    "uri": "http://127.0.0.1:28423",
    "timeout": 1000
  }).on('error', function(e){
    console.log('error')
    console.log(e.code, e.message);
  })
})