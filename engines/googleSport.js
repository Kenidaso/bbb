/*
sp:2,tab:lb,emid:/g/11fk0cxp0k,rbpt:undefined,ct:VN,hl:en,tz:Asia/Saigon,dtoint:2020-01-17T19:30:00Z,dtointmid:/g/11fk0cxp0k,_id:liveresults-sports-immersive__league-fullpage,_pms:s,_jsfs:Ffpdje,_fmt:pc

https://www.google.com/async/lr_lg_fp?async=
emid:/g/11fj6snmjm,tz:Asia/Saigon,tab:st,_id:liveresults-sports-immersive__league-fullpage,_fmt:pc


https://www.google.com/async/lr_lm_mt
emid:/g/11fj6snmjm,moa:2019-12-01T14:00:00Z,_id:liveresults-sports-immersive__updatable-league-matches,_fmt:pc

https://www.google.com/async/lr_sma_tb

tab:mt --> match
tab:st --> standing
tab:nw --> news
tab:lb --> stat (leader board)
tab:pl --> player


https://www.google.com/async/lr_sma_tb?vet=12ahUKEwjMoZmLp4LnAhWRWisKHcibAy0Qo-sBegQIARAW..i&ei=c0odXs2RKMG89QPBirTwBA&yv=3&q=&async=ct:VN,hl:en,tz:Asia%2FSaigon,dtoint:2020-01-17T19%3A30%3A00Z,dtointmid:%2Fg%2F11fk0cxp0k,emid:%2Fg%2F11fk0cxp0k,et:lg,gndr:MALE,lmid:%2Fm%2F037169,rtab:19,sp:2,_fmt:prog,_id:tab-1-19,_jsfs:Ffpdje


cau thu: player
https://www.google.com/async/lr_sma_tb?vet=12ahUKEwjMoZmLp4LnAhWRWisKHcibAy0Qo-sBegQIARAa..i&ei=c0odXs2RKMG89QPBirTwBA&yv=3&q=&async=ct:VN,hl:en,tz:Asia/Saigon,dtoint:2020-01-17T19:30:00Z,dtointmid:/g/11fk0cxp0k,emid:/g/11fk0cxp0k,et:lg,gndr:MALE,lmid:/m/037169,rtab:20,sp:2,_fmt:prog,_id:tab-1-20,_jsfs:Ffpdje

standing - bang xep hang
https://www.google.com/async/lr_sma_tb?vet=12ahUKEwjQvdeM0ILnAhWFfn0KHVc-CHQQo-sBegQIARAS..i&ei=b3UdXpP5G9u6rQHi06TYAQ&yv=3&q=&async=ct:VN,hl:vi,tz:Asia/Saigon,dtoint:2020-01-12T14:00:00Z,dtointmid:/g/11fj6snmjm,emid:/g/11fj6snmjm,et:lg,gndr:UNKNOWN_GENDER,lmid:/m/02_tc,rtab:3,sp:2,_fmt:prog,_id:tab-1-3,_jsfs:Ffpdje

stat : thong so giai dau
https://www.google.com/async/lr_sma_tb?vet=12ahUKEwjQvdeM0ILnAhWFfn0KHVc-CHQQo-sBegQIARAW..i&ei=b3UdXpP5G9u6rQHi06TYAQ&yv=3&q=&async=ct:VN,hl:vi,tz:Asia/Saigon,dtoint:2020-01-12T14:00:00Z,dtointmid:/g/11fj6snmjm,emid:/g/11fj6snmjm,et:lg,gndr:MALE,lmid:/m/02_tc,rtab:19,sp:2,_fmt:prog,_id:tab-1-19,_jsfs:Ffpdje

cau thu : player
https://www.google.com/async/lr_sma_tb?vet=12ahUKEwjQvdeM0ILnAhWFfn0KHVc-CHQQo-sBegQIARAa..i&ei=b3UdXpP5G9u6rQHi06TYAQ&yv=3&q=&async=ct:VN,hl:vi,tz:Asia/Saigon,dtoint:2020-01-12T14:00:00Z,dtointmid:/g/11fj6snmjm,emid:/g/11fj6snmjm,et:lg,gndr:MALE,lmid:/m/02_tc,rtab:20,sp:2,_fmt:prog,_id:tab-1-20,_jsfs:Ffpdje

news - tin tuc
https://www.google.com/search?vet=12ahUKEwjm05Sg0oLnAhUUbn0KHSF0BEUQo-sBegQIARA8..i&ei=s3cdXt_5EdT6rQGn96rgCg&yv=3&q=&asearch=lr_nt&async=emids:/m/02_tc,en:Ngoại hạng Anh,et:lg,lmid:/m/02_tc,mmid:,sp:2,_fmt:prog,_id:news-tab--347155782,_jsfs:Ffpdje
*/
const moment = require('moment');
const request = require('request').defaults({
	headers: {
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
		'sec-fetch-site': 'same-origin',
		'sec-fetch-mode': 'cors',
	},
  jar: true
})

let cookie = request.jar();

const EMID = {
	PREMIER_LEAGUE: '/g/11fj6snmjm',
	SERIE_A: '/g/11h02jy6ph',
	BUNDESLIGA: '/g/11fk0cxp0k'
}

const NEWS_ASYNC_EMIDS = {
	PREMIER_LEAGUE: 'emids:/m/02_tc,en:Ngoại hạng Anh,et:lg,lmid:/m/02_tc,mmid:,sp:2,_fmt:prog,_id:news-tab--347155782,_jsfs:Ffpdje',
}

const default_Option = {
	ct: 'VN',
	hl: 'en',
	tz: 'Asia/Saigon',
	et: 'lg',

}

const matchOfLeague = (opt, callback) => {
	opt = Object.assign({}, default_Option, opt);

	let emid = EMID[opt.type];

	opt.date = opt.date || moment().utcOffset(0).format();

	// let urlGet = `https://www.google.com/async/lr_lg_fp?yv=3&q=&async=ct:${opt.ct},hl:${opt.hl},tab:mt,tz:${opt.tz},dtoint:2020-01-17T19:30:00Z,dtointmid:${emid},emid:${emid},et:lg,sp:2,_fmt:pc,_id:liveresults-sports-immersive__league-fullpage,_jsfs:Ffpdje`;

	let urlGet = `https://www.google.com/async/lr_lm_mt?async=sp:2,ct:${opt.ct},hl:${opt.hl},tab:mt,tz:${opt.tz},emid:${emid},moa:${opt.date},_id:liveresults-sports-immersive__updatable-league-matches,_fmt:pc`;

	console.log('matchOfLeague url=', urlGet);

	request({
		url: urlGet,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);

		if (!body || body.length == 0) return callback();

		let split = body.split('\n');

		if (!split || split.length < 4) return callback();

		let html = split[3].slice(6);
		html = html.substr(0, html.length - 5);

		return callback(err, html);
	})
}

const standingOfLeague = (opt, callback) => {
	opt = Object.assign({}, default_Option, opt);

	let emid = EMID[opt.type];

	let urlGet = `https://www.google.com/async/lr_lg_fp?async=sp:2,ct:${opt.ct},hl:${opt.hl},tab:st,tz:${opt.tz},emid:${emid},_id:liveresults-sports-immersive__updatable-league-matches,_fmt:pc`;

	console.log('standingOfLeague url=', urlGet);

	request({
		url: urlGet,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);

		if (!body || body.length == 0) return callback();

		let split = body.split('\n');

		if (!split || split.length < 4) return callback();

		let html = split[3].slice(6);
		html = html.substr(0, html.length - 5);

		return callback(err, html);
	})
}

const newsOfLeague = (opt, callback) => {
	opt = Object.assign({}, default_Option, opt);

	let emid = EMID[opt.type];
	let async_emid = NEWS_ASYNC_EMIDS[opt.type];

	// let urlGet = `https://www.google.com/async/lr_lg_fp?async=sp:2,ct:${opt.ct},hl:${opt.hl},tab:nw,tz:${opt.tz},emid:${emid},_id:liveresults-sports-immersive__updatable-league-matches,_fmt:pc`;

	let urlGet = `https://www.google.com/search?yv=3&q=&asearch=lr_nt&async=${async_emid}`;
	urlGet = encodeURI(urlGet);

	console.log('newsOfLeague url=', urlGet);

	request({
		url: urlGet,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);

		if (!body || body.length == 0) return callback();
		// return callback(err, body);
		let split = body.split('\n');

		if (!split || split.length < 5) return callback();

		let html = split[3].slice(5);
		html = html + split[4];

		html = html.substr(0, html.length - 5);

		return callback(err, html);
	})
}

const statOfLeague = (opt, callback) => {
	opt = Object.assign({}, default_Option, opt);

	let emid = EMID[opt.type];
	let date = moment().add(-2, 'd').utcOffset(0).format('YYYY-MM-DDTHH:00:00') + 'Z';

	let urlGet = `https://www.google.com/async/lr_sma_tb?vet=12ahUKEwjQvdeM0ILnAhWFfn0KHVc-CHQQo-sBegQIARAW..i&ei=b3UdXpP5G9u6rQHi06TYAQ&yv=3&q=&async=ct:${opt.ct},hl:${opt.hl},tz:${opt.tz},dtoint:${date},dtointmid:${emid},emid:${emid},et:lg,lmid:/m/02_tc,rtab:3,sp:2,_fmt:prog,_id:tab-1-3,_jsfs:Ffpdje`;

	console.log('statOfLeague url=', urlGet);

	request({
		url: urlGet,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);

		if (!body || body.length == 0) return callback();

		let split = body.split('\n');

		if (!split || split.length < 4) return callback();

		let html = split[3].slice(6);
		html = html.substr(0, html.length - 5);

		return callback(err, html);
	})
}

module.exports = {
	matchOfLeague,
	standingOfLeague,
	newsOfLeague,
	statOfLeague
}
