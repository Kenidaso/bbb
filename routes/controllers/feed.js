
let FeedCtrl = {};
module.exports = FeedCtrl;

FeedCtrl.info = (req, res) => {
	return res.status(200).send('OK');
}