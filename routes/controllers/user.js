
let UserCtrl = {};
module.exports = UserCtrl;

UserCtrl.info = (req, res) => {
	return res.status(200).send('OK');
}