const keystone = require('keystone');
const _ = require('lodash');
const request = require('request');
const cloudinary = require('cloudinary');
const { ImgPublic } = require('cky-image-public');

const utils = require('../../helpers/utils');

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

let _genUrlFromBase = (urlBase) => {
	let sizes = {
		smallUrl: '480x360',
		mediumUrl: '1366x768',
		largeUrl: '1920x1200',
		mobileSmallUrl: '360x480',
		mobileMediumUrl: '768x1366',
		mobileLargeUrl: '1080x1920',
	}

	if (urlBase.indexOf('bing.com') < 0) urlBase = `https://bing.com${urlBase}`;

	let images = {};

	for (let s in sizes) {
		images[s] = `${urlBase}_${sizes[s]}.jpg`
	}

	return images;
}

ImageService.imageOfDay = (callback) => {
	let urlBingImage = `https://www.bing.com/HPImageArchive.aspx?format=js&n=8`;

	request({
	  url: urlBingImage,
	  method: 'GET',
	}, (err, response, body) => {
	  if (err) return callback(err);

	  let result = utils.safeParse(body);

	  if (!result) return callback();

	  let image = _.sample(result.images);
	  if (!image) return callback();

	  console.log('image=', image);

	  /*
			{
				startdate: "20200211",
				fullstartdate: "202002110800",
				enddate: "20200212",
				url: "/th?id=OHR.BlaetterFrost_ROW7315518184_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp",
				urlbase: "/th?id=OHR.BlaetterFrost_ROW7315518184",
				copyright: "Leaves with hoarfrost in the Black Forest, Freiburg, Baden-Württemberg, Germany (© Per-Andre Hoffmann/Cavan Images)",
				copyrightlink: "javascript:void(0)",
				title: "",
				quiz: "/search?q=Bing+homepage+quiz&filters=WQOskey:%22HPQuiz_20200211_BlaetterFrost%22&FORM=HPQUIZ",
				wp: true,
				hsh: "7591fdca0aef06c7cc01b79e4dc4a6a9",
				drk: 1,
				top: 1,
				bot: 1,
				hs: [ ]
			}
	  */

	  let note = image.copyright;
	  let images = _genUrlFromBase(image.urlbase);

	  console.log('images=', images);

	  return callback(null, Object.assign({}, images, { note }));
	})
}
