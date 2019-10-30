const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');

let html = fs.readFileSync(path.join(__dirname, '../data_sample/gg_news_article_redirect.html'), 'utf8');
// console.log(html);

const $ = cheerio.load(html);

let redirectLink = $('c-wiz > div > div > c-wiz > div > a').text()

console.log('redirectLink=', redirectLink);