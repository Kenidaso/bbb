const keystone = require('keystone');
const cloudinary = require('cloudinary');
const { ImgPublic } = require('cky-image-public');

let ImageModel = keystone.list('Image').model;

let ImageService = {};
module.exports = ImageService;

ImageService.upload_cloudinary = (url_image, callback) => {
	cloudinary.v2.uploader.upload(url_image, callback);
}

ImageService.upload = (files, callback) => {
	const imgPub = new ImgPublic({
		imgur: true
	});

	let image = files.file;

	console.log('image=', image);

	imgPub.upload({
		filePath: image.path
	}, (err, result) => {

		if (!err) {
			let img = new ImageModel({
				url: result.imgur.direct_url,
				host: 'IMGUR',
				metadata: result
			})

			img.save(() => {
				console.log('save image done');
			});
		}

		return callback(err, result);
	});
}