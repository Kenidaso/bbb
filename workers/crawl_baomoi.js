// https://m.baomoi.com/an-ninh-trat-tu/trang2.epi

// NODE_ENV=production node workers/from_topic_gg_news_v2

const path = require('path');

require('dotenv').config({
	path: path.join(__dirname, '../.env')
});

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'local';

const keystone = require('keystone');
const requireDir = require('require-dir');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');
const DecayMongo = require('cky-mongo-decay');

const program = require('commander');
program.version('1.0.0');

program
	.option('-s, --slug [String]', `slug of category's BaoMoi, seperate by comma. ex: thoi-su,the-thao,abc-xyz`)
	.option('-p, --page [Number]', `number of page crawl, max is 5`)

program.parse(process.argv);

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('../models');

let redisService = require('../routes/services/RedisService');
let RawFeedService = require('../routes/services/RawFeedService');

let engine = require('../engines/baomoi');

const Feed = keystone.list('Feed');
const Baomoi = keystone.list('Baomoi');

const Statics = requireDir('../statics');

const decayMongo = new DecayMongo({
	fnDecay: (obj) => {
		return moment(obj.publishDate).utcOffset(420).format('YYYYMM');
	},

	schema: require('../schemas/FeedSchema'),
	modelName: 'Feed',
	limitDecay: 10,
	stopDecayWhenError: false,

	piecesOfDecay: {
		'201901': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201901?ssl=true&authSource=admin',
		'201902': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201902?ssl=true&authSource=admin',
		'201903': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201903?ssl=true&authSource=admin',
		'201904': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201904?ssl=true&authSource=admin',
		'201905': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201905?ssl=true&authSource=admin',
		'201906': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201906?ssl=true&authSource=admin',
		'201907': 'mongodb://u03tbcz3m0lixhxufgp2:0DfdHu9nvj6EQbNrXjsX@bpbbnmdkbfh4jac-mongodb.services.clever-cloud.com:27017/bpbbnmdkbfh4jac',
		'201908': 'mongodb://ugpuny720zuiehj4bh3i:tGkqJXRndBlLLWvDFWTJ@b5ews7eoyuic9x5-mongodb.services.clever-cloud.com:27017/b5ews7eoyuic9x5',
		'201909': 'mongodb://uaq5ryxwxoaarzrf45sa:PnKs2RfQs0wpZvAuGGwo@bhx6aaykn40e6ac-mongodb.services.clever-cloud.com:27017/bhx6aaykn40e6ac',
		'201910': 'mongodb://umt3aqgjlfkrwjxqkp1z:33RrY4RuHYY7AJ8K9kyX@bm6eejqcbacvjfv-mongodb.services.clever-cloud.com:27017/bm6eejqcbacvjfv',
		'201911': 'mongodb://uwgtfa3n2inucui3u5cq:Eb29Kj49pdwmEy9QrhVM@bmfjjhav1hbruyp-mongodb.services.clever-cloud.com:27017/bmfjjhav1hbruyp',
		'201912': 'mongodb://ugrbizkityk1t32neglg:L7ikCYcz9bV6wvsWSzAe@b3haqbviztkcjnm-mongodb.services.clever-cloud.com:27017/b3haqbviztkcjnm',

		'202001': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201901?ssl=true&authSource=admin',
		'202002': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201902?ssl=true&authSource=admin',
		'202003': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201903?ssl=true&authSource=admin',
		'202004': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201904?ssl=true&authSource=admin',
		'202005': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201905?ssl=true&authSource=admin',
		'202006': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201906?ssl=true&authSource=admin',
		'202007': 'mongodb://u03tbcz3m0lixhxufgp2:0DfdHu9nvj6EQbNrXjsX@bpbbnmdkbfh4jac-mongodb.services.clever-cloud.com:27017/bpbbnmdkbfh4jac',
		'202008': 'mongodb://ugpuny720zuiehj4bh3i:tGkqJXRndBlLLWvDFWTJ@b5ews7eoyuic9x5-mongodb.services.clever-cloud.com:27017/b5ews7eoyuic9x5',
		'202009': 'mongodb://uaq5ryxwxoaarzrf45sa:PnKs2RfQs0wpZvAuGGwo@bhx6aaykn40e6ac-mongodb.services.clever-cloud.com:27017/bhx6aaykn40e6ac',
		'202010': 'mongodb://umt3aqgjlfkrwjxqkp1z:33RrY4RuHYY7AJ8K9kyX@bm6eejqcbacvjfv-mongodb.services.clever-cloud.com:27017/bm6eejqcbacvjfv',
		'202011': 'mongodb://uwgtfa3n2inucui3u5cq:Eb29Kj49pdwmEy9QrhVM@bmfjjhav1hbruyp-mongodb.services.clever-cloud.com:27017/bmfjjhav1hbruyp',
		'202012': 'mongodb://ugrbizkityk1t32neglg:L7ikCYcz9bV6wvsWSzAe@b3haqbviztkcjnm-mongodb.services.clever-cloud.com:27017/b3haqbviztkcjnm',
	}
});

const noop = () => {};

let START = moment();
const MAX_PAGE = 5;

let listCategory = null;

program.page = Number(program.page) || 3;
let PAGE = Math.min(program.page, MAX_PAGE);
PAGE = Math.max(PAGE, 0);

process.on('uncaughtException', (error) => {
  console.log(`====> uncaughtException=`, error);
});

const getBaomoiCategory = (callback) => {
	if (listCategory) return callback();

	let find = {};

	if (program.slug) {
		find['slug'] = {
			$in: program.slug.split(',')
		}
	}

	console.log('find category=', JSON.stringify(find));

	Baomoi.model.find(find, '-_id slug url title category', (err, categories) => {
		if (err) return callback('EGETCATEGORIES', err);

		listCategory = categories;

		return callback();
	});
}

/*
{
  "linkBaoMoi": "https://m.baomoi.com/vu-cap-bo-khong-dung-duoc-cho-dan-lam-giong-do-bo-nhut-nhat/c/33407813.epi",
  "title": "Vụ cấp bò không đứng được cho dân làm giống: Do bò... nhút nhát (?!)",
  "heroImage": {
    "url": "https://photo-3-baomoi.zadn.vn/w500_r1x2m/2019_12_23_15_33407813/ba954a59a6194f471608.jpg"
  },
  "publishDate": "2019-12-23T10:32:00.000+07:00",
  "description": "Bò giống cấp cho dân nghèo làm giống không đi được, nằm vật giữ đường được chủ đầu tư cho rằng là do mới tách...",
  "link": "http://nld.com.vn/thoi-su/vu-cap-bo-khong-dung-duoc-cho-dan-lam-giong-do-bo-nhut-nhat-20191223094859494.htm",
  "rawHtml": "<div class=\"host-baomoi _wrap\"><header><h1>Vụ cấp bò không đứng được cho dân làm giống: Do bò... nhút nhát (?!)</h1><div> 23/12/19 10:32 </div><div>Bò giống cấp cho dân nghèo làm giống không đi được, nằm vật giữ đường được chủ đầu tư cho rằng là do mới tách đàn, bò nhút nhát khi cột dây nên không chịu đi(?!)</div></header><div><p>Ngày 23-12, Ban Dân tộc tỉnh Gia Lai đã có văn bản gửi UBND tỉnh Gia Lai báo cáo nội dung Báo Người Lao Động phản ánh trong bài viết \"Chuyện lạ ở Gia Lai: Cấp bò không đứng được cho dân nghèo làm giống\".</p><p></p><p><em>Bò giống vừa nhận hỗ trợ đã không thể đứng được</em></p><p>Theo đó, Ban Dân tộc tỉnh Gia Lai được UBND tỉnh giao làm chủ đầu tư nguồn vốn đảm bảo xã hội. Công ty Cổ phần Kinh doanh và Phát triển miền núi Gia Lai (Công ty Miền núi) là đơn vị cung ứng, cấp phát bò cái sinh sản cho các hộ nghèo trên địa bàn tỉnh để làm giống.</p><p><img src='https://photo-3-baomoi.zadn.vn/w500_r1/2019_12_23_15_33407813/67ad2ca4d3e43aba63f5.jpg'></p><p><em>Con bò cấp cho gia đình không đi, nằm vật giữ đường nên ông Siu Glak phải đưa công nông tới chở</em></p><p>Tiêu chí khi cấp là bò giống phải có trọng lượng từ 125-135kg/con, từ 12 đến 24 tháng tuổi, bò khỏe mạnh bình thường, được tiêm phòng.</p><p>Tại huyện Chư Sê, có 164 hộ nghèo được cấp 164 con (đợt 1 là 48 con). Ngày 4-12, Công ty Miền núi tổ chức nghiệm thu bò đợt 2 tại trại bò thuộc thôn Nam Hà, xã Ia Ke, huyện Phú Thiện với số lượng 130 con. Hội đồng nghiệm thu đã loại 8 con không đạt tiêu chí (thiếu cân, xù lông, bị thương ở chân). Từ ngày 5 đến ngày 7 đã cấp 116 con cho những hộ nghèo tại 9 xã .</p><p><img src='https://photo-3-baomoi.zadn.vn/w500_r1/2019_12_23_15_33407813/ba86f08f0fcfe691bfde.jpg'></p><p><em>Được đưa lên xe, con bò năm im như chết</em></p><p>Ngày 5-12, Báo Người Lao Động có bài viết thông tin chiều 5-12, Công ty Cổ phần Kinh doanh và Phát tiền Miền núi Gia Lai tiến hành cấp bò, mỗi con trị giá 16,4 triệu đồng cho 20 hộ dân xã Kông Htok, huyện Chư Sê. Trong số này, con bò số hiệu 000619 sau khi được cấp, gia đình ông Siu Glak dắt khỏi cổng UBND xã khoảng 100 mét thì bò nằm vật xuống. Ông Siu Glak đã làm đủ mọi cách nhưng con bò vẫn không chịu đi, không còn cách nào khác ông Siu Glak phải đưa xe công nông đến để chở về.</p><p>Cùng thời gian này, một con bò khác cũng nằm vật trong khuôn viên UBND xã Kông Htok không chịu đi, người dân không nhận nên đơn vị cung ứng phải đưa xe đến chở về.</p><p><img src='https://photo-3-baomoi.zadn.vn/w500_r1/2019_12_23_15_33407813/8e1a78d694967dc82487.jpg'></p><p><em>Con bò cấp cho ông Rchâm Ky, xã Kông Hotk ngày 5-12</em></p><p>Theo Ban Dân tộc tỉnh Gia Lai, qua kiểm tra, trao đổi với chủ bò thì do bò quen sống thành đàn và chưa bao giờ cột dây, đến khi tách đàn và buộc dây bò rất nhút nhát, hơn nữa trong quá trình vận chuyển bằng xe tải một số bò sợ hãi nên khi cho xuống khỏi xe có trường hợp bỏ chạy, nếu cột lại thì nằm vạ một thời gian và cho đó là đặc tính của bò sống theo bầy đàn(?!)</p><p><img src='https://photo-3-baomoi.zadn.vn/w500_r1/2019_12_23_15_33407813/fb400c8ce0cc099250dd.jpg'></p><p><em>Ban Dân tộc tỉnh Gia Lai cho rằng bò không đi được là do bò sợ hãi, nhút nhát.</em></p><p><strong> Hoàng Thanh</strong></p></div></div>",
  "_categoryBaoMoi": {
    "_id": "5db869596e81b1a7090ba4eb",
    "updatedBy": "5dada66244f45b0504c654cb",
    "updatedAt": "2019-10-29T16:33:40.211Z",
    "createdBy": "5dada66244f45b0504c654cb",
    "createdAt": "2019-10-29T16:31:21.764Z",
    "slug": "baomoi-xa-hoi",
    "host": "5db857ddc0a96aa20ebabf96",
    "url": "https://m.baomoi.com/xa-hoi.epi",
    "title": "baomoi xã hội",
    "__v": 0,
    "category": [
      "5db861a96e81b1a7090ba4cb"
    ]
  }
}
*/
const save_1_article = (article, callback) => {
	if (!article)  return callback();
	if (!article.title || article.title == '')  return callback();
	if (!article.link || article.link == '')  return callback();

	let find = {
		link: article.link
	}

	let update = {
		title: article.title,
		publishDate: moment(article.publishDate).toDate(),
		link: article.link,
		description: article.description,

		category: article._categoryBaoMoi.category,
		rawHtml: article.rawHtml,
		heroImage: article.heroImage,
		linkBaoMoi: article.linkBaoMoi
	}

  utils.upsertSafe(Feed, find, update, (err, result) => {
		if (err) {
			console.log(`save_1_article err= ${err}`);
			return callback(null, result);
		}

		console.log(`save_1_article done link= ${update.link}`);

		let objDecay = {
			slug: result.slug,
			link: result.link,

			title: result.title,
			publishDate: result.publishDate,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		};

		if (result.heroImage) objDecay.heroImage = result.heroImage;
		if (result.description) objDecay.description = result.description;
		if (result.rawHtml) objDecay.rawHtml = result.rawHtml;
		if (result.topic) objDecay.topic = result.topic;
		if (result.category) objDecay.category = result.category;
		if (result.linkBaoMoi) objDecay.linkBaoMoi = result.linkBaoMoi;

		decayMongo.decay({ link: 1 }, objDecay, (err, resultDecay) => {
			console.log('resultDecay err=', err, JSON.stringify(resultDecay));
		});

		return callback(null, result);
	})
}

const procOneCategory = (category, callback) => {
	console.log(`procOneCategory category= ${JSON.stringify(category)}`);

	let link = category.url;

	async.timesLimit(PAGE, 1, (n, next) => {
		let page = n + 1;
		let linkPage = link.replace('.epi', `/trang${page}.epi`);
	  console.log('linkPage', linkPage);

	  engine.getFeedFromCategoryUrl(linkPage, (err, feeds) => {
	  	// console.log('done err=', err);
	  	if (err || !feeds || feeds.length == 0) return next(null, null);

	  	feeds = feeds.map((f) => {
	  		f._categoryBaoMoi = category;
	  		return f;
	  	});

	  	async.eachLimit(feeds, 1, save_1_article, next);

	  	// return next(null);
	  })
	}, callback);
}

const processAllCategories = (callback) => {
	async.eachLimit(listCategory, 1, procOneCategory, callback);
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		getBaomoiCategory,
		processAllCategories
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		return callback && callback();
	});
}

const startWorker = () => {
	NODE_ENV != 'production' && console.clear();

	console.log('start worker ... NODE_ENV=', NODE_ENV);
	console.time('run-worker');

	async.parallel({
		init_decay: (next) => {
			decayMongo.init(next);
		},
		start_keystone: (next) => {
			keystone.start(next)
		},
		init_redis: redisService.init
	}, (err, result) => {
		if (err) {
			console.log('start keystone fail, err=', err);
			return;
		}

		console.log('start done ...');
		runProcess(stopWorker);
	})
}

const stopWorker = () => {
	async.parallel({
		close_redis: (next) => {
			redisService.close(next);
		},

		close_mongo: (next) => {
			keystone.closeDatabaseConnection((err, result) => {
				keystone.httpServer.close();
				setTimeout(next, 500);
			});
		},

		close_decay: (next) => {
			setTimeout(decayMongo.close, 1e3, next);
			// decayMongo.close(next);
		}
	}, (err, result) => {
		console.log('stop worker done');
		console.timeEnd('run-worker');

		if(NODE_ENV != 'production') return process.exit(0);

		if (moment().diff(START, 'm') >= 30) {
			return process.exit(0);
		}

		setTimeout(startWorker, 3e3);
	});
}

// run
startWorker();
