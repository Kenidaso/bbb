const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const request = require('request');

let html = fs.readFileSync(path.join(__dirname, '../raw_google_news.html'), 'utf8');
// console.log(html);

const getLinkRedirect = (articleLink, callback) => {
	request({
		url: articleLink,
		method: 'GET'
	}, (err, response, body) => {
		try {
			let $ = cheerio.load(body);
			let redirectLink = $('c-wiz > div > div > c-wiz > div > a').text();

			console.log(`${articleLink} ... redirect to ... ${redirectLink}`);

			return callback(null, redirectLink);
		} catch (ex) {
			console.log('ex=', ex.toString());
			return callback(null, null);
		}
	})
}

const $ = cheerio.load(html);

// từng card: document.querySelectorAll('main > c-wiz > div')
// cards: document.querySelectorAll('main > c-wiz > div:nth-child(1) > div')
// article trong tung card: card0.querySelectorAll('article')
// hình của card: card0.querySelectorAll('img')[0]
// title cua article: article0.querySelector('h3').textContent
// description article: article0.querySelector('span').innerText
// datetime article: article0.querySelector('time').getAttribute('datetime') // 2019-10-28T04:05:00Z
// paper of article: article0.querySelector('div > div > a').innerText

// link toan canh: card0.querySelectorAll('div > div > span > div > a')[0].getAttribute('href') // ./stories/CAAqOQgKIjNDQklTSURvSmMzUnZjbmt0TXpZd1NoTUtFUWlsODZUV2s0QU1FVVloOHNTeWk5eTdLQUFQAQ?hl=vi&gl=VN&ceid=VN%3Avi

const cards = $('main > c-wiz > div:nth-child(1) > div');

let result = [];

async.eachLimit(cards, 2, (card, cbCard) => {
	const articles = $('article', card);

	let objCard = {
		articles: []
	}

	async.eachLimit(articles, 2, (article, cbArticle) => {
		let title = $('h3', article).text().trim();
		let link = $('h3 a', article).attr('href');
		let description = $($('div span', article)[0]).text();

		if (!title || title.length == 0) {
			title = $('h4', article).text().trim();
			link = $('h4 a', article).attr('href');
		}

		link = 'https://news.google.com' + link.substr(1);

		let publishDate = $('time', article).attr('datetime');
		let paper = $('div > div > a', article).text();

		getLinkRedirect(link, (err, originLink) => {
			objCard.articles.push({
				title,
				description,
				publishDate,
				linkArticle: link,
				originLink,
				paper
			})

			return cbArticle()
		})
	}, (err) => {
		let srcImg = $($('img', card)[0]).attr('src');
		let linkOverView = $($('div > div > span > div > a', card)[0]).attr('href');
		if (linkOverView && linkOverView.length > 0) {
			linkOverView = 'https://news.google.com' + linkOverView.substr(1);
		}

		objCard.srcImg = srcImg;
		objCard.linkOverView = linkOverView;

		result.push(objCard);

		return cbCard();
	})
}, (err) => {
	console.log(JSON.stringify(result));
})

// _.forEach(cards, (card) => {

// })

