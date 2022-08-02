const keystone = require('keystone');

const User = keystone.list('User').model;
const Post = keystone.list('Post').model;

// const utils = require('@helpers/utils');

const noop = () => {}

const PostService = {};
module.exports = PostService;

PostService.create = (opts, callback) => {
	const { title, content, slugAuthor } = opts;

    if (!title || !slugAuthor) return callback('EINVALIDPARAMS');

    User.findOne({ slug: slugAuthor }, '_id', (err, user) => {
        if (err) return callback('EFINDUSER', err);
        if (!user) return callback('EUSERNOTFOUND');

        const publishedDate = Date.now();
        let newPost = new Post({
            title,
            publishedDate,
            author: user._id,
            state: 'published',
            content
        });

        newPost.save(err => {
            if (err) return callback('ECREATEPOST', err);

            return callback(null, {
                title: newPost.title,
                slug: newPost.slug,
                publishedDate: newPost.publishedDate
            });
        });
    });
}

PostService.detail = (slugPost, callback) => {
    Post.findOne({
        slug: slugPost
    })
}
