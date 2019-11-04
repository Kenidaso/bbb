var sections = document.querySelectorAll('c-wiz > div > div > c-wiz > div > div > div > main > c-wiz > div > div > main > div > div')

var section0 = sections[0]
var sectionTitle = section0.querySelectorAll('h2')[0].innerText;
var articles = section0.querySelectorAll('article')

var article0 = articles[0]
var articleLink = article0.querySelectorAll('h4 a')[0].getAttribute('href');
var articleImg = article0.querySelectorAll('figure img')[0].getAttribute('src');
var articlePaperImg = article0.querySelectorAll('div > img')[0].getAttribute('src');
var articlePaper = article0.querySelectorAll('div > a')[0].innerText;
var articlePublishDatetime = article0.querySelectorAll('time')[0].getAttribute('datetime');

let fromTwitter = sections[4]
let twitts = fromTwitter.querySelectorAll('div:nth-child(2) > [data-n-ci-wu*=twitter]')

let twitt0 = twitts[0]
var twittImg = twitt0.querySelectorAll('img')[0].getAttribute('src');
var twittTag = twitt0.querySelectorAll('div:nth-child(2) > div:nth-child(2) > div:nth-child(2)').innerText
var twittName = twitt0.querySelectorAll('div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0].innerText //VCFD PIOverified_user
var twittLink = twitt0.querySelectorAll('a')[0].getAttribute('href');
var twittContent = twitt0.querySelectorAll('div:nth-child(3)')[0].innerText;
var twittPublishDate = twitt0.querySelectorAll('time')[0].getAttribute('datetime') //1572606382000

var questions = sections[4].querySelectorAll('div:nth-child(1) > div:nth-child(1)')
var question0 = questions[0]
var questionTitle = question0.querySelectorAll('h3')[0].innerText
var link = question0.querySelectorAll('div a')[0].getAttribute('href');
var content = question0.querySelectorAll('div a')[0].innerText
var answers = question0.querySelectorAll('div > div > a > div:nth-child(2)');

var answer0 = answers[0]
var answerImg = answer.querySelectorAll('img')[0].getAttribute('src');
var answerTitle = answer0.querySelectorAll('div > div > div:nth-child(1)')[0].innerText
var answerPaper = answer0.querySelectorAll('div > div > div:nth-child(1)')[1].innerText
var answerPublishDate = answer0.querySelectorAll('time')[0].getAttribute('datetime');
