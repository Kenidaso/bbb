const keystone = require('keystone');
const shortId = require('short-id-gen');
const moment = require('moment');
const async = require('async');

const User = keystone.list('User').model;
const Post = keystone.list('Post').model;
const Comment = keystone.list('Comment').model;

// const utils = require('@helpers/utils');
const FORMAT_TIME_SLUG = 'YYYY.MM.DD.HH.mm.ss'

const noop = () => {}

const CommentService = {};
module.exports = CommentService;

CommentService.commentPost = (slugPost, detail, callback) => {
  const { slugAuthor, text } = detail;

  if (!text || !slugAuthor) return callback('EINVALIDPARAMS');

  async.parallel({
    author: (next) => {
      User.findOne({ slug: slugAuthor }, '_id', (err, user) => {
        if (err) return next('EFINDUSER', err);
        if (!user) return next('EUSERNOTFOUND');

        return next(null, user);
      });
    },

    post: (next) => {
      Post.findOne({ slug: slugPost }, '_id slug publishedDate', (err, post) => {
        if (err) return next('EFINDPOST', err);
        if (!post) return next('EPOSRNOTFOUND');

        return next(null, post);
      })
    }
  }, (err, result) => {
    if (err) return callback(err, result);

    const { author, post } = result;
    const publishedDate = Date.now();
    const _slug = shortId.generate(4);
    const slugComment = `${post.slug}/${_slug}`;

    const _pdPost = moment(post.publishedDate).utcOffset(420).format(FORMAT_TIME_SLUG);
    const _pdComment = moment(publishedDate).utcOffset(420).format(FORMAT_TIME_SLUG);
    const fullSlugComment = `${_pdPost}:${post.slug}/${_pdComment}:${_slug}`;

    const newComment = new Comment({
      post: post._id,
      slug: slugComment,
      fullSlug: fullSlugComment,
      author: author._id,
      publishedDate,
      text
    });

    newComment.save(err => {
      if (err) return callback('ECREATECOMMENT', err);

      return callback(null, {
        slug: newComment.slug,
        fullSlug: newComment.fullSlug,
        publishedDate: newComment.publishedDate
      });
    });
  });
}
