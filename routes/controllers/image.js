const Response = require('../services/Response');
const ImageService = require('../services/ImageService');

let Ctrl = {};
module.exports = Ctrl;

/**
  @api {post} /api/image/upload Upload image to host (imgur)
  @apiVersion 1.0.0
  @apiName Upload Image
  @apiGroup Image
  @apiPermission JWT

  @apiDescription Upload image to host (imgur)

  @apiHeader {String} content-type        Required, 'application/x-www-form-urlencoded'
  @apiHeader {String} x-token           	Required, token of user
  @apiHeader {String} accept-language     Optional, language in result message

  @apiHeaderExample {json} Header-Example:
  {
    "content-type": "application/x-www-form-urlencoded",
    "accept-language": "vi",
    "x-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDcyODNiNDVhZDg0OTA4MDU1YjAzMWMiLCJwaG9uZSI6Ijg0Nzc4NjE1Mzk1IiwiaWF0IjoxNTY5MDMyMDkwLCJleHAiOjE1Njk2MzY4OTB9.d9xlLVU-uqhc815AdfcON28igDpa0xMOdh-P5ASQMJo"
  }

  @apiParam {File} file       Binary's image to upload

  @apiParamExample {javascript} Request-Example:
  {
    "formData": {
      "file": {
        "value": "fs.createReadStream(\"/Users/Chickyky/Pictures/67403199_842910969414047_3083125789349117952_n.jpg\")",
        "options": {
          "filename": "/Users/Chickyky/Pictures/67403199_842910969414047_3083125789349117952_n.jpg",
          "contentType": null
        }
      }
    }
  }

  @apiSuccess {Number}   error         0 is no error
  @apiSuccess {String}   message    		Message
  @apiSuccess {Object}   data       		result is Array or Object
  *
  @apiSuccessExample Response Success (example):
  {
    "error": 0,
    "message": "success",
    "data": {
      "imgur": {
        "direct_url": "https://imgur.com/z0GpNP3",
        "image_url": "https://imgur.com/z0GpNP3",
        "urls": [
          "https://imgur.com/z0GpNP3"
        ],
        "response": {
          "data": {
              "hashes": [
                  "z0GpNP3"
              ],
              "hash": "z0GpNP3",
              "deletehash": "oE1zPN9sURL6plv",
              "ticket": false,
              "album": false,
              "edit": false,
              "gallery": null,
              "poll": false,
              "animated": false,
              "height": 960,
              "width": 960,
              "ext": ".jpg",
              "msid": "69b8eee2510e7d123c76d9c62a62d0f7"
          },
          "success": true,
          "status": 200
        }
      }
    }
  }
*/
Ctrl.upload = (req, res) => {
	let files = req.files;

	ImageService.upload(files, (err, result) => {
		if (err) return Response.error(req, res, err, result);

    return Response.success(req, res, result);
	});
}


