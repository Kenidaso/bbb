const keystone = require('keystone');
const cloudinary = require('cloudinary');
const { ImgPublic } = require('cky-image-public');

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
	}, callback);
}