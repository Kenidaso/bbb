const fs = require('fs');
let teleBot = require('../services/TelegramService');

let telegramBotCtrl = {};

telegramBotCtrl.processUpdate = (req, res) => {
	teleBot.processUpdate(req.body);
  res.sendStatus(200);
}

telegramBotCtrl.sendMessage2Group = (req, res) => {
	let { message, url_image, key, groupId } = req.body;
	let { file } = req;

	groupId = groupId || teleBot.GROUP_CHATBOT;

	if (message) teleBot.sendMessage(groupId, message);
	if (key) {
		let _msgKey = `Key: ${key}`;
		teleBot.sendMessage(groupId, _msgKey);
	}
	if (url_image) teleBot.sendPhoto(groupId, url_image);
	if (file) teleBot.sendPhoto(groupId, fs.createReadStream(file.path));

	return res.status(200).json(req.body);
}

module.exports = telegramBotCtrl;