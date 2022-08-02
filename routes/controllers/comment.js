const CommentService = require('@services/CommentService');

let CommentCtrl = {};
module.exports = CommentCtrl;

/* TODO: user slug author in access token */
CommentCtrl.commentPost = (req, res) => {
	const detail = req.body;
    const slugPost = req.params.slugPost;

    CommentService.commentPost(slugPost, detail, (err, result) => {
		if (err) return res.error(req, res, err, result);
		return res.success(req, res, result);
	});
}