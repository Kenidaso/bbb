const fs = require('fs');
const gga = require('../engines/googleAlert');

gga.getPreview('dota 2 TNC', (err, result) => {
	console.log('done err=', err);

	fs.writeFileSync('gga_preview.html', result);
})