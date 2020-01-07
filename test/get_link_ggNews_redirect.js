const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');

const base = require('../engines/base');
const ggn = require('../engines/googleNews');

// let html = fs.readFileSync(path.join(__dirname, '../data_sample/gg_news_article_redirect.html'), 'utf8');
// // console.log(html);

// const $ = cheerio.load(html);

// let redirectLink = $('c-wiz > div > div > c-wiz > div > a').text()

// console.log('redirectLink=', redirectLink);

const linkGgn = 'https://news.google.com/articles/CBMiamh0dHA6Ly92aWV0cS52bi90cmlldC1waGEta2hvLXh1b25nLWNodWEtaGFuZy10YW4tdHJ1bmctbm9uLXZpdC10aGl0LWtob25nLWRhbS1iYW8tY2hhdC1sdW9uZy1kMTY3MzM2Lmh0bWzSAQA?hl=vi&gl=VN&ceid=VN%3Avi';

ggn.getLinkRedirect(linkGgn, (err, result) => {
	console.log('err=', err);
	console.log('result=', result);
})