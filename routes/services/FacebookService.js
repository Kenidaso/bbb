const request = require('request');

const utils = require('../../helpers/utils');

const ACCESS_TOKEN = 'EAADA4Tu5ZCqIBAGXT31MkzHNkczpVmc6CTwa1yrsKGiZCyQYDClQFeJstFBBvFcRdZCMOmguDMYqMN7ZAoNfmp5OCNeRx5wzBR2hGAjn2rv2jlUTnJVQW6LERhcDgPRK7lUeWqvMnEwhpQ4EiH4p3FNiGZBabvZCGXgCZAsFCUlYriQc7tCmMPo';

const version = 'v5.0';
const URL_API = 'https://graph.facebook.com';

const FbService = {};
module.exports = FbService;

const noop = () => {}

FbService.scrapedSharingDebugger = (url, callback = noop) => {
	if (!url) return callback('EURLSHARINGINVALID');

	request({
		url: `${URL_API}/${version}/`,
		method: 'POST',
		json: true,
		body: {
			scrape: true,
			id: url,
			access_token: ACCESS_TOKEN
		}
	}, (err, response, body) => {
		console.log(`scrapedSharingDebugger body= ${JSON.stringify(body)}`);
		return callback && callback(err, body);
	})
}