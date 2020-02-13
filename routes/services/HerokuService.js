const HEROKU_API = process.env.HEROKU_API;

const Heroku = require('heroku-client');
const heroku = new Heroku({
	token: HEROKU_API
});

const utils = require('../../helpers/utils');

module.exports = {
	restart: (appName, dynoName, callback) => {
		heroku.delete('/apps/' + appName + '/dynos/' + dynoName)
			.then(result => {
				utils.sendMessageTelegram(`app= ${appName} dyno= ${dynoName} : restart dyno success`);
			  return callback(null, result);
			})
			.catch((err) => {
				utils.sendMessageTelegram(`app= ${appName} dyno= ${dynoName} : restart dyno err ${err}`);
				return callback(err);
			})
	}
}