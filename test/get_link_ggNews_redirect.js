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

const linkGgn = 'https://news.google.com/articles/CBMi0gFodHRwOi8vd3d3LnJmaS5mci92aS9jaCVDMyVBMnUtJUMzJUExLzIwMTkxMjIzLWglRTElQkElQTFuLWNoJUMzJUIzdC0lQzQlOTElRTElQkIlODMtYiVFMSVCQSVBRmMtdHJpJUUxJUJCJTgxdS10aSVDMyVBQW4taCVFMSVCQiU5M2ktaCVDNiVCMCVDNiVBMW5nLXRvJUMzJUEwbi1iJUUxJUJCJTk5LW5nJUM2JUIwJUUxJUJCJTlEaS1sYW8tJUM0JTkxJUUxJUJCJTk5bmfSAdMBaHR0cHM6Ly9hbXAucmZpLmZyL3ZpL2NoJUMzJUEydS0lQzMlQTEvMjAxOTEyMjMtaCVFMSVCQSVBMW4tY2glQzMlQjN0LSVDNCU5MSVFMSVCQiU4My1iJUUxJUJBJUFGYy10cmklRTElQkIlODF1LXRpJUMzJUFBbi1oJUUxJUJCJTkzaS1oJUM2JUIwJUM2JUExbmctdG8lQzMlQTBuLWIlRTElQkIlOTktbmclQzYlQjAlRTElQkIlOURpLWxhby0lQzQlOTElRTElQkIlOTluZw?hl=vi&gl=VN&ceid=VN%3Avi';

ggn.getLinkRedirect(linkGgn, (err, result) => {
	console.log('err=', err);
	console.log('result=', result);
})