const request = require('request');



const getPreview = (keyword, callback) => {
  const alert_params = `[null,[null,null,null,[null,"${keyword}","com",[null,"vi","US"],null,null,null,0,1],null,2,[[null,1,"cky.chaos.estate@gmail.com",[],1,"en-US",null,null,null,null,null,"0",null,null,"AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"]]],0]`;

  request({
    url: 'https://www.google.com/alerts/preview',
    method: 'GET',
    qs: {
      params: alert_params
    }
  }, (err, response, body) => {
    return callback(err, body);
  })
}

module.exports = {
  getPreview
}