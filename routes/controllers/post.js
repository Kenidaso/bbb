const PostService = require('@services/PostService');

let PostCtrl = {};
module.exports = PostCtrl;

/* TODO: user slug author in access token */
PostCtrl.create = (req, res) => {
	const opts = req.body;

    PostService.create(opts, (err, result) => {
		if (err) return res.error(req, res, err, result);
		return res.success(req, res, result);
	});
}