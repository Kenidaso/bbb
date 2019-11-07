// node test [task]
// node test ggnews
// node test ggnews_rss
// node test ggnews_topic
// node test ggnews_story

process.env.PORT = 1234;

const fs = require('fs');
const path = require('path');

const myArgs = process.argv.slice(2);
const task = myArgs[0].toLowerCase();

let ggNewsService = require('./routes/services/GoogleNewsService');
let GGNews = require('./engines/googleNews');

let GGN_TOPIC = 'https://news.google.com/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTjNjd0VnSmxiaWdBUAE?hl=en-US&gl=US&ceid=US%3Aen';
GGN_TOPIC = 'https://news.google.com/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNREZqY21RMUVnSjJhU2dBUAE?hl=vi&gl=VN&ceid=VN%3Avi';
GGN_TOPIC = 'https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FuWnBHZ0pXVGlnQVAB?hl=vi&gl=VN&ceid=VN%3Avi';
GGN_TOPIC = 'https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FuWnBHZ0pXVGlnQVAB/sections/CAQiWkNCQVNQUW9JTDIwdk1ESnFhblFTQW5acEdnSldUaUlPQ0FRYUNnb0lMMjB2TURKMmVHNHFHUW9YQ2hOTlQxWkpSVk5mVTBWRFZFbFBUbDlPUVUxRklBRW9BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FuWnBHZ0pXVGlnQVABUAE?hl=vi&gl=VN&ceid=VN%3Avi';
GGN_TOPIC = 'https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FuWnBHZ0pXVGlnQVAB/sections/CAQiRkNCQVNMZ29JTDIwdk1ESnFhblFTQW5acEdnSldUaUlPQ0FRYUNnb0lMMjB2TURSeWJHWXFDaElJTDIwdk1EUnliR1lvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURKcWFuUVNBblpwR2dKV1RpZ0FQAVAB?hl=vi&gl=VN&ceid=VN%3Avi';

let GGN_STORY = 'https://news.google.com/stories/CAAqcggKImxDQklTU3pvSmMzUnZjbmt0TXpZd1NqNEtFUWpQdy1ld2pvQU1FUW9xdXRxZm03b3VFaWt5SUdacGNtVm1hV2RvZEdWeWN5QmlkWEp1WldRZ2FXNGdRMkZzYVdadmNtNXBZU0JpYkdGNlpTZ0FQAQ?hl=en-US&gl=US&ceid=US%3Aen';

GGN_STORY = 'https://news.google.com/stories/CAAqOQgKIjNDQklTSURvSmMzUnZjbmt0TXpZd1NoTUtFUWpmbXBpMGpvQU1FY19vX0dEV29zZGlLQUFQAQ?hl=en-US&gl=US&ceid=US%3Aen';

GGN_STORY = 'https://news.google.com/stories/CAAqcAgKImpDQklTU1RvSmMzUnZjbmt0TXpZd1Nqd0tFUWlfdnZ5empvQU1FVDdJamxFamxDLTdFaWRIYjI5bmJHVWdZV054ZFdseVpYTWdSbWwwWW1sMElHWnZjaUFrTWk0eElHSnBiR3hwYjI0b0FBUAE?hl=en-US&gl=US&ceid=US%3Aen';

GGN_STORY = 'https://news.google.com/stories/CAAqOQgKIjNDQklTSURvSmMzUnZjbmt0TXpZd1NoTUtFUWlxdWFDempvQU1FZjE5UmJZcXlfTnZLQUFQAQ?hl=en-US&gl=US&ceid=US%3Aen';

GGN_STORY = 'https://news.google.com/stories/CAAqOQgKIjNDQklTSURvSmMzUnZjbmt0TXpZd1NoTUtFUWpCNDRmYWs0QU1FYnh6UVJ0RTZ3S1BLQUFQAQ?hl=vi&gl=VN&ceid=VN%3Avi';

let _done = (err, result) => {
	console.log('done err=', err);
	console.log('done result=', JSON.stringify(result));

	setTimeout(process.exit, 1000, 0);
}

let ggNews = (callback) => {
	ggNewsService.search('Heerenveen Văn Hậu', (err, result) => {
		// fs.writeFileSync('raw_google_news.html', result);
		return callback(err, result);
	});
}

let ggNews_RSS = (callback) => {
	ggNewsService.getEntriesFromRss('Heerenveen Văn Hậu', (err, result) => {
		// fs.writeFileSync('raw_google_news.html', result);
		return callback(err, result);
	});
}

let ggNews_Topic = (callback) => {
	let isGetOriginLink = false;
	GGNews.getFeedAndStoryFromTopic(GGN_TOPIC, (err, result) => {
		// fs.writeFileSync(path.join(__dirname, 'data_sample/raw_ggn_topic.html'), result);
		return callback(err, result);
	}, isGetOriginLink);
}

let ggNews_Story = (callback) => {
	let isGetOriginLink = true;
	GGNews.getFeedFromStory(GGN_STORY, callback, isGetOriginLink);
}

console.clear();

console.log('begin ...');
switch (task) {
	case 'ggnews': return ggNews(_done);
	case 'ggnews_rss': return ggNews_RSS(_done);
	case 'ggnews_topic': return ggNews_Topic(_done);
	case 'ggnews_story': return ggNews_Story(_done);
	default:
		console.log('Task not exists');
		return _done();
}
