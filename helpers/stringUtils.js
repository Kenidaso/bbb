module.exports = {
	parseJSON: (input) => {
		if (input === undefined) return null;
		try {
			input = JSON.parse(input);
		} catch (e) {
			console.log('parseJSON', input, e); // error in the above string (in this case, yes)!
			return null;
		}
		return input;
	},
	minify: (input = '') => {
		return input.replace(/\r\n|\n|\t/g, ' ').replace(/\s\s/g, '').trim();
	},
};
