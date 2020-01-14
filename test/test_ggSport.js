const engine = require('../engines/googleSport');

// engine.matchOfLeague({
// 	type: 'PREMIER_LEAGUE',
// 	// date: '2019-12-01T07:33:06Z'
// }, (err, result) => {
// 	console.log('done err=', err);
// 	// console.log('done result=', JSON.stringify(result));
// 	console.log('done result=', result);
// })

// engine.standingOfLeague({
// 	type: 'PREMIER_LEAGUE',
// }, (err, result) => {
// 	console.log('done err=', err);
// 	// console.log('done result=', JSON.stringify(result));
// 	console.log('done result=', result);
// })

// engine.newsOfLeague({
// 	type: 'PREMIER_LEAGUE',
// }, (err, result) => {
// 	console.log('done err=', err);
// 	// console.log('done result=', JSON.stringify(result));
// 	console.log('done result=', result);
// })

engine.statOfLeague({
	// type: 'PREMIER_LEAGUE',
	type: 'SERIE_A',
}, (err, result) => {
	console.log('done err=', err);
	// console.log('done result=', JSON.stringify(result));
	console.log('done result=', result);
})