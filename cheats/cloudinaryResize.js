/* Cheat by Chickyky */
import url from 'cloudinary-microurl';
const CLOUD_NAME = window.Keystone.cloudinary.cloud_name;

/*
	Take a cloudinary public id + options object
	and return a url
*/
function cloudinaryResize (publicId, options = {}) {
	console.log('cloudinaryResize publicId=', publicId, 'options=', options);

	if (options.secure_url) return options.secure_url;
	if (options.url) return options.url;

	if (!publicId || !CLOUD_NAME) {

		return false;
	}

	return url(publicId, {
		cloud_name: CLOUD_NAME, // single cloud for the admin UI
		quality: 80, // 80% quality, which ~halves image download size
		...options,
	});
};

module.exports = cloudinaryResize;
