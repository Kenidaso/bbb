const fs = require('fs');
const ggn = require('../engines/googleNews');

ggn.getFeedFromGgSearch('ethereum', (err, result) => {
	console.log('done err=', err);
	console.log('done result=', JSON.stringify(result));

	// fs.writeFileSync('../data_sample/ggn_getFeedFromGgSearch.html', result);
})