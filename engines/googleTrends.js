const moment = require('moment');

const debug = require('debug')('GoogleTrends');
const url = require('url');
const querystring = require('querystring');

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const request = require('request').defaults({
	headers: {
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
		'sec-fetch-site': 'same-origin',
		'sec-fetch-mode': 'cors',
		'accept': 'application/json, text/plain, */*',
		'authority': 'trends.google.com.vn',
	},
  jar: true
})

let cookie = request.jar();

const fetchRss = require('./fetchRss');

const safeParse = (text) => {
	if (typeof text === 'object') return text;

	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

const trendsDefaultOpts = {
	// hl: 'vi-VN',
	hl: 'en-US',
	tz: '-420',
  geo: 'VN'
}

/*
{
  "default": {
    "trendingSearchesDays": [
      {
        "date": "20200109",
        "formattedDate": "Thursday, January 9, 2020",
        "trendingSearches": [
          {
            "title": {
              "query": "Đồng Tâm",
              "exploreLink": "/trends/explore?q=%C4%90%E1%BB%93ng+T%C3%A2m&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "20K+",
            "relatedQueries": [
              {
                "query": "vụ đồng tâm",
                "exploreLink": "/trends/explore?q=v%E1%BB%A5+%C4%91%E1%BB%93ng+t%C3%A2m&date=now+7-d&geo=VN"
              },
              {
                "query": "đồng tâm miếu môn",
                "exploreLink": "/trends/explore?q=%C4%91%E1%BB%93ng+t%C3%A2m+mi%E1%BA%BFu+m%C3%B4n&date=now+7-d&geo=VN"
              },
              {
                "query": "đồng tâm mỹ đức",
                "exploreLink": "/trends/explore?q=%C4%91%E1%BB%93ng+t%C3%A2m+m%E1%BB%B9+%C4%91%E1%BB%A9c&date=now+7-d&geo=VN"
              },
              {
                "query": "dong tam",
                "exploreLink": "/trends/explore?q=dong+tam&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://vietnamnet.vn/vn/thoi-su/tinh-hinh-dong-tam-3-chien-si-cong-an-hy-sinh-1-doi-tuong-chong-doi-chet-607765.html",
              "source": "Vietnamnet.vn",
              "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcSDfpGiCjGan6krz1bZg_u5MLbRknCkCPUbAT3SoQ6Im3NqiR1_HsydGpGzf0j8x1-9Jl9rCEBm"
            },
            "articles": [
              {
                "title": "Tình hình Đồng Tâm: 3 chiến sĩ công an hy sinh, 1 đối tượng chống ...",
                "timeAgo": "2h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/thoi-su/tinh-hinh-dong-tam-3-chien-si-cong-an-hy-sinh-1-doi-tuong-chong-doi-chet-607765.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcSDfpGiCjGan6krz1bZg_u5MLbRknCkCPUbAT3SoQ6Im3NqiR1_HsydGpGzf0j8x1-9Jl9rCEBm"
                },
                "url": "https://vietnamnet.vn/vn/thoi-su/tinh-hinh-dong-tam-3-chien-si-cong-an-hy-sinh-1-doi-tuong-chong-doi-chet-607765.html",
                "snippet": "Vụ Đồng Tâm - Miếu Môn: 3 chiến sĩ công an hy sinh, 1 đối tượng chống đối chết. Bộ Công phát thông báo về vụ gây rối trật tự công cộng. Sân bay miếu môn."
              },
              {
                "title": "Ba cảnh sát hy sinh trong vụ đụng độ ở Đồng Tâm",
                "timeAgo": "2h ago",
                "source": "VnExpress",
                "url": "https://vnexpress.net/thoi-su/ba-canh-sat-hy-sinh-trong-vu-dung-do-o-dong-tam-4039593.html",
                "snippet": "Ba cảnh sát hy sinh, một người dân chết và một người bị thương ở Đồng Tâm, Bộ Công an thông báo sáng 9/1. - VnExpress."
              },
              {
                "title": "Bộ Công an thông tin về tình hình ở xã Đồng Tâm",
                "timeAgo": "2h ago",
                "source": "Tuổi Trẻ Online",
                "url": "https://tuoitre.vn/bo-cong-an-thong-tin-ve-tinh-hinh-o-xa-dong-tam-20200109083527395.htm",
                "snippet": "TTO - Cổng thông tin điện tử của Bộ Công an vừa đưa thông báo chính thức của Bộ về tình hình tại xã Đồng Tâm, huyện Mỹ Đức, TP Hà Nội."
              },
              {
                "title": "Ba chiến sỹ Công an hy sinh ở Đồng Tâm",
                "timeAgo": "1h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/thoi-su/ba-chien-sy-cong-an-hy-sinh-o-dong-tam-1169993.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcT-8riwHZSsXhBwZDcvEyb8KXVLM-x6LeTURHwCDi-_lrRHhrAz9TG6WhCbaEmxfDYcYq3Uzbsv"
                },
                "url": "https://thanhnien.vn/thoi-su/ba-chien-sy-cong-an-hy-sinh-o-dong-tam-1169993.html",
                "snippet": "Vào rạng sáng 9.1, một vụ chống người thi hành công vụ nghiêm trọng đã xảy ra tại khu vực xã Đồng Tâm, huyên Mỹ Đức, TP.Hà Nội khiến 5 người thương&nbsp;..."
              },
              {
                "title": "Bộ Công an: 3 chiến sĩ công an hy sinh trong vụ việc tại Đồng Tâm",
                "timeAgo": "2h ago",
                "source": "Dân Trí",
                "image": {
                  "newsUrl": "https://dantri.com.vn/xa-hoi/bo-cong-an-3-chien-si-cong-an-hy-sinh-trong-vu-viec-tai-dong-tam-20200109115105022.htm",
                  "source": "Dân Trí",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQQ7kgov6-IuOrm8ExMTCrmyT5tL8mJM9_LqCuCvzm35gNLlENJG1uJDgFxwYTCpE9TofoU5-UG"
                },
                "url": "https://dantri.com.vn/xa-hoi/bo-cong-an-3-chien-si-cong-an-hy-sinh-trong-vu-viec-tai-dong-tam-20200109115105022.htm",
                "snippet": "(Dân trí) - Trưa nay (9/1), Bộ Công an đã có thông tin chính thức liên quan đến sự việc gây rối trật tự công cộng và chống người thi hành công vụ tại xã Đồng&nbsp;..."
              },
              {
                "title": "Vụ tấn công công an ở Đồng Tâm: 3 chiến sĩ hy sinh",
                "timeAgo": "2h ago",
                "source": "Báo Lao Động",
                "image": {
                  "newsUrl": "https://laodong.vn/thoi-su/vu-tan-cong-cong-an-o-dong-tam-3-chien-si-hy-sinh-777487.ldo",
                  "source": "Báo Lao Động",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcT7vcs6aHG2_VIUKW6MP9faVDbjnslnXHastKbxgrO9cbrKGkWTGJYHuU0fL5ropxQiUi2ZTjj8"
                },
                "url": "https://laodong.vn/thoi-su/vu-tan-cong-cong-an-o-dong-tam-3-chien-si-hy-sinh-777487.ldo",
                "snippet": "Bộ Công an chính thức có thông tin: Sáng ngày 9.1.2020, một số đối tượng có hành vi chống đối, sử dụng lựu đạn, bom xăng, dao phóng... tấn công lực lượng&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=%C4%90%E1%BB%93ng+T%C3%A2m#%C4%90%E1%BB%93ng%20T%C3%A2m"
          },
          {
            "title": {
              "query": "Real Madrid",
              "exploreLink": "/trends/explore?q=Real+Madrid&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "10K+",
            "relatedQueries": [
              {
                "query": "Real",
                "exploreLink": "/trends/explore?q=Real&date=now+7-d&geo=VN"
              },
              {
                "query": "siêu cúp tây ban nha",
                "exploreLink": "/trends/explore?q=si%C3%AAu+c%C3%BAp+t%C3%A2y+ban+nha&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://vietnamnet.vn/vn/the-thao/bong-da-quoc-te/bong-da-tay-ban-nha/ket-qua-valencia-1-3-real-madrid-hen-barca-o-chung-ket-sieu-cup-tbn-607651.html",
              "source": "Vietnamnet.vn",
              "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcRcJ68sQqKj0Dmw78LwplX4Mger3BaBaGfGPKYcwy1oqR3ttLc2XE0PjbIWGzuXs9NiBUT7v0mL"
            },
            "articles": [
              {
                "title": "Kết quả Valencia 1-3 Real Madrid: Hẹn Barca ở chung kết Siêu cúp ...",
                "timeAgo": "7h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/the-thao/bong-da-quoc-te/bong-da-tay-ban-nha/ket-qua-valencia-1-3-real-madrid-hen-barca-o-chung-ket-sieu-cup-tbn-607651.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcRcJ68sQqKj0Dmw78LwplX4Mger3BaBaGfGPKYcwy1oqR3ttLc2XE0PjbIWGzuXs9NiBUT7v0mL"
                },
                "url": "https://vietnamnet.vn/vn/the-thao/bong-da-quoc-te/bong-da-tay-ban-nha/ket-qua-valencia-1-3-real-madrid-hen-barca-o-chung-ket-sieu-cup-tbn-607651.html",
                "snippet": "Valencia 1-3 Real Madrid: Real Madrid có chiến thắng ấn tượng 3-1 ngay trên sân của Valencia để giành quyền vào chung kết Siêu cúp Tây Ban Nha, gặp chờ&nbsp;..."
              },
              {
                "title": "Đả bại Valencia 3-1, Real Madrid giành vé chơi trận chung kết Siêu ...",
                "timeAgo": "4h ago",
                "source": "Báo Lao Động",
                "image": {
                  "newsUrl": "https://laodong.vn/bong-da-quoc-te/da-bai-valencia-3-1-real-madrid-gianh-ve-choi-tran-chung-ket-sieu-cup-777426.ldo",
                  "source": "Báo Lao Động",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSH3ifxUvkZNkMJBDE5PEmUoIxImNc1Tt-wuNw9PBvLKZDUjtNhgTxAHqGdDW4H5rxfUwt1Yq8v"
                },
                "url": "https://laodong.vn/bong-da-quoc-te/da-bai-valencia-3-1-real-madrid-gianh-ve-choi-tran-chung-ket-sieu-cup-777426.ldo",
                "snippet": "Kroos (15&#39;), Isco (39&#39;), Modric (65&#39;) thay nhau lập công đã giúp Real đánh bại Valencia 3-1, giành vé vào chơi trận chung kết Siêu cúp Tây Ban Nha."
              },
              {
                "title": "Real Madrid đánh úp Valencia, giành vé vào chung kết Siêu cúp",
                "timeAgo": "6h ago",
                "source": "Người Lao Động",
                "image": {
                  "newsUrl": "http://nld.com.vn/the-thao/real-madrid-danh-up-valencia-gianh-ve-vao-chung-ket-sieu-cup-20200109070105183.htm",
                  "source": "Người Lao Động",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcRRZzHJ_wvsC8-1h68UvlY136imxSIp3WtfYGR3Y94ShujFBSHThyYGAHvHlkS-DlbMjLgfOCBy"
                },
                "url": "http://nld.com.vn/the-thao/real-madrid-danh-up-valencia-gianh-ve-vao-chung-ket-sieu-cup-20200109070105183.htm",
                "snippet": "(NLĐO) – Real Madrid với lực lượng hùng mạnh đã dễ dàng đánh bại &quot;bầy dơi&quot; Valencia để giành tấm vé đầu tiên dự trận chung kết Siêu cúp Tây Ban Nha&nbsp;..."
              },
              {
                "title": "Kết quả bóng đá hôm nay. Valencia 1-3 Real Madrid. Siêu phẩm ...",
                "timeAgo": "6h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/bong-da-tay-ban-nha/toni-kroos-lap-sieu-pham-sut-phat-goc-real-madrid-vao-chung-ket-sieu-cup-tbn-2020-n20200109073139521.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcS6S5Ek8XZHR-uyzZIkTM9sD8FRMrCuM_9TRPENoIVzlsO9Yr_mGyd89AqlU7sfJ8Ym3AcbpuQn"
                },
                "url": "https://thethaovanhoa.vn/bong-da-tay-ban-nha/toni-kroos-lap-sieu-pham-sut-phat-goc-real-madrid-vao-chung-ket-sieu-cup-tbn-2020-n20200109073139521.htm",
                "snippet": "(Thethaovanhoa.vn) - Toni Kroos, Isco và Luka Modric đã cùng nhau ghi bàn để giúp Real Madrid vượt qua Valencia với tỷ số 3-1 trong trận bán kết Siêu cúp&nbsp;..."
              },
              {
                "title": "Real Madrid chờ tái đấu “Siêu kinh điển” với Barcelona ở Ả Rập Saudi",
                "timeAgo": "5h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/the-thao/bong-da-quoc-te/real-madrid-cho-tai-dau-sieu-kinh-dien-voi-barcelona-o-a-rap-saudi-109920.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcQfswBinpE-94CqF7JXMZjz__9A8m-738MgDuAT0zOQx3FnhC0S2_o9teQ8KZji48M1SMpmJAlk"
                },
                "url": "https://thanhnien.vn/the-thao/bong-da-quoc-te/real-madrid-cho-tai-dau-sieu-kinh-dien-voi-barcelona-o-a-rap-saudi-109920.html",
                "snippet": "Real Madrid đã vượt qua trở ngại đầu tiên để hướng đến thêm danh hiệu dưới thời HLV Zinadine Zidane khi vượt qua Valencia với tỷ số 3-1 ở trận bán kết Siêu&nbsp;..."
              },
              {
                "title": "Real Madrid giành vé vào chung kết Siêu cúp Tây Ban Nha",
                "timeAgo": "8h ago",
                "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thethao247.vn/317-ket-qua-valencia-vs-real-madrid-sieu-cup-tay-ban-nha-2020-d196395.html",
                  "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRZ12AJ6up5Moyftc2dhZZHp_aII5YRc3wOcg7uiYxNV8IqQ1dePpiJwIZt_WX_zAKb6u5HMx6t"
                },
                "url": "https://thethao247.vn/317-ket-qua-valencia-vs-real-madrid-sieu-cup-tay-ban-nha-2020-d196395.html",
                "snippet": "Real Madrid nhập cuộc đầy tự tin khi bước vào trận đấu với Valencia tại bán kết Siêu cúp Tây Ban Nha. Chỉ mất 15 phút, đội bóng của HLV Zidane đã vươn lên&nbsp;..."
              },
              {
                "title": "Trực tiếp bóng đá Real Madrid - Valencia: Niềm an ủi trên chấm ...",
                "timeAgo": "9h ago",
                "source": "Tin tức 24h",
                "image": {
                  "newsUrl": "https://www.24h.com.vn/bong-da/truc-tiep-bong-da-real-madrid-valencia-kho-khan-cho-thay-tro-zidane-c48a1115134.html",
                  "source": "Tin tức 24h",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcQ9hCxa35rSSsD4uhSlwBh66AtJLLiwNGVQUivXpUXBnr4BUCUGJhWEs0MVKOhmnx-BlOMKsON0"
                },
                "url": "https://www.24h.com.vn/bong-da/truc-tiep-bong-da-real-madrid-valencia-kho-khan-cho-thay-tro-zidane-c48a1115134.html",
                "snippet": "Trực tiếp bóng đá, Real Madrid – Valencia, bán kết Siêu cúp Tây Ban Nha) “Những chú dơi“ có bàn danh dự ở phút bù giờ nhờ một tình huống hưởng phạt đền&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Real+Madrid#Real%20Madrid"
          },
          {
            "title": {
              "query": "Clip Văn Mai Hương camera",
              "exploreLink": "/trends/explore?q=Clip+V%C4%83n+Mai+H%C6%B0%C6%A1ng+camera&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "10K+",
            "relatedQueries": [
              {
                "query": "văn mai hương lộ clip camera",
                "exploreLink": "/trends/explore?q=v%C4%83n+mai+h%C6%B0%C6%A1ng+l%E1%BB%99+clip+camera&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thanhnien.vn/van-hoa/van-mai-huong-lan-dau-len-tieng-sau-on-ao-lo-clip-nong-1169825.html",
              "source": "Báo Thanh Niên",
              "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcR8KG_J78hBSs5bpB72PDd3xDdEIocA8PFfTRJq-rG6cK9_9GiRdSHj8RkNZi-JjTOSixj53n0A"
            },
            "articles": [
              {
                "title": "Văn Mai Hương lần đầu lên tiếng sau ồn ào lộ clip nóng",
                "timeAgo": "7h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/van-hoa/van-mai-huong-lan-dau-len-tieng-sau-on-ao-lo-clip-nong-1169825.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcR8KG_J78hBSs5bpB72PDd3xDdEIocA8PFfTRJq-rG6cK9_9GiRdSHj8RkNZi-JjTOSixj53n0A"
                },
                "url": "https://thanhnien.vn/van-hoa/van-mai-huong-lan-dau-len-tieng-sau-on-ao-lo-clip-nong-1169825.html",
                "snippet": "Sau thời gian vướng ồn ào liên quan đến việc lộ clip nhạy cảm, mới đây, ca sĩ Văn Mai Hương đã có những chia sẻ đầu tiên trên trang cá nhân."
              },
              {
                "title": "Văn Mai Hương lần đầu chia sẻ sau vụ lộ clip nhạy cảm",
                "timeAgo": "16h ago",
                "source": "Zing.vn",
                "image": {
                  "newsUrl": "https://news.zing.vn/van-mai-huong-lan-dau-chia-se-sau-vu-lo-clip-nhay-cam-post1034055.html",
                  "source": "Zing.vn",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcSFJHzWNcBftzg3M7o7q-sGdeHpq4K5AWdxwZxG3sVWjuDDoTkW_Z4v1johnKFCl9VYrW_YUR1y"
                },
                "url": "https://news.zing.vn/van-mai-huong-lan-dau-chia-se-sau-vu-lo-clip-nhay-cam-post1034055.html",
                "snippet": "Sau nhiều ngày im lặng, ca sĩ Văn Mai Hương đã có những chia sẻ đầu tiên trên trang cá nhân. Cô tâm sự bản thân mạnh mẽ hơn sau biến cố."
              },
              {
                "title": "Văn Mai Hương lần đầu chia sẻ sau sự cố bị hack camera lộ clip ...",
                "timeAgo": "17h ago",
                "source": "Kênh 14",
                "image": {
                  "newsUrl": "http://kenh14.vn/van-mai-huong-lan-dau-chia-se-sau-su-co-bi-hack-camera-lo-clip-nong-cam-on-nhung-gi-da-qua-de-toi-manh-me-hon-20200108204706723.chn",
                  "source": "Kênh 14",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTSWUYLaMQ-KAiE2_YE4mm5Q-7RFMM8RgJQOzUq0tXPYh9djGaV0nDQ0futffCd4L7WJa7qKN9U"
                },
                "url": "http://kenh14.vn/van-mai-huong-lan-dau-chia-se-sau-su-co-bi-hack-camera-lo-clip-nong-cam-on-nhung-gi-da-qua-de-toi-manh-me-hon-20200108204706723.chn",
                "snippet": "Đây là lần đầu tiên Văn Mai Hương có chia sẻ sau sự cố cách đây không lâu."
              },
              {
                "title": "Văn Mai Hương lần đầu trải lòng sau vụ lộ 5 video nhạy cảm",
                "timeAgo": "4h ago",
                "source": "VnExpress iOne",
                "image": {
                  "newsUrl": "https://ione.vnexpress.net/tin-tuc/sao/viet-nam/van-mai-huong-lan-dau-trai-long-sau-vu-lo-5-video-nhay-cam-4039417.html",
                  "source": "VnExpress iOne",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcQ_46GwOcKqXR6oPEo8c3fEHkaUvJjMHudIwBYOjqhojxF_YGYSoH-WBfrTsbFHv6lrS-RjyGzo"
                },
                "url": "https://ione.vnexpress.net/tin-tuc/sao/viet-nam/van-mai-huong-lan-dau-trai-long-sau-vu-lo-5-video-nhay-cam-4039417.html",
                "snippet": "&#39;Cảm ơn những gì đã qua để tôi được sống tiếp, mạnh mẽ hơn&#39;, nữ ca sĩ chia sẻ."
              },
              {
                "title": "Văn Mai Hương lần đầu chia sẻ sau ồn ào lộ clip nhạy cảm",
                "timeAgo": "4h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/giai-tri/the-gioi-sao/van-mai-huong-lan-dau-chia-se-sau-on-ao-lo-clip-nhay-cam-607684.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQAYsOK6uNuQm3PofFW3-8PgA0Ixmx8zxEGm-hfys9tiZla61gCTU25Akgoq5f3meUkuSYT5Own"
                },
                "url": "https://vietnamnet.vn/vn/giai-tri/the-gioi-sao/van-mai-huong-lan-dau-chia-se-sau-on-ao-lo-clip-nhay-cam-607684.html",
                "snippet": "Sau nhiều ngày im lặng, đây là những chia sẻ đầu tiên của nữ ca sĩ trên trang cá nhân. Cô động viên bản thân phải mạnh mẽ hơn sau biến cố."
              },
              {
                "title": "Sau ồn ào lộ clip nhạy cảm, Văn Mai Hương lần đầu chia sẻ gây bất ...",
                "timeAgo": "7h ago",
                "source": "VTC News",
                "image": {
                  "newsUrl": "https://vtc.vn/sao-viet/sau-on-ao-lo-clip-nhay-cam-van-mai-huong-lan-dau-chia-se-gay-bat-ngo-ar521068.html",
                  "source": "VTC News",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQnBNRZyZzF4H-MMWqadJxFJlWzv73ulDAP1BXZMGMHv26Y3XcmID0I8ndWi8p0-eoJwk7qotZM"
                },
                "url": "https://vtc.vn/sao-viet/sau-on-ao-lo-clip-nhay-cam-van-mai-huong-lan-dau-chia-se-gay-bat-ngo-ar521068.html",
                "snippet": "Nữ ca sĩ tâm sự, cô biết ơn những gì mình từng trải qua để bản thân có thể mạnh mẽ hơn."
              },
              {
                "title": "Văn Mai Hương lần đầu trải lòng sau sự cố bị hack camera, phát tán ...",
                "timeAgo": "59m ago",
                "source": "Eva.vn",
                "image": {
                  "newsUrl": "https://eva.vn/lang-sao/van-mai-huong-lan-dau-trai-long-sau-su-co-bi-hack-camera-phat-tan-clip-nhay-cam-c20a418561.html",
                  "source": "Eva.vn",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSxyt1d6h3Jf3objwODzN4A3od2v0xDSs88A1u5zj5jEsxt_4V22D-1BmNzDK_gwS2jyEIvWZwc"
                },
                "url": "https://eva.vn/lang-sao/van-mai-huong-lan-dau-trai-long-sau-su-co-bi-hack-camera-phat-tan-clip-nhay-cam-c20a418561.html",
                "snippet": "Văn Mai Hương có chia sẻ sâu sắc sau sự cố trên trời rơi xuống gây ồn ào cuối năm 2019.-Ngôi sao."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Clip+V%C4%83n+Mai+H%C6%B0%C6%A1ng+camera#Clip%20V%C4%83n%20Mai%20H%C6%B0%C6%A1ng%20camera"
          },
          {
            "title": {
              "query": "Chó Pitbull",
              "exploreLink": "/trends/explore?q=Ch%C3%B3+Pitbull&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "5K+",
            "relatedQueries": [
              {
                "query": "Pitbull",
                "exploreLink": "/trends/explore?q=Pitbull&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thanhnien.vn/thoi-su/kinh-hoang-cho-pitbull-tuot-xich-can-nat-tay-nguoi-phu-nu-79-tuoi-o-quang-nam-1169900.html",
              "source": "Báo Thanh Niên",
              "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcTgkP-fAsIhJbS3Nhk2CVC-mEb79MH5yJHa1Ks1Yiw2nv2VPIcn3lz4J9QyVBRVeDIqib2o4tPr"
            },
            "articles": [
              {
                "title": "Kinh hoàng chó Pitbull tuột xích, cắn nát tay người phụ nữ 79 tuổi ở ...",
                "timeAgo": "5h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/thoi-su/kinh-hoang-cho-pitbull-tuot-xich-can-nat-tay-nguoi-phu-nu-79-tuoi-o-quang-nam-1169900.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcTgkP-fAsIhJbS3Nhk2CVC-mEb79MH5yJHa1Ks1Yiw2nv2VPIcn3lz4J9QyVBRVeDIqib2o4tPr"
                },
                "url": "https://thanhnien.vn/thoi-su/kinh-hoang-cho-pitbull-tuot-xich-can-nat-tay-nguoi-phu-nu-79-tuoi-o-quang-nam-1169900.html",
                "snippet": "Đang đi đường, một người phụ nữ 79 tuổi ở Quảng Nam bị con chó Pitbull tuột xích hung tợn lao tới cắn xé khiến cánh tay của nạn nhân bị nát."
              },
              {
                "title": "Chó Pitbull tuột xích, xông ra cắn nát tay người phụ nữ ở Quảng Nam",
                "timeAgo": "8h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/thoi-su/cho-pitbull-tuot-xich-xong-ra-can-nat-tay-nguoi-phu-nu-o-quang-nam-607644.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcRFyHRh_RYsRfjZ7AUsgDuIdobePAo5jOe5eD1mppDu7hhCbiovSJ3ktFWxe4P0fDrMg6MOX7QK"
                },
                "url": "https://vietnamnet.vn/vn/thoi-su/cho-pitbull-tuot-xich-xong-ra-can-nat-tay-nguoi-phu-nu-o-quang-nam-607644.html",
                "snippet": "Tối nay, Công an xã Điện Thắng Bắc (thị xã Điện Bàn, Quảng Nam) cho biết, trên địa bàn vừa xảy ra việc 1 phụ nữ bị chó Pitbull xông ra cắn nát tay phải."
              },
              {
                "title": "Một phụ nữ bị chó Pitbull cắn nát tay",
                "timeAgo": "17h ago",
                "source": "Zing.vn",
                "image": {
                  "newsUrl": "https://news.zing.vn/mot-phu-nu-bi-cho-pitbull-can-nat-tay-post1034029.html",
                  "source": "Zing.vn",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTAEih9s3HWTWwYJJ7DjN7rK_UkK-L76baXxUiVoCE7QZZbYfe6IOw72M6cbaHfQaAvgKhS8ThK"
                },
                "url": "https://news.zing.vn/mot-phu-nu-bi-cho-pitbull-can-nat-tay-post1034029.html",
                "snippet": "Một phụ nữ ở Quảng Nam đang đi trên đường thì bị con chó Pitbull từ trong nhà lao ra cắn dập nát tay trái, đa chấn thương, phải nhập viện cấp cứu."
              },
              {
                "title": "Kinh hoàng chó Pitbull chạy ra đường cắn nát tay người",
                "timeAgo": "4h ago",
                "source": "Bao Cong an (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "http://congan.com.vn/doi-song/kinh-hoang-cho-chay-ra-duong-can-nat-tay-nguoi-di-duong_85938.html",
                  "source": "Bao Cong an (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcRzGetYfCf6IrWfKPULbLvElYnx2rWEMfW8lr45keAg_75nduHUCnSfnM8l9cmWCKgFAVYbjh1O"
                },
                "url": "http://congan.com.vn/doi-song/kinh-hoang-cho-chay-ra-duong-can-nat-tay-nguoi-di-duong_85938.html",
                "snippet": "(CAO) Tối 8-1-2020, Công an xã Điện Thắng Bắc, thị xã Điện Bàn, tỉnh Quảng Nam xác nhận, có sự việc chó Pitbull xông vào cắn người đi đường."
              },
              {
                "title": "Quảng Nam: Chó Pitbull lao ra cắn nát tay người đi đường",
                "timeAgo": "6h ago",
                "source": "Báo Lao Động",
                "image": {
                  "newsUrl": "https://laodong.vn/xa-hoi/quang-nam-cho-pitbull-lao-ra-can-nat-tay-nguoi-di-duong-777387.ldo",
                  "source": "Báo Lao Động",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRlrduZ0P_RsZ48XUjfn9BJIlO0gvyt3Csiq7rdxA2pjFFRY2mKYbIVmTE-0YxuNwrQMlEbvKR-"
                },
                "url": "https://laodong.vn/xa-hoi/quang-nam-cho-pitbull-lao-ra-can-nat-tay-nguoi-di-duong-777387.ldo",
                "snippet": "Trong lúc chủ vắng nhà, xích bị tuột chó Pitbull lao vào cắn nát tay người đi đường. Công an xã Điện Thắng Bắc (thị xã Điện Bàn, tỉnh Quảng Nam) cho biết, trên&nbsp;..."
              },
              {
                "title": "Kinh hoàng cảnh chó pitbull tấn công làm một phụ nữ dập nát cánh tay",
                "timeAgo": "1h ago",
                "source": "Tuổi Trẻ Online",
                "url": "https://tuoitre.vn/kinh-hoang-canh-cho-pitbull-tan-cong-lam-mot-phu-nu-dap-nat-canh-tay-20200109121322326.htm",
                "snippet": "TTO - Sáng 9-1, bác sĩ Nguyễn Thành Phương - phó giám đốc Bệnh viện Đa khoa Vĩnh Đức (thị xã Điện Bàn, tỉnh Quảng Nam) - cho biết đã chuyển nạn nhân bị&nbsp;..."
              },
              {
                "title": "Chó Pitbull cắn nát tay người đi đường",
                "timeAgo": "6h ago",
                "source": "BaoDatViet",
                "image": {
                  "newsUrl": "https://baodatviet.vn/doi-song/suc-khoe/cho-pitbull-chay-xoc-ra-can-nat-tay-nguoi-di-duong-3394839/",
                  "source": "BaoDatViet",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcT78Qi5pb9o_DKWHrP-aWH3b-K0d63KxLNkajjIKCmU83TUIHA8pECIRc2gB64I6Hfdol2XAXm1"
                },
                "url": "https://baodatviet.vn/doi-song/suc-khoe/cho-pitbull-chay-xoc-ra-can-nat-tay-nguoi-di-duong-3394839/",
                "snippet": "Con chó Pitbull bất ngờ chạy xộc ra cổng, xông vào cắn một người phụ nữ đứng tuổi."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Ch%C3%B3+Pitbull#Ch%C3%B3%20Pitbull"
          },
          {
            "title": {
              "query": "PSG",
              "exploreLink": "/trends/explore?q=PSG&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "5K+",
            "relatedQueries": [],
            "image": {
              "newsUrl": "https://www.24h.com.vn/bong-da/video-highlight-tran-psg-st-etienne-dai-tiec-7-ban-ruc-ro-neymar-icardi-c48a1115243.html",
              "source": "Tin tức 24h",
              "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcQR6Ok62DH7gzzr37vJcq2m3L_nB3K1a5hz1BNZ2orV5tHoFIdXtcKOXS1Pb9K3vry8bdGO9Ika"
            },
            "articles": [
              {
                "title": "Video highlight trận PSG - St. Etienne: Đại tiệc 7 bàn, rực rỡ Neymar ...",
                "timeAgo": "5h ago",
                "source": "Tin tức 24h",
                "image": {
                  "newsUrl": "https://www.24h.com.vn/bong-da/video-highlight-tran-psg-st-etienne-dai-tiec-7-ban-ruc-ro-neymar-icardi-c48a1115243.html",
                  "source": "Tin tức 24h",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcQR6Ok62DH7gzzr37vJcq2m3L_nB3K1a5hz1BNZ2orV5tHoFIdXtcKOXS1Pb9K3vry8bdGO9Ika"
                },
                "url": "https://www.24h.com.vn/bong-da/video-highlight-tran-psg-st-etienne-dai-tiec-7-ban-ruc-ro-neymar-icardi-c48a1115243.html",
                "snippet": "Video bóng đá, kết quả bóng đá, PSG - St. Etienne, Cúp Liên đoàn Pháp) Đội bóng thành Paris quyết tâm hướng đến chiến thắng để tiếp đà cho một mùa giải&nbsp;..."
              },
              {
                "title": "PSG thắng hủy diệt trong ngày ngôi sao gốc Việt nổ súng",
                "timeAgo": "7h ago",
                "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thethao247.vn/317-psg-thang-huy-diet-trong-ngay-ngoi-sao-goc-viet-no-sung-d196481.html",
                  "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQ1MD64zu-f8J3iVCgt9_pb5qgfr8iEIqiBZ7jiXPLA9M_B8mFM2MAPumsPzTb-R-cSlMBWWOz0"
                },
                "url": "https://thethao247.vn/317-psg-thang-huy-diet-trong-ngay-ngoi-sao-goc-viet-no-sung-d196481.html",
                "snippet": "PSG đã dội &#39;cơn mưa&#39; bàn thắng vào lưới đối thủ tội nghiệp Saint-Etienne trong trận đấu tại vòng tứ kết Cúp Liên đoàn Pháp."
              },
              {
                "title": "PSG 6-1 St.Etienne: Icardi lập hattrick, PSG thắng kiểu tennis ở cúp ...",
                "timeAgo": "6h ago",
                "source": "Bóng đá 24h",
                "image": {
                  "newsUrl": "https://bongda24h.vn/video/ban-thang-ket-qua-psg-vs-stetienne-61-331-241427.html",
                  "source": "Bóng đá 24h",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcTCj_9-rgRYv62Jvy1dSKD10XVcACdzsqzE5-hnrhE4lHycZPe6TnkCA0Q8zk09cWF-uFVSWnj0"
                },
                "url": "https://bongda24h.vn/video/ban-thang-ket-qua-psg-vs-stetienne-61-331-241427.html",
                "snippet": "Clip kết quả bóng đá PSG vs St.Etienne 6-1 trận đấu cúp Liên đoàn Pháp 2019/20. Tường thuật diễn biến chính, video bàn thắng highlights kết quả trận đấu&nbsp;..."
              },
              {
                "title": "Neymar tự tin PSG sẽ vô địch Champions League năm nay",
                "timeAgo": "15h ago",
                "source": "Bóng đá 24h",
                "image": {
                  "newsUrl": "https://bongda24h.vn/c1-champions-league/neymar-tin-psg-se-vo-dich-champions-league-488-241411.html",
                  "source": "Bóng đá 24h",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcT8RGEHu0XDqjXrQgtIuISRbhMxIwviugfhj4R2OzOMEeFaWI4fsF4JdIVJWmHnWo3CmDzndZMT"
                },
                "url": "https://bongda24h.vn/c1-champions-league/neymar-tin-psg-se-vo-dich-champions-league-488-241411.html",
                "snippet": "Neymar tự tin PSG sẽ vô địch Champions League năm nay."
              },
              {
                "title": "Kết quả PSG 6-1 Saint-Etienne: Icardi lập hat-trick đầu tiên cho PSG",
                "timeAgo": "6h ago",
                "source": "Bóng Đá +",
                "image": {
                  "newsUrl": "https://bongdaplus.vn/bong-da-phap/ket-qua-psg-6-1-saint-etienne-icardi-lap-hat-trick-dau-tien-cho-psg-2856682001.html",
                  "source": "Bóng Đá +",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcTnz4qv5F3RGHkZSrqxaSkzzKDLusflFc_vqb_jpInSwyIVMec578nVe92MymGrtpVTRNGFEvQ1"
                },
                "url": "https://bongdaplus.vn/bong-da-phap/ket-qua-psg-6-1-saint-etienne-icardi-lap-hat-trick-dau-tien-cho-psg-2856682001.html",
                "snippet": "Sau chiến thắng hủy diệt ở cúp quốc gia Pháp, PSG tiếp tục có thêm một màn dạo chơi nữa khi ghi vào lưới Saint-Etienne tới 6 bàn ở tứ kết cúp Liên đoàn,&nbsp;..."
              },
              {
                "title": "<b>PSG</b> 6-1 Saint-Etienne: Icardi lần đầu lập hat-trick",
                "timeAgo": "3h ago",
                "source": "Dân Trí",
                "image": {
                  "newsUrl": "https://m.dantri.com.vn/the-thao/psg-61-saint-etienne-icardi-lan-dau-lap-hattrick-20200109095640064.htm",
                  "source": "Dân Trí",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcQgfij0WUUYaU5UMhbyY8h9xJ_zobKGIZb6cBLduNHw2Ay4hXDsM5yGYaUGrdxN36bsEfByDPSe"
                },
                "url": "https://m.dantri.com.vn/the-thao/psg-61-saint-etienne-icardi-lan-dau-lap-hattrick-20200109095640064.htm",
                "snippet": "Cho đến trước giờ nghỉ, lần lượt Neymar và thủ môn Moulin phản lưới nhà giúp <b>PSG</b> dễ dàng dẫn 3-0. Hiệp 2 mới chính là sân khấu của Icardi khi anh ghi thêm 2 bàn nữa để hoàn tất cú hat-trick của mình. Icardi thực sự là bản hợp đồng cho mượn (từ Inter)&nbsp;..."
              },
              {
                "title": "Đáp ứng 1 yêu cầu, PSG sẽ khiến Barca ôm hận vụ Neymar",
                "timeAgo": "22h ago",
                "source": "Tin Thể Thao",
                "image": {
                  "newsUrl": "http://www.tinthethao.com.vn/dap-ung-1-yeu-cau-psg-se-khien-barca-om-han-vu-neymar-d565606.html",
                  "source": "Tin Thể Thao",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcRu7GxpIzQF9YJiot4ZfPNhYQuYkoKSWDf1X-ggIUVcE_FOANtKsqWDlTtFWihDqVFM_48C0pBm"
                },
                "url": "http://www.tinthethao.com.vn/dap-ung-1-yeu-cau-psg-se-khien-barca-om-han-vu-neymar-d565606.html",
                "snippet": "Paris Saint-Germain bất ngờ sáng cửa giữ chân Neymar ở lại câu lạc bộ."
              },
              {
                "title": "Mbappe suýt ghi bàn thắng để đời cho PSG trong ngày lập kỷ lục",
                "timeAgo": "6h ago",
                "source": "Web Thể Thao (Thể Thao 24h)",
                "image": {
                  "newsUrl": "https://webthethao.vn/bong-da-quoc-te/mbappe-suyt-ghi-ban-thang-de-doi-cho-psg-trong-ngay-lap-ky-luc-113273.htm",
                  "source": "Web Thể Thao (Thể Thao 24h)",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcS5dxvOfuwN8vheKDXLqeYaoCa6efZiEh9EDug8PKi2Rx-WaU1L_wbdCOmgkdUgcYGHRWGFUx0d"
                },
                "url": "https://webthethao.vn/bong-da-quoc-te/mbappe-suyt-ghi-ban-thang-de-doi-cho-psg-trong-ngay-lap-ky-luc-113273.htm",
                "snippet": "Kylian Mbappe suýt ghi một bàn thắng để đời cho PSG trong trận gặp Saint-Etienne nhưng anh vẫn san bằng kỷ lục của CLB."
              },
              {
                "title": "HLV PSG chốt tương lai của Cavani, nhiều ông lớn nuốt hận",
                "timeAgo": "19h ago",
                "source": "Tin Thể Thao",
                "image": {
                  "newsUrl": "http://www.tinthethao.com.vn/hlv-psg-chot-tuong-lai-cua-cavani-nhieu-ong-lon-nuot-han-d565625.html",
                  "source": "Tin Thể Thao",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQ84m6SLDUydzPMxOBRH1YAL6ZCb-VwCsfjkFIlCbKbg_3b0ZDjStLG5qFC3imOr9QGcSRu0ebU"
                },
                "url": "http://www.tinthethao.com.vn/hlv-psg-chot-tuong-lai-cua-cavani-nhieu-ong-lon-nuot-han-d565625.html",
                "snippet": "Mới đây, Thomas Tuchel vừa lên tiếng xác nhận tương lai của Edinson Cavani."
              },
              {
                "title": "Tiền đạo Edinson Cavani của PSG chuẩn bị gia nhập MU?",
                "timeAgo": "12h ago",
                "source": "Bóng đá 24h",
                "url": "https://bongda24h.vn/bong-da-anh/psg-bao-tin-cavani-cho-mu-172-241415.html",
                "snippet": "HLV Thomas Tuchel chia sẻ xoay quanh tương lai của tiền đạo người Uruguay, trong bối cảnh có thể ra đi ngay ở kỳ chuyển nhượng mùa đông tháng 1/2020&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=PSG#PSG"
          },
          {
            "title": {
              "query": "Thời tiết Tết nguyên đán",
              "exploreLink": "/trends/explore?q=Th%E1%BB%9Di+ti%E1%BA%BFt+T%E1%BA%BFt+nguy%C3%AAn+%C4%91%C3%A1n&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "2K+",
            "relatedQueries": [],
            "image": {
              "newsUrl": "https://thethaovanhoa.vn/xa-hoi/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-ret-dam-hay-nang-am-n20200109125353749.htm",
              "source": "Báo Thể thao & Văn hóa",
              "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcT_j15j03Z19Mv3yg4wLDwY6cQRKkFyNIXHCzzSaQDow3G_YDcCWMgwxKT9t-hX0oppRsKNLg6m"
            },
            "articles": [
              {
                "title": "Dự báo thời tiết Tết Nguyên đán 2020. Thời tiết Tết Nguyên đán ...",
                "timeAgo": "59m ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/xa-hoi/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-ret-dam-hay-nang-am-n20200109125353749.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcT_j15j03Z19Mv3yg4wLDwY6cQRKkFyNIXHCzzSaQDow3G_YDcCWMgwxKT9t-hX0oppRsKNLg6m"
                },
                "url": "https://thethaovanhoa.vn/xa-hoi/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-ret-dam-hay-nang-am-n20200109125353749.htm",
                "snippet": "(Thethaovanhoa.vn) - Thời kỳ nghỉ Tết Nguyên đán, nhiệt độ dự báo cao hơn trung bình nhiều năm từ 1-2 độ, rét đậm, rét hại nếu có cũng không dài hoặc chỉ&nbsp;..."
              },
              {
                "title": "Dự báo thời tiết Tết nguyên đán Canh Tý 2020: Miền Bắc có nơi rét ...",
                "timeAgo": "2h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/thoi-su/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-2020-mien-bac-co-noi-ret-dam-607621.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcR62B_S-AXq1RTb66B1wFjfYjHK_Xfroq_YGFR9jLMeE7F5bG-Fd2Gf_hydYKGbgyJC0Ju4KRsR"
                },
                "url": "https://vietnamnet.vn/vn/thoi-su/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-2020-mien-bac-co-noi-ret-dam-607621.html",
                "snippet": "Dự báo thời tiết Tết nguyên đán Canh Tý 2020: Không khí lạnh tràn về vào khoảng ngày 20-21/1 và cuối tháng, nhưng chỉ gây ra trời rét ở Bắc Bộ, vùng núi có&nbsp;..."
              },
              {
                "title": "Miền Bắc có thể đón nắng ấm dịp Tết Nguyên đán 2020",
                "timeAgo": "17h ago",
                "source": "Tinmoi.vn",
                "image": {
                  "newsUrl": "https://www.tinmoi.vn/mien-bac-co-the-don-nang-am-dip-tet-nguyen-dan-2020-011537754.html",
                  "source": "Tinmoi.vn",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSSG7yk7R-KKeLgC9dj7jOZRy07mfQDxXQSF6E0f6EHg3VhhDtnyEfIBvahRQ-rEG5JugH5xjdg"
                },
                "url": "https://www.tinmoi.vn/mien-bac-co-the-don-nang-am-dip-tet-nguyen-dan-2020-011537754.html",
                "snippet": "Theo dự báo của Trung tâm Khí tượng Thủy văn Quốc gia, miền Bắc và Bắc Trung Bộ có thể đón Tết Nguyên đán trong tiết trời nắng ấm với nhiệt độ cao hơn&nbsp;..."
              },
              {
                "title": "Thời tiết dịp Tết Nguyên đán 2020 sẽ ra sao?",
                "timeAgo": "5h ago",
                "source": "Truyền hình Nghệ An (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://truyenhinhnghean.vn/doi-song-xa-hoi/202001/thoi-tiet-dip-tet-nguyen-dan-2020-se-ra-sao-1054623/",
                  "source": "Truyền hình Nghệ An (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSoFzM450UTGGh95lhAZ0bU9Mv1hSh6EHJzzgKXnXB869enk0bYpIT7KWwECH5-so0UDen2jaHv"
                },
                "url": "https://truyenhinhnghean.vn/doi-song-xa-hoi/202001/thoi-tiet-dip-tet-nguyen-dan-2020-se-ra-sao-1054623/",
                "snippet": "Theo ông Hoàng Phúc Lâm - Phó Giám đốc Trung tâm Dự báo Khí tượng Thủy văn Quốc gia, các tỉnh miền Bắc và Bắc Trung bộ sẽ đón Tết Nguyên đán Canh&nbsp;..."
              },
              {
                "title": "Miền Bắc đón Tết Nguyên đán 2020 với tiết trời ấm áp",
                "timeAgo": "19h ago",
                "source": "YAN News (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://www.yan.vn/mien-bac-don-tet-nguyen-dan-2020-voi-tiet-troi-am-ap-219632.html",
                  "source": "YAN News (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcTz6WuK8KexBJAJedQuvCmBYizO34lL60J3MIBUjgEVcvvkKz-w-9GTFfAZ2PKi08Fi5rzEMCWF"
                },
                "url": "https://www.yan.vn/mien-bac-don-tet-nguyen-dan-2020-voi-tiet-troi-am-ap-219632.html",
                "snippet": "Trong khi đó, nửa cuối tháng 1/2020, nhiệt độ dự báo cao hơn 1 - 2 độ so với trung bình nhiều năm. Đây là thời điểm trùng với kỳ nghỉ Tết Nguyên đán 2020,&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Th%E1%BB%9Di+ti%E1%BA%BFt+T%E1%BA%BFt+nguy%C3%AAn+%C4%91%C3%A1n#Th%E1%BB%9Di%20ti%E1%BA%BFt%20T%E1%BA%BFt%20nguy%C3%AAn%20%C4%91%C3%A1n"
          },
          {
            "title": {
              "query": "Kỷ luật Phó Thủ tướng Hoàng Trung Hải",
              "exploreLink": "/trends/explore?q=K%E1%BB%B7+lu%E1%BA%ADt+Ph%C3%B3+Th%E1%BB%A7+t%C6%B0%E1%BB%9Bng+Ho%C3%A0ng+Trung+H%E1%BA%A3i&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "2K+",
            "relatedQueries": [],
            "image": {
              "newsUrl": "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html",
              "source": "Báo Thanh Niên",
              "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTV0d3Z5cqZseGA-pIwEMPNVk8nwcGaz9C4snlmPufQ_n1ag6E7zapBWlKByh4XWPDGeKi6Vvkn"
            },
            "articles": [
              {
                "title": "Đề nghị kỷ luật Bí thư Thành ủy Hà Nội Hoàng Trung Hải",
                "timeAgo": "7h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTV0d3Z5cqZseGA-pIwEMPNVk8nwcGaz9C4snlmPufQ_n1ag6E7zapBWlKByh4XWPDGeKi6Vvkn"
                },
                "url": "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html",
                "snippet": "Ủy ban Kiểm tra T.Ư đề nghị Bộ Chính trị xem xét, thi hành kỷ luật theo thẩm quyền đối với ông Hoàng Trung Hải, Ủy viên Bộ Chính trị, Bí thư Thành ủy Hà Nội,&nbsp;..."
              },
              {
                "title": "Ông Hoàng Trung Hải bị đề nghị kỷ luật, nhiều cán bộ khác bị khai ...",
                "timeAgo": "3h ago",
                "source": "Báo Giáo dục Việt Nam",
                "image": {
                  "newsUrl": "https://giaoduc.net.vn/tieu-diem/ong-hoang-trung-hai-bi-de-nghi-ky-luat-nhieu-can-bo-khac-bi-khai-tru-dang-post206046.gd",
                  "source": "Báo Giáo dục Việt Nam",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcTfLu3-kiHuxpDB0Cy1g8Y4dWgLMhiEK29a4k4IKOkvE-dylMXndFbohVH3bdbC-CRLA0i4Xgbp"
                },
                "url": "https://giaoduc.net.vn/tieu-diem/ong-hoang-trung-hai-bi-de-nghi-ky-luat-nhieu-can-bo-khac-bi-khai-tru-dang-post206046.gd",
                "snippet": "(GDVN) - Ông Hoàng Trung Hải (Bí thư Thành ủy Hà Nội, nguyên Phó Thủ tướng Chính phủ) bị đề nghị kỷ luật đã có vi phạm, khuyết điểm liên quan đến Dự án&nbsp;..."
              },
              {
                "title": "Hàng loạt nhân sự cấp cao do Bộ Chính trị Việt Nam quản lý sắp ...",
                "timeAgo": "54m ago",
                "source": "Sputnik Việt Nam",
                "image": {
                  "newsUrl": "https://vn.sputniknews.com/vietnam/202001098455323-hang-loat-nhan-su-cap-cao-do-bo-chinh-tri-viet-nam-quan-ly-sap-vao-lo/",
                  "source": "Sputnik Việt Nam",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQvbSs3HPZxtai6iW65v0vtzoXNsDiEow6dyEauJU_Fcgj_ZgTDG9Qvw6hyODmiTpk03NGmIGYs"
                },
                "url": "https://vn.sputniknews.com/vietnam/202001098455323-hang-loat-nhan-su-cap-cao-do-bo-chinh-tri-viet-nam-quan-ly-sap-vao-lo/",
                "snippet": "Nguyên Ủy viên Bộ Chính trị, nguyên Bí thư thành ủy TP.HCM Lê Thanh Hải bị xem xét kỷ luật vì sai phạm nghiêm trọng vụ Thủ Thiêm. Bí thư Thành ủy Hà Nội,&nbsp;..."
              },
              {
                "title": "Đề nghị Bộ Chính trị xem xét, thi hành kỷ luật Bí thư Thành ủy Hà ...",
                "timeAgo": "20h ago",
                "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
                "image": {
                  "newsUrl": "https://vtv.vn/trong-nuoc/de-nghi-bo-chinh-tri-xem-xet-thi-hanh-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-2020010817233775.htm",
                  "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcQz2b9Yq1nrWadIQmNSsieYsdhVmMxE8noo23sjuVuSP-ftGQMXMWJgInv3O8-ANWfPSya8YZ1s"
                },
                "url": "https://vtv.vn/trong-nuoc/de-nghi-bo-chinh-tri-xem-xet-thi-hanh-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-2020010817233775.htm",
                "snippet": "VTV.vn - UBKT Trung ương đề nghị Bộ Chính trị xem xét, thi hành kỷ luật đồng chí Hoàng Trung Hải liên quan đến các vi phạm đã được kết luận tại Kỳ họp..."
              },
              {
                "title": "Sai phạm tại dự án Gang thép Thái Nguyên: Đề nghị kỷ luật ông ...",
                "timeAgo": "6h ago",
                "source": "Tạp chí Thương Trường (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thuongtruong.com.vn/tin-tuc/trong-nuoc/sai-pham-tai-du-an-gang-thep-thai-nguyen-de-nghi-ky-luat-ong-hoang-trung-hai-bi-thu-thanh-uy-ha-noi-22764.html",
                  "source": "Tạp chí Thương Trường (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSjpoX8fk2HI1YXra2d6k5jJI4wjOp-v-CtJq2FbJO7gkoXegCh8E0wWpSAhzWJqdYvYSaG8eUY"
                },
                "url": "https://thuongtruong.com.vn/tin-tuc/trong-nuoc/sai-pham-tai-du-an-gang-thep-thai-nguyen-de-nghi-ky-luat-ong-hoang-trung-hai-bi-thu-thanh-uy-ha-noi-22764.html",
                "snippet": "Liên quan đến những sai phạm liên quan dự án Gang thép Thái Nguyên, tại kỳ họp 42, Ủy ban kiểm tra trung ương đã đề nghị Bộ Chính trị xem xét."
              },
              {
                "title": "Đề nghị Bộ Chính trị thi hành kỷ luật ông Hoàng Trung Hải",
                "timeAgo": "21h ago",
                "source": "VTC News",
                "url": "https://vtc.vn/chinh-tri/de-nghi-thi-hanh-ky-luat-ong-hoang-trung-hai-ar521014.html",
                "snippet": "Ủy ban Kiểm tra Trung ương đề nghị Bộ Chính trị xem xét thi hành kỷ luật ông Hoàng Trung Hải, Ủy viên Bộ Chính trị, Bí thư Thành ủy Hà Nội."
              },
              {
                "title": "Ông Hoàng Trung Hải bị đề nghị kỉ luật",
                "timeAgo": "17h ago",
                "source": "Việt Nam Mới",
                "image": {
                  "newsUrl": "https://vietnammoi.vn/ong-hoang-trung-hai-bi-de-nghi-ki-luat-20200108202153701.htm",
                  "source": "Việt Nam Mới",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcRA7yRQcnD3sidIbv3R7rIPvbOtKoN9n5eUN-RTKttS2jTuiIV_lwbK9UoJWEGLTAChvyPab9ML"
                },
                "url": "https://vietnammoi.vn/ong-hoang-trung-hai-bi-de-nghi-ki-luat-20200108202153701.htm",
                "snippet": "Ông Hoàng Trung Hải (Bí thư Thành ủy Hà Nội, nguyên Phó thủ tướng) bị đề nghị kỉ luật vì có vi phạm, khuyết điểm liên quan dự án TISCO II."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=K%E1%BB%B7+lu%E1%BA%ADt+Ph%C3%B3+Th%E1%BB%A7+t%C6%B0%E1%BB%9Bng+Ho%C3%A0ng+Trung+H%E1%BA%A3i#K%E1%BB%B7%20lu%E1%BA%ADt%20Ph%C3%B3%20Th%E1%BB%A7%20t%C6%B0%E1%BB%9Bng%20Ho%C3%A0ng%20Trung%20H%E1%BA%A3i"
          }
        ]
      },
      {
        "date": "20200108",
        "formattedDate": "Wednesday, January 8, 2020",
        "trendingSearches": [
          {
            "title": {
              "query": "Lịch thi đấu U23",
              "exploreLink": "/trends/explore?q=L%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+U23&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "200K+",
            "relatedQueries": [
              {
                "query": "u23 2020 lịch thi đấu",
                "exploreLink": "/trends/explore?q=u23+2020+l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u&date=now+7-d&geo=VN"
              },
              {
                "query": "Lịch thi đấu U23 châu Á",
                "exploreLink": "/trends/explore?q=L%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+U23+ch%C3%A2u+%C3%81&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch thi đấu u23 châu á 2020",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+ch%C3%A2u+%C3%A1+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "U23 châu Á",
                "exploreLink": "/trends/explore?q=U23+ch%C3%A2u+%C3%81&date=now+7-d&geo=VN"
              },
              {
                "query": "Lịch thi đấu VCK U23 châu Á",
                "exploreLink": "/trends/explore?q=L%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+VCK+U23+ch%C3%A2u+%C3%81&date=now+7-d&geo=VN"
              },
              {
                "query": "U23",
                "exploreLink": "/trends/explore?q=U23&date=now+7-d&geo=VN"
              },
              {
                "query": "vòng chung kết u23 châu á 2020",
                "exploreLink": "/trends/explore?q=v%C3%B2ng+chung+k%E1%BA%BFt+u23+ch%C3%A2u+%C3%A1+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "xem bóng đá",
                "exploreLink": "/trends/explore?q=xem+b%C3%B3ng+%C4%91%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "Kết quả bóng đá U23",
                "exploreLink": "/trends/explore?q=K%E1%BA%BFt+qu%E1%BA%A3+b%C3%B3ng+%C4%91%C3%A1+U23&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch thi đấu u23 việt nam",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+vi%E1%BB%87t+nam&date=now+7-d&geo=VN"
              },
              {
                "query": "trực tiếp u23 châu á",
                "exploreLink": "/trends/explore?q=tr%E1%BB%B1c+ti%E1%BA%BFp+u23+ch%C3%A2u+%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "u23 châu á năm 2020",
                "exploreLink": "/trends/explore?q=u23+ch%C3%A2u+%C3%A1+n%C4%83m+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch thi đấu u23 châu á năm 2020",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+ch%C3%A2u+%C3%A1+n%C4%83m+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch u23",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+u23&date=now+7-d&geo=VN"
              },
              {
                "query": "u23 chau a",
                "exploreLink": "/trends/explore?q=u23+chau+a&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch thi đấu u23 châu á 2020 của việt nam",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+ch%C3%A2u+%C3%A1+2020+c%E1%BB%A7a+vi%E1%BB%87t+nam&date=now+7-d&geo=VN"
              },
              {
                "query": "bóng đá U23",
                "exploreLink": "/trends/explore?q=b%C3%B3ng+%C4%91%C3%A1+U23&date=now+7-d&geo=VN"
              },
              {
                "query": "bảng đấu u23 châu á 2020",
                "exploreLink": "/trends/explore?q=b%E1%BA%A3ng+%C4%91%E1%BA%A5u+u23+ch%C3%A2u+%C3%A1+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "VCK U23",
                "exploreLink": "/trends/explore?q=VCK+U23&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch u23 việt nam đá",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+u23+vi%E1%BB%87t+nam+%C4%91%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "trực tiếp u23 châu á 2020",
                "exploreLink": "/trends/explore?q=tr%E1%BB%B1c+ti%E1%BA%BFp+u23+ch%C3%A2u+%C3%A1+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch thi đấu vòng chung kết u23 châu á tại thái lan",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+v%C3%B2ng+chung+k%E1%BA%BFt+u23+ch%C3%A2u+%C3%A1+t%E1%BA%A1i+th%C3%A1i+lan&date=now+7-d&geo=VN"
              },
              {
                "query": "lich thi dau u23 viet nam",
                "exploreLink": "/trends/explore?q=lich+thi+dau+u23+viet+nam&date=now+7-d&geo=VN"
              },
              {
                "query": "lich u23",
                "exploreLink": "/trends/explore?q=lich+u23&date=now+7-d&geo=VN"
              },
              {
                "query": "u23 châu á lịch thi đấu",
                "exploreLink": "/trends/explore?q=u23+ch%C3%A2u+%C3%A1+l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u&date=now+7-d&geo=VN"
              },
              {
                "query": "chung kết u23 châu á",
                "exploreLink": "/trends/explore?q=chung+k%E1%BA%BFt+u23+ch%C3%A2u+%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "bong da hom nay",
                "exploreLink": "/trends/explore?q=bong+da+hom+nay&date=now+7-d&geo=VN"
              },
              {
                "query": "U23 châu Á 2020",
                "exploreLink": "/trends/explore?q=U23+ch%C3%A2u+%C3%81+2020&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm",
              "source": "Báo Thể thao & Văn hóa",
              "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSbnHL6NNcbNDPCFvmw4vQ92-a6xhwaDsh2iqzrTDtbCSNXsCp7X1L-bb-agTkE2oSXSbtNNfWv"
            },
            "articles": [
              {
                "title": "Lịch thi đấu U23 châu Á 2020 trên VTV. Trực tiếp bóng đá. VTV6 ...",
                "timeAgo": "7h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSbnHL6NNcbNDPCFvmw4vQ92-a6xhwaDsh2iqzrTDtbCSNXsCp7X1L-bb-agTkE2oSXSbtNNfWv"
                },
                "url": "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm",
                "snippet": "lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, truc tiep bong da, Uzbekistan vs Iran, Hàn Quốc vs Trung Quốc, Qatar vs Syria, Nhật Bản Saudi Arabia,&nbsp;..."
              },
              {
                "title": "Bóng đá Việt Nam hôm nay. Lịch thi đấu U23 châu Á 2020 trên VTV ...",
                "timeAgo": "3h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/de-bep-bahrain-u23-thai-lan-du-suc-vao-chung-ket-nhu-u23-viet-nam-2018-n20200109075753191.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRhLB_57zt6KO3_ijCx8bYUCmGNCEUPx7P0uVlmPUXYngwDejF5jOrkfyDfbtofOEUe5aLXXY4-"
                },
                "url": "https://thethaovanhoa.vn/u23-chau-a-2020/de-bep-bahrain-u23-thai-lan-du-suc-vao-chung-ket-nhu-u23-viet-nam-2018-n20200109075753191.htm",
                "snippet": "(Thethaovanhoa.vn) - U23 Thái Lan khởi động cho chiến dịch săn vé dự Olympic Tokyo bằng chiến thắng hủy diệt trước Bahrain. Đội bóng của ông Akira&nbsp;..."
              },
              {
                "title": "Bóng đá Việt Nam hôm nay. Lịch thi đấu U23 châu Á 2020 trên VTV ...",
                "timeAgo": "2h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/bong-da-viet-nam/hlv-park-hang-seo-tran-gap-uae-rat-quan-trong-voi-u23-viet-nam-n20200109071310732.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSQ7notH_lCD3xu6-kt7AnC5YQCnTojYzNLScjt7IRNWj7CC7RLtQxJaH_BCuAMeCQSbDc2-OIC"
                },
                "url": "https://thethaovanhoa.vn/bong-da-viet-nam/hlv-park-hang-seo-tran-gap-uae-rat-quan-trong-voi-u23-viet-nam-n20200109071310732.htm",
                "snippet": "(Thethaovanhoa.vn) - HLV Park Hang Seo khẳng định trận đấu đầu tiên tại bảng D gặp U23 UAE rất quan trọng với U23 Việt Nam và mục tiêu của đội là phải&nbsp;..."
              },
              {
                "title": "Lịch thi đấu U23 châu Á 2020 ngày 9/1: Nhật Bản, Hàn Quốc, Iran ra ...",
                "timeAgo": "8h ago",
                "source": "Đài Tiếng Nói Việt Nam",
                "image": {
                  "newsUrl": "https://vov.vn/the-thao/bong-da/lich-thi-dau-u23-chau-a-2020-ngay-91-nhat-ban-han-quoc-iran-ra-quan-998531.vov",
                  "source": "Đài Tiếng Nói Việt Nam",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRSYC_31oX3jEO2sP3mQRRAB3QWCcLaMyih6MB6-JxJZF2kQ9KtB2xAqtqgKwbUZ3Z7Ny30WHo1"
                },
                "url": "https://vov.vn/the-thao/bong-da/lich-thi-dau-u23-chau-a-2020-ngay-91-nhat-ban-han-quoc-iran-ra-quan-998531.vov",
                "snippet": "VOV.VN - Hôm nay (9/1), bảng B và bảng C ở VCK U23 châu Á 2020 sẽ diễn ra lượt trận đầu tiên với sự góp mặt của một loạt đội bóng mạnh."
              },
              {
                "title": "Lịch thi đấu U23 Châu Á 2020 hôm nay 9/1: Hàn Quốc đại chiến ...",
                "timeAgo": "7h ago",
                "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thethao247.vn/250-u23-chau-a-lich-thi-dau-u23-chau-a-2020-hom-nay-9-1-han-quoc-dai-chien-trung-quoc-d196444.html",
                  "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcQcbo-vvuVgCcJYW4rDGCO_mpEWV4fsjP1C2wAGPKfy7S_ZJ39vrgLPAXuIm609PxuR-gaKLsPj"
                },
                "url": "https://thethao247.vn/250-u23-chau-a-lich-thi-dau-u23-chau-a-2020-hom-nay-9-1-han-quoc-dai-chien-trung-quoc-d196444.html",
                "snippet": "Cập nhật lịch thi đấu U23 châu Á 2020 hôm nay ngày 09/01. Tâm điểm chính là trận đấu giữa U23 Hàn Quốc vs U23 Trung Quốc."
              },
              {
                "title": "Đội hình U23 Việt Nam đấu UAE: Quyết định bất ngờ của thầy Park",
                "timeAgo": "6h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/the-thao/bong-da-viet-nam/doi-tuyen-viet-nam/doi-hinh-u23-viet-nam-dau-uae-quyet-dinh-bat-ngo-cua-thay-park-607254.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcTHDAvQxtGiGRRAPOQHRjLve6XuB2Ba9u24D3zSCm0xoN6C70Y207GpF6IcTv8H22TRYSdF6Y_f"
                },
                "url": "https://vietnamnet.vn/vn/the-thao/bong-da-viet-nam/doi-tuyen-viet-nam/doi-hinh-u23-viet-nam-dau-uae-quyet-dinh-bat-ngo-cua-thay-park-607254.html",
                "snippet": "U23 UAE tìm mọi cách giấu bài trước U23 Việt Nam, vậy đội bóng của HLV Park Hang Seo tung chiêu như thế nào trong trận ra quân ở giải U23 châu Á 2020."
              },
              {
                "title": "Lịch thi đấu bóng đá ngày 10/1: U23 Việt Nam ra quân ở VCK U23 ...",
                "timeAgo": "5h ago",
                "source": "Saostar.vn",
                "image": {
                  "newsUrl": "https://saostar.vn/the-thao/lich-thi-dau-bong-da-ngay-10-1-u23-viet-nam-ra-quan-o-vck-u23-chau-a-6786869.html",
                  "source": "Saostar.vn",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQ6PVSL1ty3tduUpmcT2TCy9_Dh-tVBPp7kiBDUnyfauocLsaCrMUkquVEKdypR0rS_c-Fb8Txx"
                },
                "url": "https://saostar.vn/the-thao/lich-thi-dau-bong-da-ngay-10-1-u23-viet-nam-ra-quan-o-vck-u23-chau-a-6786869.html",
                "snippet": "Saostar gửi đến độc giả lịch thi đấu bóng đá hôm nay ngày 10/1 của các trận cầu hấp dẫn ở VCK U23 châu Á 2020: U22 Việt Nam đấu U22 UAE lúc 17h15."
              },
              {
                "title": "Lịch thi đấu U23 Việt Nam. Lịch thi đấu U23 châu Á. Lich thi dau ...",
                "timeAgo": "6h ago",
                "source": "Soha",
                "image": {
                  "newsUrl": "https://soha.vn/lich-thi-dau-u23-chau-a-2020-ngay-9-1-han-quoc-dai-chien-trung-quoc-20200109075908205.htm",
                  "source": "Soha",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcRst0v6tlpFR5eb7bU6KMXxHo268Tyi2Y7Gqkn4CUNikuPwZLnKkmQmjSq-z9ipC-HI8Ow8VFOl"
                },
                "url": "https://soha.vn/lich-thi-dau-u23-chau-a-2020-ngay-9-1-han-quoc-dai-chien-trung-quoc-20200109075908205.htm",
                "snippet": "Lịch thi đấu U23 châu Á 2020 của đội tuyển bóng đá U23 quốc gia Việt Nam. Lịch thi đấu bảng D U23 Châu Á của U23 Việt Nam. VTV6, VTV5 trực tiếp bóng đá&nbsp;..."
              },
              {
                "title": "Lịch thi đấu U23 Việt Nam. Lịch thi đấu U23 châu Á. Lich thi dau ...",
                "timeAgo": "1d ago",
                "source": "Soha",
                "image": {
                  "newsUrl": "https://soha.vn/lich-thi-dau-u23-chau-a-2020-ngay-8-1-u23-thai-lan-gap-doi-thu-kho-nhan-20200108081847361.htm",
                  "source": "Soha",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcR55_I_q0Tnrc3q5ga5ff_HO5UOG_-SOUzGBcvRfyxuvx98X40sfUyl4rguO5k4fqBNdLWZfMcL"
                },
                "url": "https://soha.vn/lich-thi-dau-u23-chau-a-2020-ngay-8-1-u23-thai-lan-gap-doi-thu-kho-nhan-20200108081847361.htm",
                "snippet": "Lịch thi đấu U23 châu Á 2020 của đội tuyển bóng đá U23 quốc gia Việt Nam. Lịch thi đấu bảng D U23 Châu Á của U23 Việt Nam. VTV6, VTV5 trực tiếp bóng đá&nbsp;..."
              },
              {
                "title": "Lịch thi đấu U23 châu Á 2020 hôm nay 8/1: U23 Thái Lan xuất trận",
                "timeAgo": "1d ago",
                "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thethao247.vn/267-u23-chau-a-lich-thi-dau-u23-chau-a-2020-hom-nay-8-1-d196416.html",
                  "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcREaLoVvH5epF2ViIcfH-zkwlQ_aPO9N3TDpWAbShKrSw9Qnbm8q_tOhSXyQGb3op2upkgSOFN3"
                },
                "url": "https://thethao247.vn/267-u23-chau-a-lich-thi-dau-u23-chau-a-2020-hom-nay-8-1-d196416.html",
                "snippet": "Đội tuyển U23 Thái Lan đối đầu với U23 Bahrain với mục tiêu phải giành chiến thắng. So với 2 đối thủ còn lại cùng bảng đấu là U23 Iraq và U23 Australia, trận&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=L%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+U23#L%E1%BB%8Bch%20thi%20%C4%91%E1%BA%A5u%20U23"
          },
          {
            "title": {
              "query": "Truc tiep bong da hôm nay",
              "exploreLink": "/trends/explore?q=Truc+tiep+bong+da+h%C3%B4m+nay&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "100K+",
            "relatedQueries": [
              {
                "query": "thái lan vs bahrain",
                "exploreLink": "/trends/explore?q=th%C3%A1i+lan+vs+bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "truc tiep vtv6",
                "exploreLink": "/trends/explore?q=truc+tiep+vtv6&date=now+7-d&geo=VN"
              },
              {
                "query": "U23 Thái Lan vs U23 Bahrain",
                "exploreLink": "/trends/explore?q=U23+Th%C3%A1i+Lan+vs+U23+Bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "lich thi dau u23 chau a",
                "exploreLink": "/trends/explore?q=lich+thi+dau+u23+chau+a&date=now+7-d&geo=VN"
              },
              {
                "query": "u-23 thái lan đấu với u-23 bahrain",
                "exploreLink": "/trends/explore?q=u-23+th%C3%A1i+lan+%C4%91%E1%BA%A5u+v%E1%BB%9Bi+u-23+bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "Bahrain",
                "exploreLink": "/trends/explore?q=Bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "truc tiep bong da hom nay",
                "exploreLink": "/trends/explore?q=truc+tiep+bong+da+hom+nay&date=now+7-d&geo=VN"
              },
              {
                "query": "TRỰC TIẾP bóng đá hôm nay",
                "exploreLink": "/trends/explore?q=TR%E1%BB%B0C+TI%E1%BA%BEP+b%C3%B3ng+%C4%91%C3%A1+h%C3%B4m+nay&date=now+7-d&geo=VN"
              },
              {
                "query": "thailand vs bahrain",
                "exploreLink": "/trends/explore?q=thailand+vs+bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "u23 thailand",
                "exploreLink": "/trends/explore?q=u23+thailand&date=now+7-d&geo=VN"
              },
              {
                "query": "trực tiếp vtv6",
                "exploreLink": "/trends/explore?q=tr%E1%BB%B1c+ti%E1%BA%BFp+vtv6&date=now+7-d&geo=VN"
              },
              {
                "query": "Thái Lan",
                "exploreLink": "/trends/explore?q=Th%C3%A1i+Lan&date=now+7-d&geo=VN"
              },
              {
                "query": "thái lan bahrain",
                "exploreLink": "/trends/explore?q=th%C3%A1i+lan+bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "lich u23 chau a",
                "exploreLink": "/trends/explore?q=lich+u23+chau+a&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch u23 châu á",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+u23+ch%C3%A2u+%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "thai lan bahrain",
                "exploreLink": "/trends/explore?q=thai+lan+bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "thailand u23",
                "exploreLink": "/trends/explore?q=thailand+u23&date=now+7-d&geo=VN"
              },
              {
                "query": "vtv6 trực tiếp bóng đá",
                "exploreLink": "/trends/explore?q=vtv6+tr%E1%BB%B1c+ti%E1%BA%BFp+b%C3%B3ng+%C4%91%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "thai lan vs bahrain",
                "exploreLink": "/trends/explore?q=thai+lan+vs+bahrain&date=now+7-d&geo=VN"
              },
              {
                "query": "ket qua u23 chau a",
                "exploreLink": "/trends/explore?q=ket+qua+u23+chau+a&date=now+7-d&geo=VN"
              },
              {
                "query": "trực tiếp bóng đá việt nam hôm nay",
                "exploreLink": "/trends/explore?q=tr%E1%BB%B1c+ti%E1%BA%BFp+b%C3%B3ng+%C4%91%C3%A1+vi%E1%BB%87t+nam+h%C3%B4m+nay&date=now+7-d&geo=VN"
              },
              {
                "query": "Bảng xếp hạng U23 Châu Á 2020",
                "exploreLink": "/trends/explore?q=B%E1%BA%A3ng+x%E1%BA%BFp+h%E1%BA%A1ng+U23+Ch%C3%A2u+%C3%81+2020&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm",
              "source": "Báo Thể thao & Văn hóa",
              "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSbnHL6NNcbNDPCFvmw4vQ92-a6xhwaDsh2iqzrTDtbCSNXsCp7X1L-bb-agTkE2oSXSbtNNfWv"
            },
            "articles": [
              {
                "title": "Lịch thi đấu U23 châu Á 2020 trên VTV. Trực tiếp bóng đá. VTV6 ...",
                "timeAgo": "7h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSbnHL6NNcbNDPCFvmw4vQ92-a6xhwaDsh2iqzrTDtbCSNXsCp7X1L-bb-agTkE2oSXSbtNNfWv"
                },
                "url": "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm",
                "snippet": "lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, truc tiep bong da, Uzbekistan vs Iran, Hàn Quốc vs Trung Quốc, Qatar vs Syria, Nhật Bản Saudi Arabia,&nbsp;..."
              },
              {
                "title": "Trực tiếp bóng đá U23 châu Á 2020 hôm nay 9/1",
                "timeAgo": "3h ago",
                "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thethao247.vn/267-u23-chau-a-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-d196493.html",
                  "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQS1EnfsfBgfcxV9r3fx-lcJIvvU2XnRDiSobw9jv3pbIZMTWwxXRCQbOilzx2b6hk4ytiA9Qz-"
                },
                "url": "https://thethao247.vn/267-u23-chau-a-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-d196493.html",
                "snippet": "Cập nhật thời gian, link xem trực tiếp bóng đá U23 châu Á 2020 hôm nay 09/01 trên kênh VTV6. Tâm điểm của ngày thi đấu thứ 2 chính là màn ra quân của U23&nbsp;..."
              },
              {
                "title": "VTV6 TRỰC TIẾP bóng đá hôm nay. U23 châu Á 2020. U23 Thái ...",
                "timeAgo": "21h ago",
                "source": "Báo Thể thao & Văn hóa",
                "url": "https://thethaovanhoa.vn/u23-chau-a-2020/u23-thai-lan-50-u23-bahrain-suphanat-lap-cu-dup-chu-nha-tao-mua-ban-thang-n20200108070346053.htm",
                "snippet": "U23 Thái Lan đã giành chiến thắng 5-0 trước U23 Bahrain ở trận ra quân. Suphanat Mueanta và Jaroensak Wonggorn đã lập cú đúp ở trận đấu này."
              },
              {
                "title": "Trực tiếp bóng đá U23 Thái Lan - U23 Bahrain: Kết thúc ngỡ ngàng ...",
                "timeAgo": "15h ago",
                "source": "Tin tức 24h",
                "image": {
                  "newsUrl": "https://www.24h.com.vn/bong-da/truc-tiep-bong-da-u23-thai-lan-u23-bahrain-chu-nha-cho-pho-dien-suc-manh-c48a1114913.html",
                  "source": "Tin tức 24h",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcREgkGAXrGyJKgoz4G20VeAYeatXtVv1bQVoe0BuNgaeDkgdxdMoUzyAbwecxpV1TVq-LX7mrWP"
                },
                "url": "https://www.24h.com.vn/bong-da/truc-tiep-bong-da-u23-thai-lan-u23-bahrain-chu-nha-cho-pho-dien-suc-manh-c48a1114913.html",
                "snippet": "Trực tiếp bóng đá U23 Thái Lan - U23 Bahrain, vòng bảng U23 châu Á 2020) U23 Thái Lan có chiến thắng đậm đà 5-0 khiến nhiều người phải ngỡ ngàng."
              },
              {
                "title": "Link xem trực tiếp U23 Thái Lan vs U23 Bahrain, 20h15 ngày 8-1",
                "timeAgo": "21h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/the-thao/bong-da-viet-nam/link-xem-truc-tiep-u23-thai-lan-vs-u23-bahrain-20h15-ngay-8-1-607472.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcTI6JXIFwPnLIlOxvypnTbMpB6QLajYkODnfn5vNpDypv52Fad6guQm6jXDtHn9cOfHqiwrpXCN"
                },
                "url": "https://vietnamnet.vn/vn/the-thao/bong-da-viet-nam/link-xem-truc-tiep-u23-thai-lan-vs-u23-bahrain-20h15-ngay-8-1-607472.html",
                "snippet": "VietNamNet cập nhật link xem trực tiếp trận đấu giữa U23 Thái Lan vs U23 Bahrain ở trận ra quân VCK U23 châu Á 2020, vào lúc 20h15 ngày 8/1."
              },
              {
                "title": "Trực tiếp bóng đá U23 Iraq - U23 Australia: Dốc toàn lực những phút ...",
                "timeAgo": "21h ago",
                "source": "Tin tức 24h",
                "url": "https://www.24h.com.vn/bong-da/truc-tiep-bong-da-u23-iraq-u23-australia-dan-sao-chau-au-ra-oai-dan-mat-u23-thai-lan-c48a1115017.html",
                "snippet": "Trực tiếp bóng đá U23 Iraq - U23 Australia, lượt trận mở màn bảng A U23 châu Á 2020) U23 Iraq và U23 Australia nỗ lực tấn công những phút cuối nhưng bất&nbsp;..."
              },
              {
                "title": "Kết quả U23 Iraq vs U23 Australia, Kết quả bóng đá U23 châu Á",
                "timeAgo": "19h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/the-thao/xem-truc-tiep-bong-da/ket-qua-u23-iraq-vs-u23-australia-ket-qua-bong-da-u23-chau-a-607507.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcTm8kTaBFlwPL0v3TepDG5vXsx-24yK8D00wsKGExY8MvqyB-axYtC7QDtPxflU6b1KsCSqTNAi"
                },
                "url": "https://vietnamnet.vn/vn/the-thao/xem-truc-tiep-bong-da/ket-qua-u23-iraq-vs-u23-australia-ket-qua-bong-da-u23-chau-a-607507.html",
                "snippet": "Kết quả U23 Iraq vs U23 Australia: Dù bị dẫn trước nhưng tiền đạo vào sân thay người Nassif đã ghi bàn quý giá giúp U23 Iraq hòa U23 Australia 1-1, trong trận&nbsp;..."
              },
              {
                "title": "U23 Iraq vs U23 Australia link xem trực tiếp bóng đá VTV6",
                "timeAgo": "21h ago",
                "source": "Bóng đá 24h",
                "image": {
                  "newsUrl": "https://bongda24h.vn/link-xem-truc-tiep-bong-da/vtv6-u23-chau-a-u23-iraq-vs-u23-australia-hom-nay-505-241366.html",
                  "source": "Bóng đá 24h",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcS_ne7vN__lONsoI03A36hBv35f_8rspfSTsVR5BD49QMw21ZbQG5jDOk5e2e3zi53C88ZIYMih"
                },
                "url": "https://bongda24h.vn/link-xem-truc-tiep-bong-da/vtv6-u23-chau-a-u23-iraq-vs-u23-australia-hom-nay-505-241366.html",
                "snippet": "Link xem trực tiếp bóng đá VTV6 U23 Iraq vs U23 Australia 17h15 trận đấu bóng đá vòng bảng U23 Châu Á 2020,tường thuật trực tiếp U23 Iraq vs U23&nbsp;..."
              },
              {
                "title": "Suphanat rực sáng, U23 Thái Lan đại thắng U23 Bahrain trong ngày ...",
                "timeAgo": "15h ago",
                "source": "Goal.com",
                "url": "https://www.goal.com/vn/tintuc/truc-tiep-vtv6-thai-lan-vs-u23-bahrain-link-xem-thai-lan-vs/1w4ugfmxmfoex1ay8mf68bjv6i",
                "snippet": "Với phong độ rực sáng của anh em nhà Supachok - Suphanat, U23 Thái Lan đã có trận thắng dễ dàng ngoài mong đợi."
              },
              {
                "title": "Kết quả bóng đá U23 Thái Lan vs U23 Bahrain VTV6 hôm nay",
                "timeAgo": "16h ago",
                "source": "Bóng đá 24h",
                "image": {
                  "newsUrl": "https://bongda24h.vn/truc-tiep-bong-da/u23-thai-lan-vs-u23-bahrain-vtv6-u23-chau-a-2020-372-241377.html",
                  "source": "Bóng đá 24h",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQ3bB0F5E-VO9nKZjLYx2L6RAiyB25SGkm9J4td4QNF38LbLh6FEYLb0uNJcvZRWM6lTeQWWd-X"
                },
                "url": "https://bongda24h.vn/truc-tiep-bong-da/u23-thai-lan-vs-u23-bahrain-vtv6-u23-chau-a-2020-372-241377.html",
                "snippet": "Trực tiếp bóng đá U23 Thái Lan vs U23 Bahrain U23 Châu Á 2020 hôm nay, link xem tường thuật trực tuyến U23 Thái Lan vs U23 Bahrain 20h15 hôm nay&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Truc+tiep+bong+da+h%C3%B4m+nay#Truc%20tiep%20bong%20da%20h%C3%B4m%20nay"
          },
          {
            "title": {
              "query": "Vtv6",
              "exploreLink": "/trends/explore?q=Vtv6&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "100K+",
            "relatedQueries": [
              {
                "query": "lịch bóng đá u23 châu á",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+b%C3%B3ng+%C4%91%C3%A1+u23+ch%C3%A2u+%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch thi đấu bóng đá u23 châu á",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+b%C3%B3ng+%C4%91%C3%A1+u23+ch%C3%A2u+%C3%A1&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch bóng đá u23",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+b%C3%B3ng+%C4%91%C3%A1+u23&date=now+7-d&geo=VN"
              },
              {
                "query": "lịch bóng đá u23 châu á 2020",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+b%C3%B3ng+%C4%91%C3%A1+u23+ch%C3%A2u+%C3%A1+2020&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/u23-jordan-luyen-bai-rat-kho-chiu-dau-u23-viet-nam-n20200107212924825.htm",
              "source": "Báo Thể thao & Văn hóa",
              "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcRRqt3HyeTFHtYU_hOCwNpGzWEmQrDVm2_5whhYlYubGFyBObPhGmgzFuDg3yyWKKzS_Ea0GSzx"
            },
            "articles": [
              {
                "title": "Bóng đá Việt Nam hôm nay. Lịch thi đấu U23 châu Á 2020 trên VTV ...",
                "timeAgo": "6h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/u23-jordan-luyen-bai-rat-kho-chiu-dau-u23-viet-nam-n20200107212924825.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcRRqt3HyeTFHtYU_hOCwNpGzWEmQrDVm2_5whhYlYubGFyBObPhGmgzFuDg3yyWKKzS_Ea0GSzx"
                },
                "url": "https://thethaovanhoa.vn/u23-chau-a-2020/u23-jordan-luyen-bai-rat-kho-chiu-dau-u23-viet-nam-n20200107212924825.htm",
                "snippet": "bong da, bóng đá Việt Nam, lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, lịch bóng đá U23 châu Á, lịch thi đấu VCK U23 châu Á, VTV6, truc tiep&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Vtv6#Vtv6"
          },
          {
            "title": {
              "query": "Iran",
              "exploreLink": "/trends/explore?q=Iran&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "100K+",
            "relatedQueries": [
              {
                "query": "iran tấn công mỹ",
                "exploreLink": "/trends/explore?q=iran+t%E1%BA%A5n+c%C3%B4ng+m%E1%BB%B9&date=now+7-d&geo=VN"
              },
              {
                "query": "mỹ iran",
                "exploreLink": "/trends/explore?q=m%E1%BB%B9+iran&date=now+7-d&geo=VN"
              },
              {
                "query": "mỹ và iran",
                "exploreLink": "/trends/explore?q=m%E1%BB%B9+v%C3%A0+iran&date=now+7-d&geo=VN"
              },
              {
                "query": "iran và mỹ",
                "exploreLink": "/trends/explore?q=iran+v%C3%A0+m%E1%BB%B9&date=now+7-d&geo=VN"
              },
              {
                "query": "chiến tranh mỹ iran",
                "exploreLink": "/trends/explore?q=chi%E1%BA%BFn+tranh+m%E1%BB%B9+iran&date=now+7-d&geo=VN"
              },
              {
                "query": "Iraq",
                "exploreLink": "/trends/explore?q=Iraq&date=now+7-d&geo=VN"
              },
              {
                "query": "tình hình mỹ và iran",
                "exploreLink": "/trends/explore?q=t%C3%ACnh+h%C3%ACnh+m%E1%BB%B9+v%C3%A0+iran&date=now+7-d&geo=VN"
              },
              {
                "query": "Trump",
                "exploreLink": "/trends/explore?q=Trump&date=now+7-d&geo=VN"
              },
              {
                "query": "iran bắn tên lửa",
                "exploreLink": "/trends/explore?q=iran+b%E1%BA%AFn+t%C3%AAn+l%E1%BB%ADa&date=now+7-d&geo=VN"
              },
              {
                "query": "Mỹ",
                "exploreLink": "/trends/explore?q=M%E1%BB%B9&date=now+7-d&geo=VN"
              },
              {
                "query": "mỹ đánh iran",
                "exploreLink": "/trends/explore?q=m%E1%BB%B9+%C4%91%C3%A1nh+iran&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://vietnamnet.vn/vn/the-gioi/binh-luan-quoc-te/tinh-hinh-my-iran-moi-nhat-ly-do-thuc-su-khien-ong-trump-ha-lenh-giet-tuong-iran-soleimani-607450.html",
              "source": "Vietnamnet.vn",
              "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSH-lqE6_0E9KdDRl4pB6_ybzvuL7Tr4QwhclIgpQQLQ3AHwt42HEihFSZEEbxWM6ZMfiBW-9tV"
            },
            "articles": [
              {
                "title": "Tình hình Mỹ - Iran mới nhất: Lý do thực sự khiến ông Trump hạ lệnh ...",
                "timeAgo": "6h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/the-gioi/binh-luan-quoc-te/tinh-hinh-my-iran-moi-nhat-ly-do-thuc-su-khien-ong-trump-ha-lenh-giet-tuong-iran-soleimani-607450.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcSH-lqE6_0E9KdDRl4pB6_ybzvuL7Tr4QwhclIgpQQLQ3AHwt42HEihFSZEEbxWM6ZMfiBW-9tV"
                },
                "url": "https://vietnamnet.vn/vn/the-gioi/binh-luan-quoc-te/tinh-hinh-my-iran-moi-nhat-ly-do-thuc-su-khien-ong-trump-ha-lenh-giet-tuong-iran-soleimani-607450.html",
                "snippet": "Tình hình Mỹ - Iran mới nhất: Với Mỹ hiện là nước xuất khẩu ròng dầu mỏ, và nền kinh tế Iran đang chật vật với lạm phát kỷ lục, Tổng thống Donald Trump đang&nbsp;..."
              },
              {
                "title": "Quân đội Iran mạnh cỡ nào?",
                "timeAgo": "4h ago",
                "source": "Zing.vn",
                "image": {
                  "newsUrl": "https://news.zing.vn/quan-doi-iran-manh-co-nao-post1034064.html",
                  "source": "Zing.vn",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQaNA0scit-zjoRJAKuq4-IiVhMDb2Btb_JZLSWKJmr19w32wUyg49qbKD1ZQHEGt3od7or_r9m"
                },
                "url": "https://news.zing.vn/quan-doi-iran-manh-co-nao-post1034064.html",
                "snippet": "Quân đội Iran sở hữu kho tên lửa đạn đạo lớn nhất Trung Đông, cùng lực lượng Quds tinh nhuệ có mạng lưới rộng khắp khu vực và công nghệ máy bay không&nbsp;..."
              },
              {
                "title": "Iran dường như đã &#39;hạ hỏa&#39;",
                "timeAgo": "12h ago",
                "source": "BBC Tiếng Việt",
                "url": "https://www.bbc.com/vietnamese/world-51025178",
                "snippet": "Tổng thống Hoa Kỳ Donald Trump nói rằng Iran &quot;dường như đã hạ hỏa&quot; sau khi nước này phóng hỏa tiễn vào các căn cứ không quân có binh lính Mỹ ở Iraq."
              },
              {
                "title": "Mỹ - Iran bên bờ vực chiến tranh: Washington, Tehran có đường lùi",
                "timeAgo": "5h ago",
                "source": "Tuổi Trẻ Online",
                "url": "https://tuoitre.vn/my-iran-ben-bo-vuc-chien-tranh-washington-tehran-co-duong-lui-20200109080421585.htm",
                "snippet": "TTO - Nguy cơ chiến tranh tại Trung Đông rõ rệt hơn sau khi Iran tấn công hai căn cứ quân sự có lính Mỹ đồn trú ở Iraq. Nhưng có vẻ cả Tehran lẫn Washington&nbsp;..."
              },
              {
                "title": "Dân Iran nói về vụ nã tên lửa: &#39;Cái tát vào mặt Mỹ&#39; là đủ rồi",
                "timeAgo": "2h ago",
                "source": "Zing.vn",
                "image": {
                  "newsUrl": "https://news.zing.vn/dan-iran-noi-ve-vu-na-ten-lua-cai-tat-vao-mat-my-la-du-roi-post1034209.html",
                  "source": "Zing.vn",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcTsAWwIxagseIzRVs7wY7derF_FKYPJGa26y82MLbxy0eM1fG2o6b7lJwm4XkfO2i0sLTLiKVJx"
                },
                "url": "https://news.zing.vn/dan-iran-noi-ve-vu-na-ten-lua-cai-tat-vao-mat-my-la-du-roi-post1034209.html",
                "snippet": "Người Iran đã chia sẻ nỗi sợ hãi cuộc tấn công tên lửa vào các mục tiêu quân sự ở Iraq có thể dẫn đến cuộc chiến tranh toàn diện giữa Mỹ và Iran và người đau&nbsp;..."
              },
              {
                "title": "Vụ máy bay Ukraine rơi ở Iran: Không có dấu hiệu bị bắn rớt",
                "timeAgo": "7h ago",
                "source": "Tuổi Trẻ Online",
                "url": "https://tuoitre.vn/vu-may-bay-ukraine-roi-o-iran-khong-co-dau-hieu-bi-ban-rot-20200109063128226.htm",
                "snippet": "TTO - Theo đánh giá sơ bộ của các cơ quan tình báo phương Tây, không có dấu hiệu cho thấy chiếc máy bay chở khách Ukraine bị bắn rơi trên bầu trời Iran và&nbsp;..."
              },
              {
                "title": "Iran bắn &#39;một mũi tên trúng hai đích&#39; với Mỹ",
                "timeAgo": "13h ago",
                "source": "VnExpress",
                "image": {
                  "newsUrl": "https://vnexpress.net/the-gioi/iran-ban-mot-mui-ten-trung-hai-dich-voi-my-4039129.html",
                  "source": "VnExpress",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTjy7yF03BGw0Gm8-L71-Ny_rndEuYKZ8g_4fSM0FFPqd_8yGMCLTBUFfXJsyOyJup5wttKkCqO"
                },
                "url": "https://vnexpress.net/the-gioi/iran-ban-mot-mui-ten-trung-hai-dich-voi-my-4039129.html",
                "snippet": "Cuộc tập kích tên lửa của Iran gây ấn tượng cho người dân trong nước về đòn đánh dữ dội, nhưng không gây leo thang căng thẳng với Mỹ. - VnExpress."
              },
              {
                "title": "Ukraine không loại trừ máy bay chở 176 người rơi ở Iran do tên lửa",
                "timeAgo": "15h ago",
                "source": "Zing.vn",
                "url": "https://news.zing.vn/ukraine-khong-loai-tru-may-bay-cho-176-nguoi-roi-o-iran-do-ten-lua-post1034062.html",
                "snippet": "Nhà chức trách Ukraine cho biết không loại trừ khả năng chiếc máy bay Boeing 737 của nước này rơi ở thủ đô Tehran khiến 176 người thiệt mạng đã bị trúng&nbsp;..."
              },
              {
                "title": "Mỹ, Iran cùng dịu giọng, “chảo lửa” Trung Đông hạ nhiệt",
                "timeAgo": "4h ago",
                "source": "VnEconomy",
                "image": {
                  "newsUrl": "http://vneconomy.vn/my-iran-cung-diu-giong-chao-lua-trung-dong-ha-nhiet-20200109085501511.htm",
                  "source": "VnEconomy",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcRLzNt5aCZRAvLEBE0NlzdQm8dcnFQy1JuV2Z0OcevDP_her01MBLnGsYaldct485BnOSGBk6Sm"
                },
                "url": "http://vneconomy.vn/my-iran-cung-diu-giong-chao-lua-trung-dong-ha-nhiet-20200109085501511.htm",
                "snippet": "Cả ông Trump và Iran cùng phát tín hiệu không muốn đẩy căng thẳng lên cao hơn."
              },
              {
                "title": "Máy bay rơi ở Iran: Nghi vấn bao trùm nguyên nhân máy bay rơi 176 ...",
                "timeAgo": "3h ago",
                "source": "Vietnamnet.vn",
                "image": {
                  "newsUrl": "https://vietnamnet.vn/vn/the-gioi/ho-so/may-bay-roi-o-iran-nghi-van-bao-trum-nguyen-nhan-may-bay-roi-176-nguoi-chet-o-iran-607729.html",
                  "source": "Vietnamnet.vn",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcQkPrdFLsrxSeJ_9ruqpyAioJl5yX4BSQKiMo-ametPYi2pXN4SHbqvpyKajsqzbe96acmWqcnr"
                },
                "url": "https://vietnamnet.vn/vn/the-gioi/ho-so/may-bay-roi-o-iran-nghi-van-bao-trum-nguyen-nhan-may-bay-roi-176-nguoi-chet-o-iran-607729.html",
                "snippet": "Máy bay rơi ở Iran: Máy bay chở 176 người rơi ngay sau khi cất cánh từ thủ đô Iran chỉ 3 giờ sau khi Iran phóng nhiều tên lửa vào các mục tiêu quân sự Mỹ ở&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Iran#Iran"
          },
          {
            "title": {
              "query": "Hoa hồng trên Trái tập 45",
              "exploreLink": "/trends/explore?q=Hoa+h%E1%BB%93ng+tr%C3%AAn+Tr%C3%A1i+t%E1%BA%ADp+45&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "50K+",
            "relatedQueries": [
              {
                "query": "hoa hong tren ngưc trai 45",
                "exploreLink": "/trends/explore?q=hoa+hong+tren+ng%C6%B0c+trai+45&date=now+7-d&geo=VN"
              },
              {
                "query": "Hoa Hồng Trên Ngực Trái tập 45",
                "exploreLink": "/trends/explore?q=Hoa+H%E1%BB%93ng+Tr%C3%AAn+Ng%E1%BB%B1c+Tr%C3%A1i+t%E1%BA%ADp+45&date=now+7-d&geo=VN"
              },
              {
                "query": "phim hoa hồng bên trái tập 45",
                "exploreLink": "/trends/explore?q=phim+hoa+h%E1%BB%93ng+b%C3%AAn+tr%C3%A1i+t%E1%BA%ADp+45&date=now+7-d&geo=VN"
              },
              {
                "query": "hoa hồng trên trái tập 46",
                "exploreLink": "/trends/explore?q=hoa+h%E1%BB%93ng+tr%C3%AAn+tr%C3%A1i+t%E1%BA%ADp+46&date=now+7-d&geo=VN"
              },
              {
                "query": "Hoa hồng trên ngực trái tập 46",
                "exploreLink": "/trends/explore?q=Hoa+h%E1%BB%93ng+tr%C3%AAn+ng%E1%BB%B1c+tr%C3%A1i+t%E1%BA%ADp+46&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thanhnien.vn/van-hoa/hoa-hong-tren-nguc-trai-tap-46-khue-thac-mac-bao-dap-lai-rat-ngon-tinh-1169937.html",
              "source": "Báo Thanh Niên",
              "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQCXW-BOzjZ47vi3a1pqAdEDp9xZ1wZhsr9E78FnAHa2s-gyP8KEu1hiljInxutoPkUSs2WHk-f"
            },
            "articles": [
              {
                "title": "Hoa hồng trên ngực trái tập 46: Khuê thắc mắc, Bảo đáp lại rất &#39;ngôn ...",
                "timeAgo": "2h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/van-hoa/hoa-hong-tren-nguc-trai-tap-46-khue-thac-mac-bao-dap-lai-rat-ngon-tinh-1169937.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQCXW-BOzjZ47vi3a1pqAdEDp9xZ1wZhsr9E78FnAHa2s-gyP8KEu1hiljInxutoPkUSs2WHk-f"
                },
                "url": "https://thanhnien.vn/van-hoa/hoa-hong-tren-nguc-trai-tap-46-khue-thac-mac-bao-dap-lai-rat-ngon-tinh-1169937.html",
                "snippet": "Hoa hồng trên ngực trái tập 46: Bé Bống qua cơn nguy kịch; San sinh con; Bảo giải đáp thắc mắc của Khuê bằng sự ngọt ngào…"
              },
              {
                "title": "Hoa Hồng Trên Ngực Trái tập 45 vô lí đến hú hồn: Thái phải chết để ...",
                "timeAgo": "15h ago",
                "source": "Kênh 14",
                "image": {
                  "newsUrl": "http://kenh14.vn/hoa-hong-tren-nguc-trai-tap-45-vo-li-den-hu-hon-thai-chiu-chet-lai-con-hien-song-tim-nguoi-lon-sang-be-bong-day-la-phim-kinh-di-a-20200108224534551.chn",
                  "source": "Kênh 14",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcRKPWon7KTMq-XF63sOfe2tQkp83aFqElZ_gGrVn2eDjrrJK3d4WVK624ZJTlivRSyGaOKhE-i2"
                },
                "url": "http://kenh14.vn/hoa-hong-tren-nguc-trai-tap-45-vo-li-den-hu-hon-thai-chiu-chet-lai-con-hien-song-tim-nguoi-lon-sang-be-bong-day-la-phim-kinh-di-a-20200108224534551.chn",
                "snippet": "Tập 45 Hoa Hồng Trên Ngực Trái lấy đi không ít nước mắt của khán giả bởi việc Thái đã hi sinh để cứu tính mạng bé Bống."
              },
              {
                "title": "Hoa hồng trên ngực trái - Tập 45: Hiến tim cho Bống, Thái ra đi ...",
                "timeAgo": "7h ago",
                "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
                "image": {
                  "newsUrl": "https://vtv.vn/truyen-hinh/hoa-hong-tren-nguc-trai-tap-45-hien-tim-cho-bong-thai-ra-di-thanh-than-nhu-de-chuoc-moi-loi-lam-20200109015633546.htm",
                  "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQhqU48LJGv25p5O2QnqWoYB2AFjCxLAeGL4lj4-Vye-ZvGkBW-RCp-LKoLPR5vLj4tMqg9KbFN"
                },
                "url": "https://vtv.vn/truyen-hinh/hoa-hong-tren-nguc-trai-tap-45-hien-tim-cho-bong-thai-ra-di-thanh-than-nhu-de-chuoc-moi-loi-lam-20200109015633546.htm",
                "snippet": "VTV.vn - Khi Bống rơi vào tình thế nguy kịch trong ca phẫu thuật tim, Thái quyết định hiến tim cho con gái và ra đi thanh thản."
              },
              {
                "title": "Thái qua đời, &#39;Hoa hồng trên ngực trái&#39; đẫm nước mắt",
                "timeAgo": "7h ago",
                "source": "Zing.vn",
                "image": {
                  "newsUrl": "https://news.zing.vn/thai-qua-doi-hoa-hong-tren-nguc-trai-dam-nuoc-mat-post1034110.html",
                  "source": "Zing.vn",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcTNbV-0xhbchpCR0PU2ls-nYhFWvwcKPgbi7zhnwWtbig43CruOjYPooNus2iOTX1NAyrdP9RKe"
                },
                "url": "https://news.zing.vn/thai-qua-doi-hoa-hong-tren-nguc-trai-dam-nuoc-mat-post1034110.html",
                "snippet": "Khi Thái quyết định hiến tim để cứu con gái, nhiều khán giả đã rơi nước mắt vì anh và muốn nói lời tha thứ. Tập 45 Hoa hồng trên ngực trái lên sóng tối 8/1."
              },
              {
                "title": "Hoa hồng trên ngực trái. Hoa hồng trên ngực trái tập 46. Hoa hong ...",
                "timeAgo": "6h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/giai-tri/hoa-hong-tren-nguc-trai-tap-46-tap-cuoi-san-sinh-con-trai-khue-bao-ve-chung-mot-nha-n20200103065737595.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcTBpnwG84wPbXE93e_ENdo8bAj-VxbfuTenN08YDj62mD_uM6crhgLpDp9P_jzYQsDGZ_LlEyFJ"
                },
                "url": "https://thethaovanhoa.vn/giai-tri/hoa-hong-tren-nguc-trai-tap-46-tap-cuoi-san-sinh-con-trai-khue-bao-ve-chung-mot-nha-n20200103065737595.htm",
                "snippet": "(Thethaovanhoa.vn) - Trong phim Hoa hồng trên ngực trái tập 46 - tập cuối: San sinh con trai, Khuê và Bảo sau tất cả cũng đã trở về bên nhau."
              },
              {
                "title": "&quot;Hoa hồng trên ngực trái&quot; tập cuối: Khuê liệu có đến với Bảo?",
                "timeAgo": "6h ago",
                "source": "Báo Lao Động",
                "image": {
                  "newsUrl": "https://laodong.vn/giai-tri/hoa-hong-tren-nguc-trai-tap-cuoi-khue-lieu-co-den-voi-bao-777407.ldo",
                  "source": "Báo Lao Động",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQKH6MXFp7J2PRUn0LPXWzuXgHk6CgHcuHmOvl_o0rGlYK_TFGAWsziJ2XPL93jldG4bY3L4_xi"
                },
                "url": "https://laodong.vn/giai-tri/hoa-hong-tren-nguc-trai-tap-cuoi-khue-lieu-co-den-voi-bao-777407.ldo",
                "snippet": "Ở diễn biến tiếp theo của &quot; Hoa hồng trên ngực trái &quot;, Khuê đã đón mẹ Thái về sống chung trong nhà mới. Vậy liệu cô và Bảo có đến với nhau?"
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Hoa+h%E1%BB%93ng+tr%C3%AAn+Tr%C3%A1i+t%E1%BA%ADp+45#Hoa%20h%E1%BB%93ng%20tr%C3%AAn%20Tr%C3%A1i%20t%E1%BA%ADp%2045"
          },
          {
            "title": {
              "query": "Xem VTV6",
              "exploreLink": "/trends/explore?q=Xem+VTV6&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "20K+",
            "relatedQueries": [
              {
                "query": "lich thi dau u23",
                "exploreLink": "/trends/explore?q=lich+thi+dau+u23&date=now+7-d&geo=VN"
              },
              {
                "query": "lich thi dau u23 chau a 2020",
                "exploreLink": "/trends/explore?q=lich+thi+dau+u23+chau+a+2020&date=now+7-d&geo=VN"
              },
              {
                "query": "VTV6 trực tiếp",
                "exploreLink": "/trends/explore?q=VTV6+tr%E1%BB%B1c+ti%E1%BA%BFp&date=now+7-d&geo=VN"
              },
              {
                "query": "iraq vs australia",
                "exploreLink": "/trends/explore?q=iraq+vs+australia&date=now+7-d&geo=VN"
              },
              {
                "query": "xem trực tiếp vtv6",
                "exploreLink": "/trends/explore?q=xem+tr%E1%BB%B1c+ti%E1%BA%BFp+vtv6&date=now+7-d&geo=VN"
              },
              {
                "query": "U23 Iraq",
                "exploreLink": "/trends/explore?q=U23+Iraq&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/link-xem-truc-tiep-bong-da-vtv6-u23-viet-nam-vs-u23-uae-vck-u23-chau-a-2020-n20200109075140111.htm",
              "source": "Báo Thể thao & Văn hóa",
              "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRDuPEcHGAc65ZrOpjDjRwmc4r5h0RKk_BEKniiTtaN16QPPGExM-iaimJ8MSq4BnEF-0p-DZaq"
            },
            "articles": [
              {
                "title": "Link xem trực tiếp bóng đá VTV6. U23 Việt Nam vs U23 UAE. Trực ...",
                "timeAgo": "6h ago",
                "source": "Báo Thể thao & Văn hóa",
                "image": {
                  "newsUrl": "https://thethaovanhoa.vn/u23-chau-a-2020/link-xem-truc-tiep-bong-da-vtv6-u23-viet-nam-vs-u23-uae-vck-u23-chau-a-2020-n20200109075140111.htm",
                  "source": "Báo Thể thao & Văn hóa",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRDuPEcHGAc65ZrOpjDjRwmc4r5h0RKk_BEKniiTtaN16QPPGExM-iaimJ8MSq4BnEF-0p-DZaq"
                },
                "url": "https://thethaovanhoa.vn/u23-chau-a-2020/link-xem-truc-tiep-bong-da-vtv6-u23-viet-nam-vs-u23-uae-vck-u23-chau-a-2020-n20200109075140111.htm",
                "snippet": "Link xem trực tiếp bóng đá VTV6, lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, lịch bóng đá U23 châu Á, lịch thi đấu VCK U23 châu Á, VTV6, truc tiep&nbsp;..."
              },
              {
                "title": "TRỰC TIẾP VTV6 U23 Australia vs U23 Iraq. Link xem U23 Australia ...",
                "timeAgo": "18h ago",
                "source": "Goal.com",
                "image": {
                  "newsUrl": "https://www.goal.com/vn/tintuc/truc-tiep-vtv6-u23-australia-vs-u23-iraq-link-xem-u23/m5x173h915dy1w20xwe3v99h1",
                  "source": "Goal.com",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcSpoELebvlgdZS2eZifija0Pwv8CpbyFAlZq_fnO33mAEpPYE3u670NqN5FRB2YjtsAqr3gTOIY"
                },
                "url": "https://www.goal.com/vn/tintuc/truc-tiep-vtv6-u23-australia-vs-u23-iraq-link-xem-u23/m5x173h915dy1w20xwe3v99h1",
                "snippet": "U23 Australia vượt lên dẫn trước sau pha đá phạt đẳng cấp của Piscopo song không thể giữ vững lợi dẫn đến phút cuối cùng."
              },
              {
                "title": "Trực tiếp bóng đá U23 châu Á 2020 hôm nay 9/1",
                "timeAgo": "3h ago",
                "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://thethao247.vn/267-u23-chau-a-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-d196493.html",
                  "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQS1EnfsfBgfcxV9r3fx-lcJIvvU2XnRDiSobw9jv3pbIZMTWwxXRCQbOilzx2b6hk4ytiA9Qz-"
                },
                "url": "https://thethao247.vn/267-u23-chau-a-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-d196493.html",
                "snippet": "Cập nhật thời gian, link xem trực tiếp bóng đá U23 châu Á 2020 hôm nay 09/01 trên kênh VTV6. Tâm điểm của ngày thi đấu thứ 2 chính là màn ra quân của U23&nbsp;..."
              },
              {
                "title": "U23 Iraq vs U23 Australia link xem trực tiếp bóng đá VTV6",
                "timeAgo": "21h ago",
                "source": "Bóng đá 24h",
                "image": {
                  "newsUrl": "https://bongda24h.vn/link-xem-truc-tiep-bong-da/vtv6-u23-chau-a-u23-iraq-vs-u23-australia-hom-nay-505-241366.html",
                  "source": "Bóng đá 24h",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcS_ne7vN__lONsoI03A36hBv35f_8rspfSTsVR5BD49QMw21ZbQG5jDOk5e2e3zi53C88ZIYMih"
                },
                "url": "https://bongda24h.vn/link-xem-truc-tiep-bong-da/vtv6-u23-chau-a-u23-iraq-vs-u23-australia-hom-nay-505-241366.html",
                "snippet": "Link xem trực tiếp bóng đá VTV6 U23 Iraq vs U23 Australia 17h15 trận đấu bóng đá vòng bảng U23 Châu Á 2020,tường thuật trực tiếp U23 Iraq vs U23&nbsp;..."
              },
              {
                "title": "FIFA: &#39;U23 Việt Nam là ngựa ô ở VCK U23 châu Á&#39; | Goal.com",
                "timeAgo": "22h ago",
                "source": "VNReview (lời tuyên bố phát cho các báo)",
                "url": "https://vnreview.vn/headlines-detail/-/headline/fifa-u23-viet-nam-la-ngua-o-o-vck-u23-chau-a-goal-com",
                "snippet": "TRỰC TIẾP VTV6 U23 Australia vs U23 Iraq. Link xem U23 Australia vs U23 Iraq. Xem trực tiếp U23 Australia vs U23 Iraq. Trực tiếp bóng đá hôm nay."
              },
              {
                "title": "&#39;Xem trực tiếp U23 Triều Tiên vs U23 Jordan ở đâu?&#39;",
                "timeAgo": "4h ago",
                "source": "Petrotimes",
                "image": {
                  "newsUrl": "https://petrotimes.vn/xem-truc-tiep-u23-trieu-tien-vs-u23-jordan-o-dau-560811.html",
                  "source": "Petrotimes",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcRlL0DOvskKIVHup1P_Fav_AFON4e0dhRauzDGF3hUsriyUTYV2zkcHoNDoWyUY-hs17Yo8RCEy"
                },
                "url": "https://petrotimes.vn/xem-truc-tiep-u23-trieu-tien-vs-u23-jordan-o-dau-560811.html",
                "snippet": "Cập nhật kênh xem trực tiếp U23 Triều Tiên vs U23 Jordan trong khuôn khổ vòng 1 bảng D U23 Châu Á 2020, 20h15 ngày 10/1."
              },
              {
                "title": "Link xem trực tiếp U23 Thái Lan vs U23 Bahrain 20h15 ngày 8/1",
                "timeAgo": "18h ago",
                "source": "Bóng Đá 365",
                "image": {
                  "newsUrl": "https://bongda365.com/link-xem-truc-tiep-u23-thai-lan-vs-u23-bahrain-20h15-ngay-8-1",
                  "source": "Bóng Đá 365",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcRc7DUkQEwbzfTa5NT_4qCT1Plqpgu0FeAbDBNsUoWkP527Q1CWZPzLJvOoZkMvkJVujPrjINLJ"
                },
                "url": "https://bongda365.com/link-xem-truc-tiep-u23-thai-lan-vs-u23-bahrain-20h15-ngay-8-1",
                "snippet": "Link xem trực tiếp trận đấu U23 Thái Lan vs U23 Bahrain lúc 20h15 ngày 8/1 tại bảng A - VCK U23 châu Á 2020. Các bạn click vào link bên dưới để xem trực&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Xem+VTV6#Xem%20VTV6"
          },
          {
            "title": {
              "query": "Hoàng Trung Hải",
              "exploreLink": "/trends/explore?q=Ho%C3%A0ng+Trung+H%E1%BA%A3i&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "20K+",
            "relatedQueries": [
              {
                "query": "Lê Thanh Hải",
                "exploreLink": "/trends/explore?q=L%C3%AA+Thanh+H%E1%BA%A3i&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html",
              "source": "Báo Thanh Niên",
              "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTV0d3Z5cqZseGA-pIwEMPNVk8nwcGaz9C4snlmPufQ_n1ag6E7zapBWlKByh4XWPDGeKi6Vvkn"
            },
            "articles": [
              {
                "title": "Đề nghị kỷ luật Bí thư Thành ủy Hà Nội Hoàng Trung Hải",
                "timeAgo": "7h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcTV0d3Z5cqZseGA-pIwEMPNVk8nwcGaz9C4snlmPufQ_n1ag6E7zapBWlKByh4XWPDGeKi6Vvkn"
                },
                "url": "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html",
                "snippet": "Ủy ban Kiểm tra T.Ư đề nghị Bộ Chính trị xem xét, thi hành kỷ luật theo thẩm quyền đối với ông Hoàng Trung Hải, Ủy viên Bộ Chính trị, Bí thư Thành ủy Hà Nội,&nbsp;..."
              },
              {
                "title": "Việt Nam : Hai ông Hoàng Trung Hải và Lê Thanh Hải bị đề nghị kỷ ...",
                "timeAgo": "16h ago",
                "source": "RFI",
                "image": {
                  "newsUrl": "http://www.rfi.fr/vi/vi%E1%BB%87t-nam/20200108-vi%E1%BB%87t-nam-hai-%C3%B4ng-ho%C3%A0ng-trung-h%E1%BA%A3i-v%C3%A0-l%C3%AA-thanh-h%E1%BA%A3i-b%E1%BB%8B-%C4%91%E1%BB%81-ngh%E1%BB%8B-k%E1%BB%B7-lu%E1%BA%ADt",
                  "source": "RFI",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcRAPd1E01Wy4WOuzqpwEEb4Fp5TyF7CdqBGC6xgDIfWd3fkJi8JW0mxMSyrI6C5k8h7_yA0Uzjv"
                },
                "url": "http://www.rfi.fr/vi/vi%E1%BB%87t-nam/20200108-vi%E1%BB%87t-nam-hai-%C3%B4ng-ho%C3%A0ng-trung-h%E1%BA%A3i-v%C3%A0-l%C3%AA-thanh-h%E1%BA%A3i-b%E1%BB%8B-%C4%91%E1%BB%81-ngh%E1%BB%8B-k%E1%BB%B7-lu%E1%BA%ADt",
                "snippet": "Chiều nay 08/02/2020, Ủy ban Kiểm tra Trung ương đảng Cộng Sản Việt Nam thông báo đã trình lên Bộ Chính trị để xem xét kỷ luật hai quan chức cao cấp là&nbsp;..."
              },
              {
                "title": "Ông Hoàng Trung Hải và Lê Thanh Hải &#39;chờ mức kỷ luật Đảng&#39;",
                "timeAgo": "20h ago",
                "source": "BBC Tiếng Việt",
                "image": {
                  "newsUrl": "https://www.bbc.com/vietnamese/vietnam-51020906",
                  "source": "BBC Tiếng Việt",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcR0nbDfDRcJcqszQC3RdjHBLyDpRUqHOyIZk1VCQhTvl1k3JBWVfnK05y5SMOatSrJIl4iuLFCe"
                },
                "url": "https://www.bbc.com/vietnamese/vietnam-51020906",
                "snippet": "Ông Lê Thanh Hải, từng là một trong những chính khách nổi tiếng và quyền lực nhất Việt Nam, bị Ủy ban Kiểm tra Trung ương nói &quot;phải xem xét kỷ luật&quot;."
              },
              {
                "title": "Xem xét, thi hành kỷ luật ông Hoàng Trung Hải",
                "timeAgo": "20h ago",
                "source": "Báo điện tử Bảo vệ pháp luật (lời tuyên bố phát cho các báo)",
                "url": "https://baovephapluat.vn/kiem-sat-24h/van-de-su-kien/xem-xet-thi-hanh-ky-luat-ong-hoang-trung-hai-81285.html",
                "snippet": "(BVPL) - UBKTTW đề nghị Bộ Chính trị xem xét, thi hành kỷ luật ông Hoàng Trung Hải, Ủy viên Bộ Chính trị, Bí thư Thành ủy Hà Nội, nguyên Ủy viên BCSĐ,&nbsp;..."
              },
              {
                "title": "Ông Hoàng Trung Hải bị đề nghị kỉ luật",
                "timeAgo": "17h ago",
                "source": "Việt Nam Mới",
                "url": "https://vietnammoi.vn/ong-hoang-trung-hai-bi-de-nghi-ki-luat-20200108202153701.htm",
                "snippet": "Ông Hoàng Trung Hải (Bí thư Thành ủy Hà Nội, nguyên Phó thủ tướng) bị đề nghị kỉ luật vì có vi phạm, khuyết điểm liên quan dự án TISCO II."
              },
              {
                "title": "Ông Hoàng Trung Hải bị đề nghị kỷ luật, ông Lê Thanh Hải vi phạm ...",
                "timeAgo": "20h ago",
                "source": "VietTimes",
                "url": "https://viettimes.vn/bi-thu-thanh-uy-ha-noi-hoang-trung-hai-bi-de-nghi-ky-luat-377930.html",
                "snippet": "VietTimes -- Bên cạnh việc đề nghị Bộ Chính trị thi hành kỷ luật Bí thư Thành ủy Hà Nội Hoàng Trung Hải, Ủy ban kiểm tra Trung ương cũng kết luận: nguyên Bí&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Ho%C3%A0ng+Trung+H%E1%BA%A3i#Ho%C3%A0ng%20Trung%20H%E1%BA%A3i"
          },
          {
            "title": {
              "query": "Bóng đá hôm nay",
              "exploreLink": "/trends/explore?q=B%C3%B3ng+%C4%91%C3%A1+h%C3%B4m+nay&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "10K+",
            "relatedQueries": [
              {
                "query": "lịch thi đấu bóng đá u23",
                "exploreLink": "/trends/explore?q=l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+b%C3%B3ng+%C4%91%C3%A1+u23&date=now+7-d&geo=VN"
              }
            ],
            "image": {
              "newsUrl": "https://bongda24h.vn/lich-thi-dau-bong-da/hom-nay-9-1-2020-u23-chau-a-286-241433.html",
              "source": "Bóng đá 24h",
              "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSUbjZR2Zo1okI-F5bjOt0Zh3f4je-T-Zv3-qyuq-O60Kz10HojVP4D75V1QpVCwuqpUA7un9I_"
            },
            "articles": [
              {
                "title": "Lịch thi đấu bóng đá hôm nay 9/1/2020 - LTD U23 châu Á",
                "timeAgo": "5h ago",
                "source": "Bóng đá 24h",
                "image": {
                  "newsUrl": "https://bongda24h.vn/lich-thi-dau-bong-da/hom-nay-9-1-2020-u23-chau-a-286-241433.html",
                  "source": "Bóng đá 24h",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSUbjZR2Zo1okI-F5bjOt0Zh3f4je-T-Zv3-qyuq-O60Kz10HojVP4D75V1QpVCwuqpUA7un9I_"
                },
                "url": "https://bongda24h.vn/lich-thi-dau-bong-da/hom-nay-9-1-2020-u23-chau-a-286-241433.html",
                "snippet": "Lịch thi đấu bóng đá hôm nay 9/1. LTD chi tiết thông tin ngày giờ, kênh phát trực tiếp các trận đấu đáng chú ý diễn ra vào hôm nay, đêm và rạng sáng mai&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=B%C3%B3ng+%C4%91%C3%A1+h%C3%B4m+nay#B%C3%B3ng%20%C4%91%C3%A1%20h%C3%B4m%20nay"
          },
          {
            "title": {
              "query": "Hoàng Cảnh Du",
              "exploreLink": "/trends/explore?q=Ho%C3%A0ng+C%E1%BA%A3nh+Du&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "5K+",
            "relatedQueries": [],
            "image": {
              "newsUrl": "https://thanhnien.vn/van-hoa/dich-le-nhiet-ba-lo-anh-qua-dem-voi-hoang-canh-du-1169647.html",
              "source": "Báo Thanh Niên",
              "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcRQtJxlsTBsoloKsFj4PE5ZH916n5VVvPLYwyyUZZecVIPWOFBY7868G87qc1bx3rTZs_IB-vjB"
            },
            "articles": [
              {
                "title": "Địch Lệ Nhiệt Ba lộ ảnh qua đêm với Hoàng Cảnh Du?",
                "timeAgo": "22h ago",
                "source": "Báo Thanh Niên",
                "image": {
                  "newsUrl": "https://thanhnien.vn/van-hoa/dich-le-nhiet-ba-lo-anh-qua-dem-voi-hoang-canh-du-1169647.html",
                  "source": "Báo Thanh Niên",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcRQtJxlsTBsoloKsFj4PE5ZH916n5VVvPLYwyyUZZecVIPWOFBY7868G87qc1bx3rTZs_IB-vjB"
                },
                "url": "https://thanhnien.vn/van-hoa/dich-le-nhiet-ba-lo-anh-qua-dem-voi-hoang-canh-du-1169647.html",
                "snippet": "Đại mỹ nữ Tân Cương và nam diễn viên phim Thượng Ẩn đang trở thành tâm điểm của làng giải trí Hoa ngữ khi bị bắt gặp qua đêm cùng nhau. Loạt ảnh mới&nbsp;..."
              },
              {
                "title": "Địch Lệ Nhiệt Ba qua đêm nhà Hoàng Cảnh Du",
                "timeAgo": "2h ago",
                "source": "Ngôi Sao",
                "image": {
                  "newsUrl": "https://ngoisao.net/hau-truong/dich-le-nhiet-ba-qua-dem-nha-hoang-canh-du-4039607.html",
                  "source": "Ngôi Sao",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQ4ioL7Hd1-222C1JG3k1ROR_3WASucn2NO7zlPN8XP2yLJkxwTnyzljifTSDGPJ9J6ou-XNOiD"
                },
                "url": "https://ngoisao.net/hau-truong/dich-le-nhiet-ba-qua-dem-nha-hoang-canh-du-4039607.html",
                "snippet": "Sau khi làm việc trên phim trường &#39;Định chế tình yêu cao cấp&#39; hôm 7/1, diễn viên Địch Lệ Nhiệt Ba về nhà Hoàng Cảnh Du và ở lại đó. - Ngôi sao."
              },
              {
                "title": "Địch Lệ Nhiệt Ba xuất hiện sau khi qua đêm ở nhà Hoàng Cảnh Du",
                "timeAgo": "16h ago",
                "source": "Zing.vn",
                "image": {
                  "newsUrl": "https://news.zing.vn/dich-le-nhiet-ba-xuat-hien-sau-khi-qua-dem-o-nha-hoang-canh-du-post1034042.html",
                  "source": "Zing.vn",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcQDrPp-qEISm0ONd0ZL6Py5KPi8kvpCqyf8jM4L_zlrTwUmeM7QIpwFmKHyi_AMpmENMx4qIV_0"
                },
                "url": "https://news.zing.vn/dich-le-nhiet-ba-xuat-hien-sau-khi-qua-dem-o-nha-hoang-canh-du-post1034042.html",
                "snippet": "Địch Lệ Nhiệt Ba khoe đôi vai trần gợi cảm với váy cúp ngực. Nữ diễn viên không phản hồi về tin đồn hẹn hò với bạn diễn Hoàng Cảnh Du."
              },
              {
                "title": "Hôn nhau đắm đuối không rời ở hậu trường, bảo sao Hoàng Cảnh ...",
                "timeAgo": "1d ago",
                "source": "Kênh 14",
                "image": {
                  "newsUrl": "http://kenh14.vn/hon-nhau-dam-duoi-khong-roi-o-hau-truong-bao-sao-hoang-canh-du-va-dich-le-nhiet-ba-khong-phim-gia-tinh-that-20200108101517394.chn",
                  "source": "Kênh 14",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcSHV2UQAoXm0YcatqaKX07qVq5vmg92pqXRgMYsExYbr2p8KmHLPZ5sJ4sgIff8wNQ3edt7qIJt"
                },
                "url": "http://kenh14.vn/hon-nhau-dam-duoi-khong-roi-o-hau-truong-bao-sao-hoang-canh-du-va-dich-le-nhiet-ba-khong-phim-gia-tinh-that-20200108101517394.chn",
                "snippet": "Hoàng Cảnh Du và Địch Lệ Nhiệt Ba rất có thể sau khi quay xong Định Chế Tình Yêu Cao Cấp thì cả 2 sẽ hết độc thân vì đã thuộc về nhau."
              },
              {
                "title": "Địch Lệ Nhiệt Ba lộ ảnh qua đêm cùng Hoàng Cảnh Du",
                "timeAgo": "1d ago",
                "source": "VnExpress iOne",
                "image": {
                  "newsUrl": "https://ione.vnexpress.net/tin-tuc/sao/chau-a/dich-le-nhiet-ba-lo-anh-qua-dem-cung-hoang-canh-du-4039082.html",
                  "source": "VnExpress iOne",
                  "imageUrl": "https://t3.gstatic.com/images?q=tbn:ANd9GcQtcmd4MGK_6z1blKUu6UyYD3Kh1AolJvpZhdV0OJi8mHZZ4rtc0lX2vaZgpOFpgpvIM3ibhgbe"
                },
                "url": "https://ione.vnexpress.net/tin-tuc/sao/chau-a/dich-le-nhiet-ba-lo-anh-qua-dem-cung-hoang-canh-du-4039082.html",
                "snippet": "Hai diễn viên bị paparazzi chộp được hình ảnh &#39;đáng ngờ&#39; trong thời gian quay phim mới &#39;Định chế tình yêu cao cấp&#39;, bị nghi phim giả tình thật."
              },
              {
                "title": "Đây là bộ phim khiến Địch Lệ Nhiệt Ba - Hoàng Cảnh Du rộ tin yêu ...",
                "timeAgo": "1d ago",
                "source": "aFamily (lời tuyên bố phát cho các báo)",
                "image": {
                  "newsUrl": "https://afamily.vn/day-la-bo-phim-khien-dich-le-nhiet-ba-hoang-canh-du-ro-tin-yeu-nhau-tren-phim-truong-con-om-hon-bong-be-cuc-tinh-20200108103926257.chn",
                  "source": "aFamily (lời tuyên bố phát cho các báo)",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcRSVdc9NfCIYN0JCZkqv8Ot1kFd_kItuyMjylNJY27t2-GD9cUiHeaqvt_G92HBZ0KCN4p50F0n"
                },
                "url": "https://afamily.vn/day-la-bo-phim-khien-dich-le-nhiet-ba-hoang-canh-du-ro-tin-yeu-nhau-tren-phim-truong-con-om-hon-bong-be-cuc-tinh-20200108103926257.chn",
                "snippet": "Bộ phim khiến Địch Lệ Nhiệt Ba - Hoàng Cảnh Du vướng tin đồn yêu đương là Định chế tình yêu cao cấp."
              },
              {
                "title": "Hoàng Cảnh Du - Địch Lệ Nhiệt Ba phát sinh &#39;phim giả tình thật&#39;?",
                "timeAgo": "1d ago",
                "source": "Saostar.vn",
                "url": "https://saostar.vn/dien-anh/hoang-canh-du-dich-le-nhiet-ba-phat-sinh-phim-gia-tinh-that-6780543.html",
                "snippet": "Mới đây, truyền thông chụp được những hình ảnh nghi ngờ Hoàng Cảnh Du và Địch Lệ Nhiệt Ba &#39;phim giả tình thật&#39;."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Ho%C3%A0ng+C%E1%BA%A3nh+Du#Ho%C3%A0ng%20C%E1%BA%A3nh%20Du"
          },
          {
            "title": {
              "query": "Elly Trần",
              "exploreLink": "/trends/explore?q=Elly+Tr%E1%BA%A7n&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "5K+",
            "relatedQueries": [],
            "image": {
              "newsUrl": "http://kenh14.vn/elly-tran-va-ha-tang-cung-du-trend-bom-nhung-nhung-nguoi-quyen-ru-bao-liet-nguoi-lai-bien-hoa-khon-luong-20200108155317707.chn",
              "source": "Kênh 14",
              "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcTDhKp02WhJKPFI2kFCSPmgBN5kbePu6ml6SZlzBtS1wCBcE_-t1G6JxDpfvq1baYGQL_GmG48O"
            },
            "articles": [
              {
                "title": "Giữa lúc rộ nghi vấn bị chồng Tây “cắm sừng”, Elly Trần bất ngờ tiết ...",
                "timeAgo": "16h ago",
                "source": "Soha",
                "url": "https://soha.vn/giua-luc-ro-nghi-van-bi-chong-tay-cam-sung-elly-tran-bat-ngo-tiet-lo-tai-khoan-ca-nhan-bi-hack-vi-ly-do-kho-hieu-20200108212033689.htm",
                "snippet": "Chia sẻ mới nhất của Elly Trần tiếp tục làm khán giả hoang mang không hiểu chuyện gì đang xảy ra."
              },
              {
                "title": "Elly Trần nằm khóc trong bóng tối, ẩn ý chồng ngoại tình",
                "timeAgo": "18h ago",
                "source": "Vietnamnet.vn",
                "url": "https://vietnamnet.vn/vn/giai-tri/the-gioi-sao/elly-tran-nam-khoc-trong-bong-toi-an-y-chong-ngoai-tinh-607606.html",
                "snippet": "Mới đây, Elly Trần đăng loạt nội dung tiết lộ tâm trạng tiêu cực, bất ổn. Trong dòng chia sẻ đầu tiên, cựu mẫu nội y cho biết mình đã thức trắng 3 đêm, thể trạng&nbsp;..."
              },
              {
                "title": "Elly Trần và Hà Tăng cùng &quot;đu&quot; trend bờm nhung nhưng người ...",
                "timeAgo": "14h ago",
                "source": "Kênh 14",
                "image": {
                  "newsUrl": "http://kenh14.vn/elly-tran-va-ha-tang-cung-du-trend-bom-nhung-nhung-nguoi-quyen-ru-bao-liet-nguoi-lai-bien-hoa-khon-luong-20200108155317707.chn",
                  "source": "Kênh 14",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcTDhKp02WhJKPFI2kFCSPmgBN5kbePu6ml6SZlzBtS1wCBcE_-t1G6JxDpfvq1baYGQL_GmG48O"
                },
                "url": "http://kenh14.vn/elly-tran-va-ha-tang-cung-du-trend-bom-nhung-nhung-nguoi-quyen-ru-bao-liet-nguoi-lai-bien-hoa-khon-luong-20200108155317707.chn",
                "snippet": "Cùng diện 1 kiểu bờm nhung hot hit nhưng Elly Trần mang đến hình ảnh sexy, còn Hà Tăng khi thì trẻ trung khi lại nền nã."
              },
              {
                "title": "Elly Trần mất niềm tin sau status ẩn ý chồng ngoại tình",
                "timeAgo": "3h ago",
                "source": "2Sao",
                "image": {
                  "newsUrl": "https://2sao.vn/elly-tran-mat-niem-tin-sau-status-an-y-chong-ngoai-tinh-n-207965.html",
                  "source": "2Sao",
                  "imageUrl": "https://t0.gstatic.com/images?q=tbn:ANd9GcSDoO1SNT4dQwvSthl0pgiZ5SPjfTfQrcwGygMnw33-SXaN-5UkrIrA5IDD_yYCqus3jJA77eCq"
                },
                "url": "https://2sao.vn/elly-tran-mat-niem-tin-sau-status-an-y-chong-ngoai-tinh-n-207965.html",
                "snippet": "Elly Trần tiếp tục gây hoang mang khi chia sẻ dòng trạng thái buồn bã giữa tâm bão hôn nhân."
              },
              {
                "title": "Hành động &quot;lạ&quot; của Elly Trần giữa nghi vấn bị chồng &quot;cắm sừng ...",
                "timeAgo": "6h ago",
                "source": "Báo giao thông",
                "image": {
                  "newsUrl": "https://www.baogiaothong.vn/hanh-dong-la-cua-elly-tran-giua-nghi-van-bi-chong-cam-sung-d448448.html",
                  "source": "Báo giao thông",
                  "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcS5P6uwJuP_8vppDyWuvHYpvJzK7lPGaKkx3uiGhACRUD7ckdJUdZjSDza-SeMEcnyimThajViv"
                },
                "url": "https://www.baogiaothong.vn/hanh-dong-la-cua-elly-tran-giua-nghi-van-bi-chong-cam-sung-d448448.html",
                "snippet": "Elly Trần tiếp tục làm khán giả hoang mang không hiểu chuyện gì đang xảy ra sau nghi vấn bị trầm cảm vì chồng ngoại tình. - Báo Giao Thông."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=Elly+Tr%E1%BA%A7n#Elly%20Tr%E1%BA%A7n"
          },
          {
            "title": {
              "query": "The Shining",
              "exploreLink": "/trends/explore?q=The+Shining&date=now+7-d&geo=VN"
            },
            "formattedTraffic": "2K+",
            "relatedQueries": [],
            "image": {
              "newsUrl": "http://mtv.vn/mentv/106742/sao-nhi-the-shining-bi-ca-doan-phim-thong-dong-nhau-lua.html",
              "source": "MEN TV",
              "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRoBtI_U_fdz-gpOSPNQ5b10_-xf2GKVjW2Pvp7hkfTlVdeyMf_dzeBAtnTw_cz7xufQuQh3tcn"
            },
            "articles": [
              {
                "title": "6 tuổi đã bị lừa đóng phim kinh dị, diễn viên nhí The Shining lớn lên ...",
                "timeAgo": "1d ago",
                "source": "Kênh 14",
                "url": "http://kenh14.vn/6-tuoi-da-bi-lua-dong-phim-kinh-di-dien-vien-nhi-the-shining-lon-len-moi-ke-hoi-xua-tuong-do-la-phim-gia-dinh-20200107160950488.chn",
                "snippet": "The Shining - diễn viên nhí 6 tuổi của bộ phim kinh dị này đã bị lừa vì mục đích bảo vệ tâm hồn trẻ thơ."
              },
              {
                "title": "Sao nhí The Shining bị cả đoàn phim thông đồng nhau “lừa”",
                "timeAgo": "1d ago",
                "source": "MEN TV",
                "image": {
                  "newsUrl": "http://mtv.vn/mentv/106742/sao-nhi-the-shining-bi-ca-doan-phim-thong-dong-nhau-lua.html",
                  "source": "MEN TV",
                  "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcRoBtI_U_fdz-gpOSPNQ5b10_-xf2GKVjW2Pvp7hkfTlVdeyMf_dzeBAtnTw_cz7xufQuQh3tcn"
                },
                "url": "http://mtv.vn/mentv/106742/sao-nhi-the-shining-bi-ca-doan-phim-thong-dong-nhau-lua.html",
                "snippet": "Đã 40 năm kể từ lần đầu tựa phim kinh dị The Shining được công chiếu nhưng mới đây người ta mới biết được rằng diễn viên nhí trong bộ phim đã bị đạo diễn&nbsp;..."
              }
            ],
            "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN&tt=The+Shining#The%20Shining"
          }
        ]
      }
    ],
    "endDateForNextRequest": "20200107",
    "rssFeedPageUrl": "https://trends.google.com.vn/trends/trendingsearches/daily/rss?geo=VN"
  }
}
*/
const dailytrends = (opts, callback) => {
	// https://trends.google.com.vn/trends/api/dailytrends?hl=en-US&tz=-420&ed=20200107&geo=VN&ns=15
	// ed=20200107

  opts = Object.assign({}, trendsDefaultOpts, opts);

  let urlDailyTrends = `https://trends.google.com.vn/trends/api/dailytrends?hl=${opts.hl}&tz=${opts.tz}&geo=${opts.geo}&ns=15`;

  if (opts.date) urlDailyTrends += `&ed=${opts.date}`;

  debug('dailytrends url= %s', urlDailyTrends);

	request({
		url: urlDailyTrends,
		method: 'GET',
		headers: {
			'referer': `https://trends.google.com.vn/trends/trendingsearches/daily?geo=${opts.geo}`
		},
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "rss": {
    "$": {
      "xmlns:atom": "http://www.w3.org/2005/Atom",
      "xmlns:ht": "https://trends.google.com.vn/trends/trendingsearches/daily",
      "version": "2.0"
    },
    "channel": [
      {
        "title": [
          "Daily Search Trends"
        ],
        "description": [
          "Recent searches"
        ],
        "link": [
          "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN"
        ],
        "atom:link": [
          {
            "$": {
              "href": "https://trends.google.com.vn/trends/trendingsearches/daily/rss?geo=VN",
              "rel": "self",
              "type": "application/rss+xml"
            }
          }
        ],
        "item": [
          {
            "title": [
              "Đồng Tâm"
            ],
            "ht:approx_traffic": [
              "20,000+"
            ],
            "description": [
              "vụ đồng tâm, đồng tâm miếu môn, đồng tâm mỹ đức, dong tam"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#%C4%90%E1%BB%93ng%20T%C3%A2m"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 08:00:00 +0700"
            ],
            "ht:picture": [
              "https://t2.gstatic.com/images?q=tbn:ANd9GcSDfpGiCjGan6krz1bZg_u5MLbRknCkCPUbAT3SoQ6Im3NqiR1_HsydGpGzf0j8x1-9Jl9rCEBm"
            ],
            "ht:picture_source": [
              "Vietnamnet.vn"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Tình hình Đồng Tâm: 3 chiến sĩ công an hy sinh, 1 đối tượng chống ..."
                ],
                "ht:news_item_snippet": [
                  "Vụ Đồng Tâm - Miếu Môn: 3 chiến sĩ công an hy sinh, 1 đối tượng chống đối chết. Bộ Công phát thông báo về vụ gây rối trật tự công cộng. Sân bay miếu môn."
                ],
                "ht:news_item_url": [
                  "https://vietnamnet.vn/vn/thoi-su/tinh-hinh-dong-tam-3-chien-si-cong-an-hy-sinh-1-doi-tuong-chong-doi-chet-607765.html"
                ],
                "ht:news_item_source": [
                  "Vietnamnet.vn"
                ]
              },
              {
                "ht:news_item_title": [
                  "Ba cảnh sát hy sinh trong vụ đụng độ ở Đồng Tâm"
                ],
                "ht:news_item_snippet": [
                  "Ba cảnh sát hy sinh, một người dân chết và một người bị thương ở Đồng Tâm, Bộ Công an thông báo sáng 9/1. - VnExpress."
                ],
                "ht:news_item_url": [
                  "https://vnexpress.net/thoi-su/ba-canh-sat-hy-sinh-trong-vu-dung-do-o-dong-tam-4039593.html"
                ],
                "ht:news_item_source": [
                  "VnExpress"
                ]
              }
            ]
          },
          {
            "title": [
              "Real Madrid"
            ],
            "ht:approx_traffic": [
              "10,000+"
            ],
            "description": [
              "Real, siêu cúp tây ban nha"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Real%20Madrid"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 01:00:00 +0700"
            ],
            "ht:picture": [
              "https://t0.gstatic.com/images?q=tbn:ANd9GcRcJ68sQqKj0Dmw78LwplX4Mger3BaBaGfGPKYcwy1oqR3ttLc2XE0PjbIWGzuXs9NiBUT7v0mL"
            ],
            "ht:picture_source": [
              "Vietnamnet.vn"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Kết quả Valencia 1-3 Real Madrid: Hẹn Barca ở chung kết Siêu cúp ..."
                ],
                "ht:news_item_snippet": [
                  "Valencia 1-3 Real Madrid: Real Madrid có chiến thắng ấn tượng 3-1 ngay trên sân của Valencia để giành quyền vào chung kết Siêu cúp Tây Ban Nha, gặp chờ&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://vietnamnet.vn/vn/the-thao/bong-da-quoc-te/bong-da-tay-ban-nha/ket-qua-valencia-1-3-real-madrid-hen-barca-o-chung-ket-sieu-cup-tbn-607651.html"
                ],
                "ht:news_item_source": [
                  "Vietnamnet.vn"
                ]
              },
              {
                "ht:news_item_title": [
                  "Đả bại Valencia 3-1, Real Madrid giành vé chơi trận chung kết Siêu ..."
                ],
                "ht:news_item_snippet": [
                  "Kroos (15&#39;), Isco (39&#39;), Modric (65&#39;) thay nhau lập công đã giúp Real đánh bại Valencia 3-1, giành vé vào chơi trận chung kết Siêu cúp Tây Ban Nha."
                ],
                "ht:news_item_url": [
                  "https://laodong.vn/bong-da-quoc-te/da-bai-valencia-3-1-real-madrid-gianh-ve-choi-tran-chung-ket-sieu-cup-777426.ldo"
                ],
                "ht:news_item_source": [
                  "Báo Lao Động"
                ]
              }
            ]
          },
          {
            "title": [
              "Clip Văn Mai Hương camera"
            ],
            "ht:approx_traffic": [
              "10,000+"
            ],
            "description": [
              "văn mai hương lộ clip camera"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Clip%20V%C4%83n%20Mai%20H%C6%B0%C6%A1ng%20camera"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 01:00:00 +0700"
            ],
            "ht:picture": [
              "https://t2.gstatic.com/images?q=tbn:ANd9GcR8KG_J78hBSs5bpB72PDd3xDdEIocA8PFfTRJq-rG6cK9_9GiRdSHj8RkNZi-JjTOSixj53n0A"
            ],
            "ht:picture_source": [
              "Báo Thanh Niên"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Văn Mai Hương lần đầu lên tiếng sau ồn ào lộ clip nóng"
                ],
                "ht:news_item_snippet": [
                  "Sau thời gian vướng ồn ào liên quan đến việc lộ clip nhạy cảm, mới đây, ca sĩ Văn Mai Hương đã có những chia sẻ đầu tiên trên trang cá nhân."
                ],
                "ht:news_item_url": [
                  "https://thanhnien.vn/van-hoa/van-mai-huong-lan-dau-len-tieng-sau-on-ao-lo-clip-nong-1169825.html"
                ],
                "ht:news_item_source": [
                  "Báo Thanh Niên"
                ]
              },
              {
                "ht:news_item_title": [
                  "Văn Mai Hương lần đầu chia sẻ sau vụ lộ clip nhạy cảm"
                ],
                "ht:news_item_snippet": [
                  "Sau nhiều ngày im lặng, ca sĩ Văn Mai Hương đã có những chia sẻ đầu tiên trên trang cá nhân. Cô tâm sự bản thân mạnh mẽ hơn sau biến cố."
                ],
                "ht:news_item_url": [
                  "https://news.zing.vn/van-mai-huong-lan-dau-chia-se-sau-vu-lo-clip-nhay-cam-post1034055.html"
                ],
                "ht:news_item_source": [
                  "Zing.vn"
                ]
              }
            ]
          },
          {
            "title": [
              "Chó Pitbull"
            ],
            "ht:approx_traffic": [
              "5,000+"
            ],
            "description": [
              "Pitbull"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Ch%C3%B3%20Pitbull"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 09:00:00 +0700"
            ],
            "ht:picture": [
              "https://t3.gstatic.com/images?q=tbn:ANd9GcTgkP-fAsIhJbS3Nhk2CVC-mEb79MH5yJHa1Ks1Yiw2nv2VPIcn3lz4J9QyVBRVeDIqib2o4tPr"
            ],
            "ht:picture_source": [
              "Báo Thanh Niên"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Kinh hoàng chó Pitbull tuột xích, cắn nát tay người phụ nữ 79 tuổi ở ..."
                ],
                "ht:news_item_snippet": [
                  "Đang đi đường, một người phụ nữ 79 tuổi ở Quảng Nam bị con chó Pitbull tuột xích hung tợn lao tới cắn xé khiến cánh tay của nạn nhân bị nát."
                ],
                "ht:news_item_url": [
                  "https://thanhnien.vn/thoi-su/kinh-hoang-cho-pitbull-tuot-xich-can-nat-tay-nguoi-phu-nu-79-tuoi-o-quang-nam-1169900.html"
                ],
                "ht:news_item_source": [
                  "Báo Thanh Niên"
                ]
              },
              {
                "ht:news_item_title": [
                  "Chó Pitbull tuột xích, xông ra cắn nát tay người phụ nữ ở Quảng Nam"
                ],
                "ht:news_item_snippet": [
                  "Tối nay, Công an xã Điện Thắng Bắc (thị xã Điện Bàn, Quảng Nam) cho biết, trên địa bàn vừa xảy ra việc 1 phụ nữ bị chó Pitbull xông ra cắn nát tay phải."
                ],
                "ht:news_item_url": [
                  "https://vietnamnet.vn/vn/thoi-su/cho-pitbull-tuot-xich-xong-ra-can-nat-tay-nguoi-phu-nu-o-quang-nam-607644.html"
                ],
                "ht:news_item_source": [
                  "Vietnamnet.vn"
                ]
              }
            ]
          },
          {
            "title": [
              "PSG"
            ],
            "ht:approx_traffic": [
              "5,000+"
            ],
            "description": [
              ""
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#PSG"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 05:00:00 +0700"
            ],
            "ht:picture": [
              "https://t1.gstatic.com/images?q=tbn:ANd9GcQR6Ok62DH7gzzr37vJcq2m3L_nB3K1a5hz1BNZ2orV5tHoFIdXtcKOXS1Pb9K3vry8bdGO9Ika"
            ],
            "ht:picture_source": [
              "Tin tức 24h"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Video highlight trận PSG - St. Etienne: Đại tiệc 7 bàn, rực rỡ Neymar ..."
                ],
                "ht:news_item_snippet": [
                  "Video bóng đá, kết quả bóng đá, PSG - St. Etienne, Cúp Liên đoàn Pháp) Đội bóng thành Paris quyết tâm hướng đến chiến thắng để tiếp đà cho một mùa giải&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://www.24h.com.vn/bong-da/video-highlight-tran-psg-st-etienne-dai-tiec-7-ban-ruc-ro-neymar-icardi-c48a1115243.html"
                ],
                "ht:news_item_source": [
                  "Tin tức 24h"
                ]
              },
              {
                "ht:news_item_title": [
                  "PSG thắng hủy diệt trong ngày ngôi sao gốc Việt nổ súng"
                ],
                "ht:news_item_snippet": [
                  "PSG đã dội &#39;cơn mưa&#39; bàn thắng vào lưới đối thủ tội nghiệp Saint-Etienne trong trận đấu tại vòng tứ kết Cúp Liên đoàn Pháp."
                ],
                "ht:news_item_url": [
                  "https://thethao247.vn/317-psg-thang-huy-diet-trong-ngay-ngoi-sao-goc-viet-no-sung-d196481.html"
                ],
                "ht:news_item_source": [
                  "Thể Thao 247 (lời tuyên bố phát cho các báo)"
                ]
              }
            ]
          },
          {
            "title": [
              "Thời tiết Tết nguyên đán"
            ],
            "ht:approx_traffic": [
              "2,000+"
            ],
            "description": [
              ""
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Th%E1%BB%9Di%20ti%E1%BA%BFt%20T%E1%BA%BFt%20nguy%C3%AAn%20%C4%91%C3%A1n"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 10:00:00 +0700"
            ],
            "ht:picture": [
              "https://t1.gstatic.com/images?q=tbn:ANd9GcT_j15j03Z19Mv3yg4wLDwY6cQRKkFyNIXHCzzSaQDow3G_YDcCWMgwxKT9t-hX0oppRsKNLg6m"
            ],
            "ht:picture_source": [
              "Báo Thể thao & Văn hóa"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Dự báo thời tiết Tết Nguyên đán 2020. Thời tiết Tết Nguyên đán ..."
                ],
                "ht:news_item_snippet": [
                  "(Thethaovanhoa.vn) - Thời kỳ nghỉ Tết Nguyên đán, nhiệt độ dự báo cao hơn trung bình nhiều năm từ 1-2 độ, rét đậm, rét hại nếu có cũng không dài hoặc chỉ&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethaovanhoa.vn/xa-hoi/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-ret-dam-hay-nang-am-n20200109125353749.htm"
                ],
                "ht:news_item_source": [
                  "Báo Thể thao & Văn hóa"
                ]
              },
              {
                "ht:news_item_title": [
                  "Dự báo thời tiết Tết nguyên đán Canh Tý 2020: Miền Bắc có nơi rét ..."
                ],
                "ht:news_item_snippet": [
                  "Dự báo thời tiết Tết nguyên đán Canh Tý 2020: Không khí lạnh tràn về vào khoảng ngày 20-21/1 và cuối tháng, nhưng chỉ gây ra trời rét ở Bắc Bộ, vùng núi có&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://vietnamnet.vn/vn/thoi-su/du-bao-thoi-tiet-tet-nguyen-dan-canh-ty-2020-mien-bac-co-noi-ret-dam-607621.html"
                ],
                "ht:news_item_source": [
                  "Vietnamnet.vn"
                ]
              }
            ]
          },
          {
            "title": [
              "Kỷ luật Phó Thủ tướng Hoàng Trung Hải"
            ],
            "ht:approx_traffic": [
              "2,000+"
            ],
            "description": [
              ""
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#K%E1%BB%B7%20lu%E1%BA%ADt%20Ph%C3%B3%20Th%E1%BB%A7%20t%C6%B0%E1%BB%9Bng%20Ho%C3%A0ng%20Trung%20H%E1%BA%A3i"
            ],
            "pubDate": [
              "Thu, 09 Jan 2020 11:00:00 +0700"
            ],
            "ht:picture": [
              "https://t2.gstatic.com/images?q=tbn:ANd9GcTV0d3Z5cqZseGA-pIwEMPNVk8nwcGaz9C4snlmPufQ_n1ag6E7zapBWlKByh4XWPDGeKi6Vvkn"
            ],
            "ht:picture_source": [
              "Báo Thanh Niên"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Đề nghị kỷ luật Bí thư Thành ủy Hà Nội Hoàng Trung Hải"
                ],
                "ht:news_item_snippet": [
                  "Ủy ban Kiểm tra T.Ư đề nghị Bộ Chính trị xem xét, thi hành kỷ luật theo thẩm quyền đối với ông Hoàng Trung Hải, Ủy viên Bộ Chính trị, Bí thư Thành ủy Hà Nội,&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html"
                ],
                "ht:news_item_source": [
                  "Báo Thanh Niên"
                ]
              },
              {
                "ht:news_item_title": [
                  "Ông Hoàng Trung Hải bị đề nghị kỷ luật, nhiều cán bộ khác bị khai ..."
                ],
                "ht:news_item_snippet": [
                  "(GDVN) - Ông Hoàng Trung Hải (Bí thư Thành ủy Hà Nội, nguyên Phó Thủ tướng Chính phủ) bị đề nghị kỷ luật đã có vi phạm, khuyết điểm liên quan đến Dự án&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://giaoduc.net.vn/tieu-diem/ong-hoang-trung-hai-bi-de-nghi-ky-luat-nhieu-can-bo-khac-bi-khai-tru-dang-post206046.gd"
                ],
                "ht:news_item_source": [
                  "Báo Giáo dục Việt Nam"
                ]
              }
            ]
          },
          {
            "title": [
              "Lịch thi đấu U23"
            ],
            "ht:approx_traffic": [
              "200,000+"
            ],
            "description": [
              "u23 2020 lịch thi đấu, Lịch thi đấu U23 châu Á, lịch thi đấu u23 châu á 2020, U23 châu Á, Lịch thi đấu VCK U23 châu Á, U23, vòng chung kết u23 châu á 2020, xem bóng đá, Kết quả bóng đá U23, lịch thi đấu u23 việt nam, trực tiếp u23 châu á, u23 châu á năm 2020, lịch thi đấu u23 châu á năm 2020, lịch u23, u23 chau a, lịch thi đấu u23 châu á 2020 của việt nam, bóng đá U23, bảng đấu u23 châu á 2020, VCK U23, lịch u23 việt nam đá, trực tiếp u23 châu á 2020, lịch thi đấu vòng chung kết u23 châu á tại thái lan, lich thi dau u23 viet nam, lich u23, u23 châu á lịch thi đấu, chung kết u23 châu á, bong da hom nay, U23 châu Á 2020"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#L%E1%BB%8Bch%20thi%20%C4%91%E1%BA%A5u%20U23"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 01:00:00 +0700"
            ],
            "ht:picture": [
              "https://t0.gstatic.com/images?q=tbn:ANd9GcSbnHL6NNcbNDPCFvmw4vQ92-a6xhwaDsh2iqzrTDtbCSNXsCp7X1L-bb-agTkE2oSXSbtNNfWv"
            ],
            "ht:picture_source": [
              "Báo Thể thao & Văn hóa"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Lịch thi đấu U23 châu Á 2020 trên VTV. Trực tiếp bóng đá. VTV6 ..."
                ],
                "ht:news_item_snippet": [
                  "lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, truc tiep bong da, Uzbekistan vs Iran, Hàn Quốc vs Trung Quốc, Qatar vs Syria, Nhật Bản Saudi Arabia,&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm"
                ],
                "ht:news_item_source": [
                  "Báo Thể thao & Văn hóa"
                ]
              },
              {
                "ht:news_item_title": [
                  "Bóng đá Việt Nam hôm nay. Lịch thi đấu U23 châu Á 2020 trên VTV ..."
                ],
                "ht:news_item_snippet": [
                  "(Thethaovanhoa.vn) - U23 Thái Lan khởi động cho chiến dịch săn vé dự Olympic Tokyo bằng chiến thắng hủy diệt trước Bahrain. Đội bóng của ông Akira&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethaovanhoa.vn/u23-chau-a-2020/de-bep-bahrain-u23-thai-lan-du-suc-vao-chung-ket-nhu-u23-viet-nam-2018-n20200109075753191.htm"
                ],
                "ht:news_item_source": [
                  "Báo Thể thao & Văn hóa"
                ]
              }
            ]
          },
          {
            "title": [
              "Truc tiep bong da hôm nay"
            ],
            "ht:approx_traffic": [
              "100,000+"
            ],
            "description": [
              "thái lan vs bahrain, truc tiep vtv6, U23 Thái Lan vs U23 Bahrain, lich thi dau u23 chau a, u-23 thái lan đấu với u-23 bahrain, Bahrain, truc tiep bong da hom nay, TRỰC TIẾP bóng đá hôm nay, thailand vs bahrain, u23 thailand, trực tiếp vtv6, Thái Lan, thái lan bahrain, lich u23 chau a, lịch u23 châu á, thai lan bahrain, thailand u23, vtv6 trực tiếp bóng đá, thai lan vs bahrain, ket qua u23 chau a, trực tiếp bóng đá việt nam hôm nay, Bảng xếp hạng U23 Châu Á 2020"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Truc%20tiep%20bong%20da%20h%C3%B4m%20nay"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 12:00:00 +0700"
            ],
            "ht:picture": [
              "https://t0.gstatic.com/images?q=tbn:ANd9GcSbnHL6NNcbNDPCFvmw4vQ92-a6xhwaDsh2iqzrTDtbCSNXsCp7X1L-bb-agTkE2oSXSbtNNfWv"
            ],
            "ht:picture_source": [
              "Báo Thể thao & Văn hóa"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Lịch thi đấu U23 châu Á 2020 trên VTV. Trực tiếp bóng đá. VTV6 ..."
                ],
                "ht:news_item_snippet": [
                  "lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, truc tiep bong da, Uzbekistan vs Iran, Hàn Quốc vs Trung Quốc, Qatar vs Syria, Nhật Bản Saudi Arabia,&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethaovanhoa.vn/u23-chau-a-2020/lich-thi-dau-va-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-n20200108235512732.htm"
                ],
                "ht:news_item_source": [
                  "Báo Thể thao & Văn hóa"
                ]
              },
              {
                "ht:news_item_title": [
                  "Trực tiếp bóng đá U23 châu Á 2020 hôm nay 9/1"
                ],
                "ht:news_item_snippet": [
                  "Cập nhật thời gian, link xem trực tiếp bóng đá U23 châu Á 2020 hôm nay 09/01 trên kênh VTV6. Tâm điểm của ngày thi đấu thứ 2 chính là màn ra quân của U23&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethao247.vn/267-u23-chau-a-truc-tiep-bong-da-u23-chau-a-2020-hom-nay-9-1-d196493.html"
                ],
                "ht:news_item_source": [
                  "Thể Thao 247 (lời tuyên bố phát cho các báo)"
                ]
              }
            ]
          },
          {
            "title": [
              "Vtv6"
            ],
            "ht:approx_traffic": [
              "100,000+"
            ],
            "description": [
              "lịch bóng đá u23 châu á, lịch thi đấu bóng đá u23 châu á, lịch bóng đá u23, lịch bóng đá u23 châu á 2020"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Vtv6"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 13:00:00 +0700"
            ],
            "ht:picture": [
              "https://t1.gstatic.com/images?q=tbn:ANd9GcRRqt3HyeTFHtYU_hOCwNpGzWEmQrDVm2_5whhYlYubGFyBObPhGmgzFuDg3yyWKKzS_Ea0GSzx"
            ],
            "ht:picture_source": [
              "Báo Thể thao & Văn hóa"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Bóng đá Việt Nam hôm nay. Lịch thi đấu U23 châu Á 2020 trên VTV ..."
                ],
                "ht:news_item_snippet": [
                  "bong da, bóng đá Việt Nam, lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, lịch bóng đá U23 châu Á, lịch thi đấu VCK U23 châu Á, VTV6, truc tiep&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethaovanhoa.vn/u23-chau-a-2020/u23-jordan-luyen-bai-rat-kho-chiu-dau-u23-viet-nam-n20200107212924825.htm"
                ],
                "ht:news_item_source": [
                  "Báo Thể thao & Văn hóa"
                ]
              }
            ]
          },
          {
            "title": [
              "Iran"
            ],
            "ht:approx_traffic": [
              "100,000+"
            ],
            "description": [
              "iran tấn công mỹ, mỹ iran, mỹ và iran, iran và mỹ, chiến tranh mỹ iran, Iraq, tình hình mỹ và iran, Trump, iran bắn tên lửa, Mỹ, mỹ đánh iran"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Iran"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 10:00:00 +0700"
            ],
            "ht:picture": [
              "https://t1.gstatic.com/images?q=tbn:ANd9GcSH-lqE6_0E9KdDRl4pB6_ybzvuL7Tr4QwhclIgpQQLQ3AHwt42HEihFSZEEbxWM6ZMfiBW-9tV"
            ],
            "ht:picture_source": [
              "Vietnamnet.vn"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Tình hình Mỹ - Iran mới nhất: Lý do thực sự khiến ông Trump hạ lệnh ..."
                ],
                "ht:news_item_snippet": [
                  "Tình hình Mỹ - Iran mới nhất: Với Mỹ hiện là nước xuất khẩu ròng dầu mỏ, và nền kinh tế Iran đang chật vật với lạm phát kỷ lục, Tổng thống Donald Trump đang&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://vietnamnet.vn/vn/the-gioi/binh-luan-quoc-te/tinh-hinh-my-iran-moi-nhat-ly-do-thuc-su-khien-ong-trump-ha-lenh-giet-tuong-iran-soleimani-607450.html"
                ],
                "ht:news_item_source": [
                  "Vietnamnet.vn"
                ]
              },
              {
                "ht:news_item_title": [
                  "Quân đội Iran mạnh cỡ nào?"
                ],
                "ht:news_item_snippet": [
                  "Quân đội Iran sở hữu kho tên lửa đạn đạo lớn nhất Trung Đông, cùng lực lượng Quds tinh nhuệ có mạng lưới rộng khắp khu vực và công nghệ máy bay không&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://news.zing.vn/quan-doi-iran-manh-co-nao-post1034064.html"
                ],
                "ht:news_item_source": [
                  "Zing.vn"
                ]
              }
            ]
          },
          {
            "title": [
              "Hoa hồng trên Trái tập 45"
            ],
            "ht:approx_traffic": [
              "50,000+"
            ],
            "description": [
              "hoa hong tren ngưc trai 45, Hoa Hồng Trên Ngực Trái tập 45, phim hoa hồng bên trái tập 45, hoa hồng trên trái tập 46, Hoa hồng trên ngực trái tập 46"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Hoa%20h%E1%BB%93ng%20tr%C3%AAn%20Tr%C3%A1i%20t%E1%BA%ADp%2045"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 22:00:00 +0700"
            ],
            "ht:picture": [
              "https://t3.gstatic.com/images?q=tbn:ANd9GcQCXW-BOzjZ47vi3a1pqAdEDp9xZ1wZhsr9E78FnAHa2s-gyP8KEu1hiljInxutoPkUSs2WHk-f"
            ],
            "ht:picture_source": [
              "Báo Thanh Niên"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Hoa hồng trên ngực trái tập 46: Khuê thắc mắc, Bảo đáp lại rất &#39;ngôn ..."
                ],
                "ht:news_item_snippet": [
                  "Hoa hồng trên ngực trái tập 46: Bé Bống qua cơn nguy kịch; San sinh con; Bảo giải đáp thắc mắc của Khuê bằng sự ngọt ngào…"
                ],
                "ht:news_item_url": [
                  "https://thanhnien.vn/van-hoa/hoa-hong-tren-nguc-trai-tap-46-khue-thac-mac-bao-dap-lai-rat-ngon-tinh-1169937.html"
                ],
                "ht:news_item_source": [
                  "Báo Thanh Niên"
                ]
              },
              {
                "ht:news_item_title": [
                  "Hoa Hồng Trên Ngực Trái tập 45 vô lí đến hú hồn: Thái phải chết để ..."
                ],
                "ht:news_item_snippet": [
                  "Tập 45 Hoa Hồng Trên Ngực Trái lấy đi không ít nước mắt của khán giả bởi việc Thái đã hi sinh để cứu tính mạng bé Bống."
                ],
                "ht:news_item_url": [
                  "http://kenh14.vn/hoa-hong-tren-nguc-trai-tap-45-vo-li-den-hu-hon-thai-chiu-chet-lai-con-hien-song-tim-nguoi-lon-sang-be-bong-day-la-phim-kinh-di-a-20200108224534551.chn"
                ],
                "ht:news_item_source": [
                  "Kênh 14"
                ]
              }
            ]
          },
          {
            "title": [
              "Xem VTV6"
            ],
            "ht:approx_traffic": [
              "20,000+"
            ],
            "description": [
              "lich thi dau u23, lich thi dau u23 chau a 2020, VTV6 trực tiếp, iraq vs australia, xem trực tiếp vtv6, U23 Iraq"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Xem%20VTV6"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 18:00:00 +0700"
            ],
            "ht:picture": [
              "https://t2.gstatic.com/images?q=tbn:ANd9GcRDuPEcHGAc65ZrOpjDjRwmc4r5h0RKk_BEKniiTtaN16QPPGExM-iaimJ8MSq4BnEF-0p-DZaq"
            ],
            "ht:picture_source": [
              "Báo Thể thao & Văn hóa"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Link xem trực tiếp bóng đá VTV6. U23 Việt Nam vs U23 UAE. Trực ..."
                ],
                "ht:news_item_snippet": [
                  "Link xem trực tiếp bóng đá VTV6, lịch thi đấu U23, lich thi dau U23 chau A 2020 tren VTV, lịch bóng đá U23 châu Á, lịch thi đấu VCK U23 châu Á, VTV6, truc tiep&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethaovanhoa.vn/u23-chau-a-2020/link-xem-truc-tiep-bong-da-vtv6-u23-viet-nam-vs-u23-uae-vck-u23-chau-a-2020-n20200109075140111.htm"
                ],
                "ht:news_item_source": [
                  "Báo Thể thao & Văn hóa"
                ]
              },
              {
                "ht:news_item_title": [
                  "TRỰC TIẾP VTV6 U23 Australia vs U23 Iraq. Link xem U23 Australia ..."
                ],
                "ht:news_item_snippet": [
                  "U23 Australia vượt lên dẫn trước sau pha đá phạt đẳng cấp của Piscopo song không thể giữ vững lợi dẫn đến phút cuối cùng."
                ],
                "ht:news_item_url": [
                  "https://www.goal.com/vn/tintuc/truc-tiep-vtv6-u23-australia-vs-u23-iraq-link-xem-u23/m5x173h915dy1w20xwe3v99h1"
                ],
                "ht:news_item_source": [
                  "Goal.com"
                ]
              }
            ]
          },
          {
            "title": [
              "Hoàng Trung Hải"
            ],
            "ht:approx_traffic": [
              "20,000+"
            ],
            "description": [
              "Lê Thanh Hải"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Ho%C3%A0ng%20Trung%20H%E1%BA%A3i"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 18:00:00 +0700"
            ],
            "ht:picture": [
              "https://t2.gstatic.com/images?q=tbn:ANd9GcTV0d3Z5cqZseGA-pIwEMPNVk8nwcGaz9C4snlmPufQ_n1ag6E7zapBWlKByh4XWPDGeKi6Vvkn"
            ],
            "ht:picture_source": [
              "Báo Thanh Niên"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Đề nghị kỷ luật Bí thư Thành ủy Hà Nội Hoàng Trung Hải"
                ],
                "ht:news_item_snippet": [
                  "Ủy ban Kiểm tra T.Ư đề nghị Bộ Chính trị xem xét, thi hành kỷ luật theo thẩm quyền đối với ông Hoàng Trung Hải, Ủy viên Bộ Chính trị, Bí thư Thành ủy Hà Nội,&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thanhnien.vn/thoi-su/de-nghi-ky-luat-bi-thu-thanh-uy-ha-noi-hoang-trung-hai-1169835.html"
                ],
                "ht:news_item_source": [
                  "Báo Thanh Niên"
                ]
              },
              {
                "ht:news_item_title": [
                  "Việt Nam : Hai ông Hoàng Trung Hải và Lê Thanh Hải bị đề nghị kỷ ..."
                ],
                "ht:news_item_snippet": [
                  "Chiều nay 08/02/2020, Ủy ban Kiểm tra Trung ương đảng Cộng Sản Việt Nam thông báo đã trình lên Bộ Chính trị để xem xét kỷ luật hai quan chức cao cấp là&nbsp;..."
                ],
                "ht:news_item_url": [
                  "http://www.rfi.fr/vi/vi%E1%BB%87t-nam/20200108-vi%E1%BB%87t-nam-hai-%C3%B4ng-ho%C3%A0ng-trung-h%E1%BA%A3i-v%C3%A0-l%C3%AA-thanh-h%E1%BA%A3i-b%E1%BB%8B-%C4%91%E1%BB%81-ngh%E1%BB%8B-k%E1%BB%B7-lu%E1%BA%ADt"
                ],
                "ht:news_item_source": [
                  "RFI"
                ]
              }
            ]
          },
          {
            "title": [
              "Bóng đá hôm nay"
            ],
            "ht:approx_traffic": [
              "10,000+"
            ],
            "description": [
              "lịch thi đấu bóng đá u23"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#B%C3%B3ng%20%C4%91%C3%A1%20h%C3%B4m%20nay"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 14:00:00 +0700"
            ],
            "ht:picture": [
              "https://t0.gstatic.com/images?q=tbn:ANd9GcSUbjZR2Zo1okI-F5bjOt0Zh3f4je-T-Zv3-qyuq-O60Kz10HojVP4D75V1QpVCwuqpUA7un9I_"
            ],
            "ht:picture_source": [
              "Bóng đá 24h"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Lịch thi đấu bóng đá hôm nay 9/1/2020 - LTD U23 châu Á"
                ],
                "ht:news_item_snippet": [
                  "Lịch thi đấu bóng đá hôm nay 9/1. LTD chi tiết thông tin ngày giờ, kênh phát trực tiếp các trận đấu đáng chú ý diễn ra vào hôm nay, đêm và rạng sáng mai&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://bongda24h.vn/lich-thi-dau-bong-da/hom-nay-9-1-2020-u23-chau-a-286-241433.html"
                ],
                "ht:news_item_source": [
                  "Bóng đá 24h"
                ]
              }
            ]
          },
          {
            "title": [
              "Hoàng Cảnh Du"
            ],
            "ht:approx_traffic": [
              "5,000+"
            ],
            "description": [
              ""
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Ho%C3%A0ng%20C%E1%BA%A3nh%20Du"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 13:00:00 +0700"
            ],
            "ht:picture": [
              "https://t0.gstatic.com/images?q=tbn:ANd9GcRQtJxlsTBsoloKsFj4PE5ZH916n5VVvPLYwyyUZZecVIPWOFBY7868G87qc1bx3rTZs_IB-vjB"
            ],
            "ht:picture_source": [
              "Báo Thanh Niên"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Địch Lệ Nhiệt Ba lộ ảnh qua đêm với Hoàng Cảnh Du?"
                ],
                "ht:news_item_snippet": [
                  "Đại mỹ nữ Tân Cương và nam diễn viên phim Thượng Ẩn đang trở thành tâm điểm của làng giải trí Hoa ngữ khi bị bắt gặp qua đêm cùng nhau. Loạt ảnh mới&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thanhnien.vn/van-hoa/dich-le-nhiet-ba-lo-anh-qua-dem-voi-hoang-canh-du-1169647.html"
                ],
                "ht:news_item_source": [
                  "Báo Thanh Niên"
                ]
              },
              {
                "ht:news_item_title": [
                  "Địch Lệ Nhiệt Ba qua đêm nhà Hoàng Cảnh Du"
                ],
                "ht:news_item_snippet": [
                  "Sau khi làm việc trên phim trường &#39;Định chế tình yêu cao cấp&#39; hôm 7/1, diễn viên Địch Lệ Nhiệt Ba về nhà Hoàng Cảnh Du và ở lại đó. - Ngôi sao."
                ],
                "ht:news_item_url": [
                  "https://ngoisao.net/hau-truong/dich-le-nhiet-ba-qua-dem-nha-hoang-canh-du-4039607.html"
                ],
                "ht:news_item_source": [
                  "Ngôi Sao"
                ]
              }
            ]
          },
          {
            "title": [
              "Elly Trần"
            ],
            "ht:approx_traffic": [
              "5,000+"
            ],
            "description": [
              ""
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Elly%20Tr%E1%BA%A7n"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 19:00:00 +0700"
            ],
            "ht:picture": [
              "https://t1.gstatic.com/images?q=tbn:ANd9GcTDhKp02WhJKPFI2kFCSPmgBN5kbePu6ml6SZlzBtS1wCBcE_-t1G6JxDpfvq1baYGQL_GmG48O"
            ],
            "ht:picture_source": [
              "Kênh 14"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Giữa lúc rộ nghi vấn bị chồng Tây “cắm sừng”, Elly Trần bất ngờ tiết ..."
                ],
                "ht:news_item_snippet": [
                  "Chia sẻ mới nhất của Elly Trần tiếp tục làm khán giả hoang mang không hiểu chuyện gì đang xảy ra."
                ],
                "ht:news_item_url": [
                  "https://soha.vn/giua-luc-ro-nghi-van-bi-chong-tay-cam-sung-elly-tran-bat-ngo-tiet-lo-tai-khoan-ca-nhan-bi-hack-vi-ly-do-kho-hieu-20200108212033689.htm"
                ],
                "ht:news_item_source": [
                  "Soha"
                ]
              },
              {
                "ht:news_item_title": [
                  "Elly Trần nằm khóc trong bóng tối, ẩn ý chồng ngoại tình"
                ],
                "ht:news_item_snippet": [
                  "Mới đây, Elly Trần đăng loạt nội dung tiết lộ tâm trạng tiêu cực, bất ổn. Trong dòng chia sẻ đầu tiên, cựu mẫu nội y cho biết mình đã thức trắng 3 đêm, thể trạng&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://vietnamnet.vn/vn/giai-tri/the-gioi-sao/elly-tran-nam-khoc-trong-bong-toi-an-y-chong-ngoai-tinh-607606.html"
                ],
                "ht:news_item_source": [
                  "Vietnamnet.vn"
                ]
              }
            ]
          },
          {
            "title": [
              "The Shining"
            ],
            "ht:approx_traffic": [
              "2,000+"
            ],
            "description": [
              ""
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#The%20Shining"
            ],
            "pubDate": [
              "Wed, 08 Jan 2020 02:00:00 +0700"
            ],
            "ht:picture": [
              "https://t2.gstatic.com/images?q=tbn:ANd9GcRoBtI_U_fdz-gpOSPNQ5b10_-xf2GKVjW2Pvp7hkfTlVdeyMf_dzeBAtnTw_cz7xufQuQh3tcn"
            ],
            "ht:picture_source": [
              "MEN TV"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "6 tuổi đã bị lừa đóng phim kinh dị, diễn viên nhí The Shining lớn lên ..."
                ],
                "ht:news_item_snippet": [
                  "The Shining - diễn viên nhí 6 tuổi của bộ phim kinh dị này đã bị lừa vì mục đích bảo vệ tâm hồn trẻ thơ."
                ],
                "ht:news_item_url": [
                  "http://kenh14.vn/6-tuoi-da-bi-lua-dong-phim-kinh-di-dien-vien-nhi-the-shining-lon-len-moi-ke-hoi-xua-tuong-do-la-phim-gia-dinh-20200107160950488.chn"
                ],
                "ht:news_item_source": [
                  "Kênh 14"
                ]
              },
              {
                "ht:news_item_title": [
                  "Sao nhí The Shining bị cả đoàn phim thông đồng nhau “lừa”"
                ],
                "ht:news_item_snippet": [
                  "Đã 40 năm kể từ lần đầu tựa phim kinh dị The Shining được công chiếu nhưng mới đây người ta mới biết được rằng diễn viên nhí trong bộ phim đã bị đạo diễn&nbsp;..."
                ],
                "ht:news_item_url": [
                  "http://mtv.vn/mentv/106742/sao-nhi-the-shining-bi-ca-doan-phim-thong-dong-nhau-lua.html"
                ],
                "ht:news_item_source": [
                  "MEN TV"
                ]
              }
            ]
          },
          {
            "title": [
              "Man Utd đấu với Man City"
            ],
            "ht:approx_traffic": [
              "100,000+"
            ],
            "description": [
              "MU, Man City, Manchester United, Man Utd, man united vs man. city"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Man%20Utd%20%C4%91%E1%BA%A5u%20v%E1%BB%9Bi%20Man%20City"
            ],
            "pubDate": [
              "Tue, 07 Jan 2020 09:00:00 +0700"
            ],
            "ht:picture": [
              "https://t3.gstatic.com/images?q=tbn:ANd9GcROX4JcFefhwHMDrkWEPqjU88Cewp_7KHXDPlRQ68P-ZoO-5JqXRX0lsMW8J_E3-YrCXA9T1i0r"
            ],
            "ht:picture_source": [
              "Zing.vn"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "MU thua Man City 1-3 ở bán kết cúp liên đoàn"
                ],
                "ht:news_item_snippet": [
                  "Được chơi trên sân nhà nhưng MU lại phải nhận thất bại 1-3 trước Man City ở trận bán kết lượt đi League Cup diễn ra rạng sáng 8/1 (giờ Hà Nội)."
                ],
                "ht:news_item_url": [
                  "https://news.zing.vn/mu-thua-man-city-1-3-o-ban-ket-cup-lien-doan-post1033744.html"
                ],
                "ht:news_item_source": [
                  "Zing.vn"
                ]
              },
              {
                "ht:news_item_title": [
                  "MU thua tan nát trên sân nhà ở bán kết Cúp Liên đoàn"
                ],
                "ht:news_item_snippet": [
                  "Hoàn toàn lép vế so với đối thủ Man City dù được chơi trên sân nhà, MU đứng trước nguy cơ lớn bị loại khỏi Cúp Liên đoàn Anh sau thất bại ở lượt đi vòng bán&nbsp;..."
                ],
                "ht:news_item_url": [
                  "https://thethao247.vn/315-ket-qua-mu-vs-man-city-ban-ket-cup-lien-doan-anh-d196331.html"
                ],
                "ht:news_item_source": [
                  "Thể Thao 247 (lời tuyên bố phát cho các báo)"
                ]
              }
            ]
          },
          {
            "title": [
              "Người Thầy Y Đức"
            ],
            "ht:approx_traffic": [
              "10,000+"
            ],
            "description": [
              "Người Thầy Y Đức 2"
            ],
            "link": [
              "https://trends.google.com.vn/trends/trendingsearches/daily?geo=VN#Ng%C6%B0%E1%BB%9Di%20Th%E1%BA%A7y%20Y%20%C4%90%E1%BB%A9c"
            ],
            "pubDate": [
              "Tue, 07 Jan 2020 21:00:00 +0700"
            ],
            "ht:picture": [
              "https://t0.gstatic.com/images?q=tbn:ANd9GcR-uMm07ofWQ6yLMbuXGml0N-Nw_TEGv0-fU9K3H_mFa1jElIHw3O8Ob23H3VwOEXqv1XSp5inp"
            ],
            "ht:picture_source": [
              "Kênh 14"
            ],
            "ht:news_item": [
              {
                "ht:news_item_title": [
                  "Người Thầy Y Đức 2 vừa phát sóng đã tiễn thẳng Vagabond lẫn VIP ..."
                ],
                "ht:news_item_snippet": [
                  "Bộ phim Người Thầy Y Đức 2 mới chiếu 2 tập đã gần đạt mức rating 20%, nhưng bên cạnh nội dung được đánh giá cao, diễn xuất của nữ chính Lee Sung&nbsp;..."
                ],
                "ht:news_item_url": [
                  "http://kenh14.vn/nguoi-thay-y-duc-2-vua-phat-song-da-tien-thang-vagabond-lan-vip-ra-chuong-ga-mac-lee-sung-kyung-bi-che-dien-do-20200108215653379.chn"
                ],
                "ht:news_item_source": [
                  "Kênh 14"
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
*/
const searchDailyByRss = (opts, callback) => {
	fetchRss({
		link: `https://trends.google.com.vn/trends/trendingsearches/daily/rss?geo=VN`,
	}, callback);
}

/*
{
  "featuredStoryIds": [],
  "trendingStoryIds": [
    "VN_lnk_mArOQQEwAABX-M_vi",
    "VN_lnk_-0_XQQEwAAAtvM_vi",
    "VN_lnk_lRjbQQEwAABP6M_vi",
    "VN_lnk_qVnCQQEwAABqqM_vi",
    "VN_lnk_mJ2YQQEwAAABbM_vi",
    "VN_lnk_ErC-QQEwAACtQM_vi",
    "VN_lnk_cG7HQQEwAAC2nM_vi",
    "VN_lnk_s45zQQEwAADBfM_vi",
    "VN_lnk_EdncQQEwAADMKM_vi",
    "VN_lnk_neDLQQEwAABXEM_vi",
    "VN_lnk_Z4u1QQEwAADTeM_vi",
    "VN_lnk_YzvaQQEwAAC4yM_vi",
    "VN_lnk_zB7LQQEwAAAG7M_vi",
    "VN_lnk_KJvcQQEwAAD1aM_vi",
    "VN_lnk_y6fZQQEwAAATVM_vi",
    "VN_lnk_rfzDQQEwAABvDM_vi",
    "VN_lnk_x0mWQQEwAABQuM_vi",
    "VN_lnk_Md-YQQEwAACoLM_vi",
    "VN_lnk_hhHIQQEwAABP4M_vi",
    "VN_lnk_KsPIQQEwAADjMM_vi",
    "VN_lnk_ELHKQQEwAADbQM_vi",
    "VN_lnk_qxPRQQEwAAB74M_vi",
    "VN_lnk_XCLIQQEwAACV0M_vi",
    "VN_lnk_BAs_QQEwAAA6-M_vi",
    "VN_lnk_Dy3bQQEwAADV3M_vi",
    "VN_lnk_0pLZQQEwAAAKYM_vi",
    "VN_lnk_lxq2QQEwAAAg6M_vi",
    "VN_lnk_a-DWQQEwAAC8EM_vi",
    "VN_lnk_cJfaQQEwAACrZM_vi",
    "VN_lnk_YWXKQQEwAACqlM_vi",
    "VN_lnk_xFnJQQEwAAAMqM_vi",
    "VN_lnk_uireQQEwAABl2M_vi",
    "VN_lnk_wEbZQQEwAAAYtM_vi",
    "VN_lnk_VDXbQQEwAACOxM_vi",
    "VN_lnk_u1LOQQEwAAB0oM_vi",
    "VN_lnk_s9KXQQEwAAAlIM_vi",
    "VN_lnk_C_zCQQEwAADIDM_vi",
    "VN_lnk_qpjLQQEwAABgaM_vi",
    "VN_lnk_PSasQQEwAACQ1M_vi",
    "VN_lnk_a7nWQQEwAAC8SM_vi",
    "VN_lnk_IH7cQQEwAAD9jM_vi",
    "VN_lnk_20_YQQEwAAACvM_vi",
    "VN_lnk_5n7KQQEwAAAtjM_vi",
    "VN_lnk_V9jdQQEwAACLKM_vi",
    "VN_lnk_eCbGQQEwAAC_1M_vi",
    "VN_lnk_gnq5QQEwAAA6iM_vi",
    "VN_lnk_85jGQQEwAAA0aM_vi",
    "VN_lnk_X8bHQQEwAACZNM_vi",
    "VN_lnk_efSwQQEwAADIBM_vi",
    "VN_lnk_yyKQQQEwAABa0M_vi",
    "VN_lnk_atzLQQEwAACgLM_vi",
    "VN_lnk_8w3HQQEwAAA1_M_vi",
    "VN_lnk_i_HLQQEwAABBAM_vi",
    "VN_lnk_ovrAQQEwAABjCM_vi",
    "VN_lnk_KBOqQQEwAACD4M_vi",
    "VN_lnk_eunXQQEwAACsGM_vi",
    "VN_lnk_JLnBQQEwAADkSM_vi",
    "VN_lnk_VX-3QQEwAADjjM_vi",
    "VN_lnk_ZRzRQQEwAAC17M_vi",
    "VN_lnk_fFLbQQEwAACmoM_vi",
    "VN_lnk_K3zCQQEwAADojM_vi",
    "VN_lnk_HnHZQQEwAADGgM_vi",
    "VN_lnk_nD_aQQEwAABHzM_vi",
    "VN_lnk_SfDKQQEwAACCAM_vi",
    "VN_lnk_Rc2ZQQEwAADdPM_vi",
    "VN_lnk_C5BnQQEwAABtYM_vi",
    "VN_lnk_3VTWQQEwAAAKpM_vi",
    "VN_lnk_uq_DQQEwAAB4XM_vi",
    "VN_lnk_y03AQQEwAAAKvM_vi",
    "VN_lnk_EoXQQQEwAADDdM_vi",
    "VN_lnk_yrGyQQEwAAB5QM_vi",
    "VN_lnk_Gh2eQQEwAACF7M_vi",
    "VN_lnk_Ieu_QQEwAACfGM_vi",
    "VN_lnk_XivPQQEwAACQ2M_vi",
    "VN_lnk_TefDQQEwAACPFM_vi",
    "VN_lnk_SzrYQQEwAACSyM_vi",
    "VN_lnk_hOhsQQEwAADpGM_vi",
    "VN_lnk_QsysQQEwAADvPM_vi",
    "VN_lnk_HdG_QQEwAACjIM_vi",
    "VN_lnk_o9OyQQEwAAAQIM_vi",
    "VN_lnk_9vbUQQEwAAAjBM_vi",
    "VN_lnk_G0zKQQEwAADQvM_vi",
    "VN_lnk_maXXQQEwAABPVM_vi",
    "VN_lnk_W3qSQQEwAADIiM_vi",
    "VN_lnk_IiC_QQEwAACc0M_vi",
    "VN_lnk_o-mpQQEwAAALGM_vi",
    "VN_lnk_hwZNQQEwAADL9M_vi",
    "VN_lnk_fqzMQQEwAACzXM_vi",
    "VN_lnk_JdfJQQEwAADtJM_vi",
    "VN_lnk_8sV8QQEwAACPNM_vi",
    "VN_lnk_LLbYQQEwAAD1RM_vi",
    "VN_lnk_ZnfbQQEwAAC8hM_vi",
    "VN_lnk_d3neQQEwAACoiM_vi",
    "VN_lnk_CKmvQQEwAACmWM_vi",
    "VN_lnk_0SLHQQEwAAAX0M_vi",
    "VN_lnk_dsjEQQEwAACzOM_vi",
    "VN_lnk_4lDIQQEwAAAroM_vi",
    "VN_lnk_WEmvQQEwAAD2uM_vi",
    "VN_lnk_CoPEQQEwAADPcM_vi",
    "VN_lnk_ToOrQQEwAADkcM_vi",
    "VN_lnk_2QzDQQEwAAAb_M_vi",
    "VN_lnk_S8bHQQEwAACNNM_vi",
    "VN_lnk_ajvaQQEwAACxyM_vi",
    "VN_lnk_fJzHQQEwAAC6bM_vi",
    "VN_lnk_OwLdQQEwAADn8M_vi",
    "VN_lnk_bfPCQQEwAACuAM_vi",
    "VN_lnk_bPXNQQEwAACgBM_vi",
    "VN_lnk_CBu6QQEwAACz6M_vi",
    "VN_lnk_sCvFQQEwAAB02M_vi",
    "VN_lnk_oaePQQEwAAAvVM_vi",
    "VN_lnk_5kK_QQEwAABYsM_vi",
    "VN_lnk_TvHLQQEwAACEAM_vi",
    "VN_lnk_p0vXQQEwAABxuM_vi",
    "VN_lnk_o0bMQQEwAAButM_vi",
    "VN_lnk_h-jGQQEwAABAGM_vi",
    "VN_lnk_FTLRQQEwAADFwM_vi",
    "VN_lnk_ZhLWQQEwAACx4M_vi",
    "VN_lnk_i3mXQQEwAAAdiM_vi",
    "VN_lnk_0XGSQQEwAABCgM_vi",
    "VN_lnk_xmLSQQEwAAAVkM_vi",
    "VN_lnk_eZrDQQEwAAC7aM_vi",
    "VN_lnk_pT7RQQEwAAB1zM_vi",
    "VN_lnk_NQLJQQEwAAD98M_vi",
    "VN_lnk_EP7IQQEwAADZDM_vi",
    "VN_lnk_d3PbQQEwAACtgM_vi",
    "VN_lnk__znWQQEwAAAoyM_vi",
    "VN_lnk_q2TZQQEwAABzlM_vi",
    "VN_lnk_MoJpQQEwAABacM_vi",
    "VN_lnk_11iGQQEwAABQqM_vi",
    "VN_lnk_xv7WQQEwAAARDM_vi",
    "VN_lnk__YnWQQEwAAAqeM_vi",
    "VN_lnk_G0nPQQEwAADVuM_vi",
    "VN_lnk_1wZyQQEwAACk9M_vi",
    "VN_lnk_opPTQQEwAABwYM_vi",
    "VN_lnk_gObPQQEwAABOFM_vi",
    "VN_lnk_1KekQQEwAABxVM_vi",
    "VN_lnk_1_jKQQEwAAAcCM_vi",
    "VN_lnk__5fbQQEwAAAlZM_vi",
    "VN_lnk_JBHDQQEwAADm4M_vi",
    "VN_lnk_DsF7QQEwAAB0MM_vi",
    "VN_lnk_9n7KQQEwAAA9jM_vi",
    "VN_lnk_DSaRQQEwAACd1M_vi",
    "VN_lnk_TSrBQQEwAACN2M_vi",
    "VN_lnk_84_HQQEwAAA1fM_vi",
    "VN_lnk_xGfOQQEwAAALlM_vi",
    "VN_lnk_qKCQQQEwAAA5UM_vi",
    "VN_lnk_27ySQQEwAABITM_vi",
    "VN_lnk_b3PbQQEwAAC1gM_vi",
    "VN_lnk_Q23EQQEwAACGnM_vi",
    "VN_lnk_8T_IQQEwAAA4zM_vi",
    "VN_lnk_q73KQQEwAABgTM_vi",
    "VN_lnk_lLTZQQEwAABMRM_vi",
    "VN_lnk_XIDCQQEwAACfcM_vi",
    "VN_lnk_gSfFQQEwAABF1M_vi",
    "VN_lnk_-uhnQQEwAACcGM_vi",
    "VN_lnk_LEClQQEwAACIsM_vi",
    "VN_lnk_IRDbQQEwAAD74M_vi",
    "VN_lnk_WJvZQQEwAACAaM_vi",
    "VN_lnk_S1uuQQEwAADkqM_vi",
    "VN_lnk_5vnLQQEwAAAsCM_vi",
    "VN_lnk_vdXPQQEwAABzJM_vi",
    "VN_lnk_kYPbQQEwAABLcM_vi",
    "VN_lnk_gIPIQQEwAABJcM_vi",
    "VN_lnk_0RPRQQEwAAAB4M_vi",
    "VN_lnk_ZC7CQQEwAACn3M_vi",
    "VN_lnk_phnGQQEwAABh6M_vi",
    "VN_lnk_QKjbQQEwAACaWM_vi",
    "VN_lnk_OaXLQQEwAADzVM_vi",
    "VN_lnk_gUbEQQEwAABEtM_vi",
    "VN_lnk_x2LSQQEwAAAUkM_vi",
    "VN_lnk_65LcQQEwAAA2YM_vi",
    "VN_lnk_rYTCQQEwAABudM_vi",
    "VN_lnk_ZRrLQQEwAACv6M_vi",
    "VN_lnk_UIGsQQEwAAD9cM_vi",
    "VN_lnk_WSLDQQEwAACb0M_vi",
    "VN_lnk_BevFQQEwAADBGM_vi",
    "VN_lnk_8xjCQQEwAAAw6M_vi",
    "VN_lnk_Sz3OQQEwAACEzM_vi",
    "VN_lnk_iYfHQQEwAABPdM_vi",
    "VN_lnk_-MvXQQEwAAAuOM_vi",
    "VN_lnk_mp2_QQEwAAAkbM_vi",
    "VN_lnk_hgyTQQEwAAAU_M_vi",
    "VN_lnk_Vde1QQEwAADhJM_vi",
    "VN_lnk_MS3bQQEwAADr3M_vi",
    "VN_lnk_MPDJQQEwAAD4AM_vi",
    "VN_lnk_POy-QQEwAACDHM_vi",
    "VN_lnk_L6jWQQEwAAD4WM_vi",
    "VN_lnk_3wTaQQEwAAAE9M_vi",
    "VN_lnk_8JfVQQEwAAAkZM_vi",
    "VN_lnk_tjfDQQEwAAB0xM_vi",
    "VN_lnk_PjfCQQEwAAD9xM_vi",
    "VN_lnk_BV3aQQEwAADerM_vi",
    "VN_lnk_ypPKQQEwAAABYM_vi",
    "VN_lnk_5N6vQQEwAABKLM_vi",
    "VN_lnk_LqHGQQEwAADpUM_vi",
    "VN_lnk_enLLQQEwAACwgM_vi",
    "VN_lnk__DLKQQEwAAA3wM_vi",
    "VN_lnk_T3_HQQEwAACJjM_vi",
    "VN_lnk_n_3MQQEwAABSDM_vi",
    "VN_lnk_quDIQQEwAABjEM_vi",
    "VN_lnk_CF7JQQEwAADArM_vi",
    "VN_lnk_7rrXQQEwAAA4SM_vi",
    "VN_lnk_lD3EQQEwAABRzM_vi",
    "VN_lnk_RmfDQQEwAACElM_vi",
    "VN_lnk_88jFQQEwAAA3OM_vi",
    "VN_lnk_M0TCQQEwAADwtM_vi",
    "VN_lnk_XijEQQEwAACb2M_vi",
    "VN_lnk_IJPMQQEwAADtYM_vi",
    "VN_lnk_8yPEQQEwAAA20M_vi",
    "VN_lnk__k29QQEwAABCvM_vi",
    "VN_lnk_TIXBQQEwAACMdM_vi",
    "VN_lnk_yi_AQQEwAAAL3M_vi",
    "VN_lnk_McvWQQEwAADmOM_vi",
    "VN_lnk_2ZPbQQEwAAADYM_vi",
    "VN_lnk_m0iyQQEwAAAouM_vi",
    "VN_lnk_67yVQQEwAAB_TM_vi",
    "VN_lnk_lcvYQQEwAABMOM_vi",
    "VN_lnk_YuWoQQEwAADLFM_vi",
    "VN_lnk_IL7AQQEwAADhTM_vi",
    "VN_lnk_UdSuQQEwAAD-JM_vi",
    "VN_lnk_6jtkQQEwAACPyM_vi",
    "VN_lnk_bubVQQEwAAC6FM_vi",
    "VN_lnk_ahvJQQEwAACi6M_vi",
    "VN_lnk_JdF2QQEwAABSIM_vi",
    "VN_lnk_EbC-QQEwAACuQM_vi",
    "VN_lnk_hB_JQQEwAABM7M_vi",
    "VN_lnk_rRnDQQEwAABv6M_vi",
    "VN_lnk_lHPCQQEwAABXgM_vi",
    "VN_lnk_7j2wQQEwAABfzM_vi",
    "VN_lnk_7uiyQQEwAABdGM_vi",
    "VN_lnk_aPfCQQEwAACrBM_vi",
    "VN_lnk_nGrJQQEwAABUmM_vi",
    "VN_lnk_n0LZQQEwAABHsM_vi",
    "VN_lnk_0KDHQQEwAAAWUM_vi",
    "VN_lnk_UufZQQEwAACKFM_vi",
    "VN_lnk_O-LCQQEwAAD4EM_vi",
    "VN_lnk_7yy7QQEwAABV3M_vi",
    "VN_lnk_dz3OQQEwAAC4zM_vi",
    "VN_lnk_gwWyQQEwAAAw9M_vi",
    "VN_lnk_QwG5QQEwAAD78M_vi",
    "VN_lnk_m_jDQQEwAABZCM_vi",
    "VN_lnk_8a-CQQEwAAByXM_vi",
    "VN_lnk_kArJQQEwAABY-M_vi",
    "VN_lnk_6MTbQQEwAAAyNM_vi",
    "VN_lnk_DMbQQQEwAADdNM_vi",
    "VN_lnk_kGHIQQEwAABZkM_vi",
    "VN_lnk_8ZLNQQEwAAA9YM_vi",
    "VN_lnk_YbPCQQEwAACiQM_vi",
    "VN_lnk_-q53QQEwAACMXM_vi",
    "VN_lnk_7_69QQEwAABTDM_vi",
    "VN_lnk_BJjYQQEwAADdaM_vi",
    "VN_lnk_eVPMQQEwAAC0oM_vi",
    "VN_lnk_-X6lQQEwAABdjM_vi",
    "VN_lnk_0QDFQQEwAAAV8M_vi",
    "VN_lnk_qj7WQQEwAAB9zM_vi",
    "VN_lnk_ea3YQQEwAACgXM_vi",
    "VN_lnk_piGaQQEwAAA90M_vi",
    "VN_lnk_W6HEQQEwAACeUM_vi",
    "VN_lnk_Ao95QQEwAAB6fM_vi",
    "VN_lnk_WRXGQQEwAACe5M_vi",
    "VN_lnk_ILaRQQEwAACwRM_vi",
    "VN_lnk_tOLEQQEwAABxEM_vi",
    "VN_lnk_C7awQQEwAAC6RM_vi",
    "VN_lnk_6ZPbQQEwAAAzYM_vi",
    "VN_lnk_kyvAQQEwAABS2M_vi",
    "VN_lnk_WdTXQQEwAACPJM_vi",
    "VN_lnk_CQWsQQEwAACk9M_vi",
    "VN_lnk_Gc-rQQEwAACzPM_vi",
    "VN_lnk_ezjJQQEwAACzyM_vi",
    "VN_lnk_1kynQQEwAABwvM_vi",
    "VN_lnk_WTbXQQEwAACPxM_vi",
    "VN_lnk_qSPEQQEwAABs0M_vi",
    "VN_lnk_ZkTGQQEwAAChtM_vi",
    "VN_lnk_-CHGQQEwAAA_0M_vi",
    "VN_lnk_bF3HQQEwAACqrM_vi",
    "VN_lnk_f__aQQEwAACkDM_vi",
    "VN_lnk_JO_FQQEwAADgHM_vi",
    "VN_lnk_z7SqQQEwAABkRM_vi",
    "VN_lnk_lKHRQQEwAABEUM_vi",
    "VN_lnk_ppKpQQEwAAAOYM_vi",
    "VN_lnk_NnfJQQEwAAD-hM_vi",
    "VN_lnk_AYWuQQEwAACudM_vi",
    "VN_lnk_V3K_QQEwAADpgM_vi",
    "VN_lnk_Tp_BQQEwAACObM_vi",
    "VN_lnk_N6jaQQEwAADsWM_vi",
    "VN_lnk_1cO2QQEwAABiMM_vi",
    "VN_lnk_rhywQQEwAAAf7M_vi",
    "VN_lnk_hS_PQQEwAABL3M_vi",
    "VN_lnk_6TLCQQEwAAAqwM_vi",
    "VN_lnk_hHLKQQEwAABPgM_vi",
    "VN_lnk_X4ywQQEwAADufM_vi",
    "VN_lnk_Qu2yQQEwAADxHM_vi",
    "VN_lnk_lfGuQQEwAAA6AM_vi",
    "VN_lnk_fFPEQQEwAAC5oM_vi",
    "VN_lnk_XMibQQEwAADGOM_vi",
    "VN_lnk_MN60QQEwAACFLM_vi",
    "VN_lnk_yiTYQQEwAAAT1M_vi",
    "VN_lnk_3wDKQQEwAAAU8M_vi",
    "VN_lnk_bYe1QQEwAADZdM_vi",
    "VN_lnk_7oPGQQEwAAApcM_vi"
  ],
  "storySummaries": {
    "featuredStories": [],
    "trendingStories": [
      {
        "image": {
          "newsUrl": "https://2sao.vn/chang-viet-kieu-cho-10-nam-de-cuoi-hoang-oanh-mat-ngoc-n-207952.html",
          "source": "2Sao",
          "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcT9YZf_s_SH4dLkHt_NxRDxB3cDFIyBWnG4fenQfQCplT5Zpkulfr1yOJCO38sgTc8IGST1Ud4nFAg"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_-0_XQQEwAAAtvM_vi&category=all&geo=VN#VN_lnk_-0_XQQEwAAAtvM_vi",
        "articles": [
          {
            "articleTitle": "Chàng Việt kiều chờ 10 năm để cưới Hoàng Oanh &#39;Mắt Ngọc&#39;",
            "url": "https://2sao.vn/chang-viet-kieu-cho-10-nam-de-cuoi-hoang-oanh-mat-ngoc-n-207952.html",
            "source": "2Sao",
            "time": "8 hours ago",
            "snippet": "Thất bại ở lần tỏ tình đầu tiên, chàng trai người Mỹ gốc Việt vẫn nuôi hy vọng để chục năm sau trở lại ngỏ lời yêu và xin cưới Hoàng Oanh làm vợ."
          },
          {
            "articleTitle": "Hơn 1 năm qua Mỹ định cư cùng chồng, cuộc sống của ca sĩ Hoàng Oanh &#39;Mắt Ngọc&#39; giờ ra sao?",
            "url": "https://ngoisao.vn/hau-truong/chuyen-lang-sao/cuoc-song-o-my-cua-ca-si-hoang-oanh-mat-ngoc-gio-ra-sao-283907.htm",
            "source": "Ngôi Sao VN (lời tuyên bố phát cho các báo)",
            "time": "11 minutes ago",
            "snippet": "Sau 10 năm chờ đợi cuối cùng chàng trai người Mỹ gốc Việt đã được Hoàng Oanh &quot;Mắt Ngọc&quot; đồng ý làm vợ. Hiện tại, cặp đôi đang có cuộc sống hạnh phúc tại Mỹ."
          }
        ],
        "idsForDedup": [
          "/g/11c74_75wn /m/0125x_3j",
          "/g/11c74_75wn /m/01crd5",
          "/g/11c74_75wn /m/0q3yz5j",
          "/m/0125x_3j /m/01crd5",
          "/m/0125x_3j /m/0q3yz5j",
          "/m/01crd5 /m/0q3yz5j"
        ],
        "id": "VN_lnk_-0_XQQEwAAAtvM_vi",
        "title": "Mắt Ngọc, Hoang Oanh, Vietnam, Ngoc",
        "entityNames": [
          "Mắt Ngọc",
          "Hoang Oanh",
          "Vietnam",
          "Ngoc"
        ]
      },
      {
        "image": {
          "newsUrl": "https://www.bbc.com/vietnamese/vietnam-51043856",
          "source": "BBC Tiếng Việt",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcSTtNXK166_WcdxjslayHAb6NMCdcqTHZ5S6IhxeePn3lhZnGS6jjV8CsxWWRxvpVhvV2BvYRdF8Cg"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_lRjbQQEwAABP6M_vi&category=all&geo=VN#VN_lnk_lRjbQQEwAABP6M_vi",
        "articles": [
          {
            "articleTitle": "Tranh chấp đất Đồng Tâm: Máu đổ, người chết",
            "url": "https://www.bbc.com/vietnamese/vietnam-51043856",
            "source": "BBC Tiếng Việt",
            "time": "2 hours ago",
            "snippet": "Nhân chứng nói dân ném bom xăng khi hàng ngàn cảnh sát đổ về Đồng Tâm đêm 9/1. Bộ Công an xác nhận 3 cảnh sát, 1 người dân thiệt mạng."
          },
          {
            "articleTitle": "Vụ Đồng Tâm diễn ra như thế nào trong những năm qua?",
            "url": "https://vietnamfinance.vn/vu-dong-tam-dien-ra-nhu-the-nao-trong-nhung-nam-qua-20180504224233442.htm",
            "source": "VietnamFinance (lời tuyên bố phát cho các báo) (Blog)",
            "time": "7 minutes ago",
            "snippet": "(VNF) - Biến cố ở thôn Hoành, xã Đồng Tâm, huyện Mỹ Đức, Hà Nội bắt nguồn từ tranh chấp đất đai kéo dài nhiều năm và trở thành điểm nóng khi người dân xã Đồng Tâm cho rằng, hàng chục ha đất đồng Sênh là đất nông nghiệp của xã chứ không phải đất&nbsp;..."
          }
        ],
        "idsForDedup": [
          "/g/11c75_smgk /g/121tc0bl",
          "/g/11c75_smgk /g/1tgrzdh2",
          "/g/11c75_smgk /m/01crd5",
          "/g/11c75_smgk /m/0fnff",
          "/g/121tc0bl /g/1tgrzdh2",
          "/g/121tc0bl /m/01crd5",
          "/g/121tc0bl /m/0fnff",
          "/g/1tgrzdh2 /m/01crd5",
          "/g/1tgrzdh2 /m/0fnff",
          "/m/01crd5 /m/0fnff"
        ],
        "id": "VN_lnk_lRjbQQEwAABP6M_vi",
        "title": "Đồng Tâm, 2017 Hanoi hostage crisis, Vietnam, Hanoi",
        "entityNames": [
          "Đồng Tâm",
          "2017 Hanoi hostage crisis",
          "Vietnam",
          "Hanoi"
        ]
      },
      {
        "image": {
          "newsUrl": "http://baochinhphu.vn/Phap-luat/Khong-de-ton-tai-cac-bang-o-nhom-toi-pham-o-Ha-Noi/384608.vgp",
          "source": "ONLINE NEWSPAPER OF THE GOVERNMENT OF THE SOCIALIST REPUBLIC OF VIET NAM (lời tuyên bố phát cho các báo)",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcT9YITGDvH71JC2QvABygF7dktytPjLkcwUPQVFGq_0jFHIJB03SF5L-izpB1HRIK5YLdnrKvRZAd0"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_qVnCQQEwAABqqM_vi&category=all&geo=VN#VN_lnk_qVnCQQEwAABqqM_vi",
        "articles": [
          {
            "articleTitle": "Không để tồn tại các băng, ổ nhóm tội phạm ở Hà Nội",
            "url": "http://baochinhphu.vn/Phap-luat/Khong-de-ton-tai-cac-bang-o-nhom-toi-pham-o-Ha-Noi/384608.vgp",
            "source": "ONLINE NEWSPAPER OF THE GOVERNMENT OF THE SOCIALIST REPUBLIC OF VIET NAM (lời tuyên bố phát cho các báo)",
            "time": "5 hours ago",
            "snippet": "(Chinhphu.vn) - Ngày 8/1, công an thành phố Hà Nội tổ chức hội nghị tổng kết công tác công an năm 2019 và triển khai chương trình công tác công an năm 2020. Dự và chỉ đạo hội nghị có Đại tướng Tô Lâm, Ủy viên Bộ Chính trị, Bí thư Đảng ủy Công an&nbsp;..."
          },
          {
            "articleTitle": "Công an Lâm Đồng đẩy mạnh đấu tranh với các loại tội phạm",
            "url": "http://congan.com.vn/tin-chinh/cong-an-lam-dong-tap-trung-day-manh-cong-tac-dau-tranh-giai-quyet-toi-pham-ma-tuy_85923.html",
            "source": "Bao Cong an (lời tuyên bố phát cho các báo)",
            "time": "3 hours ago",
            "snippet": "(CATP) Ngày 8-1-2019, Công an tỉnh Lâm Đồng tổ chức Hội nghị tổng kết công tác năm 2019, kế hoạch thực hiện công tác năm 2020. Ông Đoàn Văn Việt - Phó Bí thư Tỉnh uỷ, Chủ tịch UBND tỉnh Lâm Đồng đến dự. Tham dự Hội nghị còn có lãnh đạo hai&nbsp;..."
          },
          {
            "articleTitle": "&#39;Nơi nào băng nhóm tội phạm lộng hành, người đứng đầu nới đó phải chịu trách nhiệm&#39;",
            "url": "http://antt.vn/noi-nao-bang-nhom-toi-pham-long-hanh-nguoi-dung-dau-noi-do-phai-chiu-trach-nhiem-288303.htm",
            "source": "Báo An ninh tiền tệ và truyền thông",
            "time": "2 hours ago",
            "snippet": "&#39;Nơi nào còn các băng nhóm tội phạm lộng hành thì người đứng đầu Công an đơn vị, địa phương phải chịu trách nhiệm&#39;."
          },
          {
            "articleTitle": "Đại tướng Tô Lâm: Ở đâu tội phạm lộng hành thì cấp trưởng nơi đó phải chịu trách nhiệm",
            "url": "http://toquoc.vn/dai-tuong-to-lam-o-dau-toi-pham-long-hanh-thi-cap-truong-noi-do-phai-chiu-trach-nhiem-20200109090010312.htm",
            "source": "Báo Tổ quốc (lời tuyên bố phát cho các báo)",
            "time": "5 hours ago",
            "snippet": "Đánh giá cao những kết quả nổi bật của lực lượng Công an Hà Nội, tuy nhiên, Đại tướng Tô Lâm cũng thẳng thắn chỉ ra những tồn tại, hạn chế của lực lượng công an Thủ đô. Năm 2020, Đại tướng Tô Lâm yêu cầu CATP Hà Nội thực hiện 8 nhiệm vụ trọng&nbsp;..."
          },
          {
            "articleTitle": "Bộ trưởng Tô Lâm dự hội nghị triển khai công tác năm 2020 Công an TP. Hà Nội",
            "url": "http://www.antv.gov.vn/tin-tuc/chinh-tri/bo-truong-to-lam-du-hoi-nghi-trien-khai-cong-tac-nam-2020-cong-an-tp-ha-noi-304051.html",
            "source": "ANTV News",
            "time": "14 hours ago",
            "snippet": "(ANTV) -nbsp;Sáng 8/1, Công an Thành phố Hà Nội tổ chức Hội nghị tổng kết công tác công an năm 2019 và triển khai nhiệm vụ công tác năm 2020. Đại tướng Tô Lâm, Ủy viên Bộ Chính trị, Bộ trưởng Bộ Công an dự và chỉ đạo Hội nghị. - antv."
          },
          {
            "articleTitle": "Đại tướng Tô Lâm: Không để tồn tại các băng, ổ nhóm tội phạm ở Hà Nội",
            "url": "https://vietnamnet.vn/vn/thoi-su/chinh-tri/dai-tuong-to-lam-khong-de-ton-tai-cac-bang-o-nhom-toi-pham-o-ha-noi-607620.html",
            "source": "Vietnamnet.vn",
            "time": "17 hours ago",
            "snippet": "Ngày 8/1, Công an thành phố Hà Nội tổ chức hội nghị tổng kết công tác công an năm 2019 và triển khai chương trình công tác công an năm 2020."
          },
          {
            "articleTitle": "Hà Nội: Triệt phá 47 ổ nhóm tội phạm có tổ chức trong năm 2019",
            "url": "http://www.vnmedia.vn/phap-luat/202001/ha-noi-triet-pha-47-o-nhom-toi-pham-co-to-chuc-trong-nam-2019-cc62992/",
            "source": "VNMedia",
            "time": "17 hours ago",
            "snippet": "Trong năm 2019, Công an TP Hà Nội đã điều tra khám phá 4.103 vụ với 8.102 đối tượng xâm phạm về trật tự xã hội; công tác điều tra khám phá đạt 90,6% các vụ án nghiêm trọng và đặc biệt nghiêm trọng; triệt phá và làm tan rã 47 ổ nhóm tội phạm có tổ&nbsp;..."
          },
          {
            "articleTitle": "Bộ trưởng Tô Lâm: Không để tồn tại các băng, ổ nhóm tội phạm",
            "url": "https://bnews.vn/bo-truong-to-lam-khong-de-ton-tai-cac-bang-o-nhom-toi-pham-/144587.html",
            "source": "Bnews.vn (lời tuyên bố phát cho các báo)",
            "time": "21 hours ago",
            "snippet": "Theo Bộ trưởng Bộ Công an Tô Lâm, Công an thành phố Hà Nội cần đạt mục tiêu giảm ít nhất 5% số vụ phạm pháp hình sự và không để tồn tại các băng, ổ nhóm tội phạm."
          },
          {
            "articleTitle": "Giữ vững an ninh chính trị, trật tự an toàn xã hội để nhân dân vui xuân, đón Tết",
            "url": "http://www.hanoimoi.com.vn/tin-tuc/Xa-hoi/955045/giu-vung-an-ninh-chinh-tri-trat-tu-an-toan-xa-hoi-de%C2%A0nhan-dan-vui-xuan-don-tet",
            "source": "Hà Nội Mới",
            "time": "23 hours ago",
            "snippet": "(HNMO) - Ngày 8-1-2020, Công an thành phố Hà Nội tổ chức hội nghị tổng kết công tác năm 2019 và triển khai chương trình công tác năm 2020. Dự và chỉ đạo hội nghị có Đại tướng Tô Lâm, Ủy viên Bộ Chính trị, Bí thư Đảng ủy Công an Trung ương,&nbsp;..."
          },
          {
            "articleTitle": "Triệt xóa bằng được, bằng hết các băng, nhóm tội phạm",
            "url": "https://anninhthudo.vn/chinh-tri-xa-hoi/triet-xoa-bang-duoc-bang-het-cac-bang-nhom-toi-pham/839123.antd",
            "source": "An Ninh Thủ Đô",
            "time": "21 hours ago",
            "snippet": "ANTD.VN - Với tinh thần tích cực, khẩn trương và trách nhiệm cao, chiều 8-1, hội nghị tổng kết công tác Công an và phong trào thi đua “Vì an ninh Tổ quốc” năm 2019, triển khai chương trình công tác Công an năm 2020 của Công an TP. Hà Nội đã bế mạc,&nbsp;..."
          }
        ],
        "idsForDedup": [
          "/g/11cm14zjjd /g/122lf050",
          "/g/11cm14zjjd /g/1pzpdb8fn",
          "/g/11cm14zjjd /g/1tgjhr_8",
          "/g/11cm14zjjd /m/0fnff",
          "/g/122lf050 /g/1pzpdb8fn",
          "/g/122lf050 /g/1tgjhr_8",
          "/g/122lf050 /m/0fnff",
          "/g/1pzpdb8fn /g/1tgjhr_8",
          "/g/1pzpdb8fn /m/0fnff",
          "/g/1tgjhr_8 /m/0fnff"
        ],
        "id": "VN_lnk_qVnCQQEwAABqqM_vi",
        "title": "To Lam, Hanoi, An ninh Thu do Newspaper, Minister of Public Security, Doan Duy Khuong",
        "entityNames": [
          "To Lam",
          "Hanoi",
          "An ninh Thu do Newspaper",
          "Minister of Public Security",
          "Doan Duy Khuong"
        ]
      },
      {
        "image": {
          "newsUrl": "https://www.goal.com/vn/tintuc/cong-phuong-toi-muon-giup-clb-tphcm-dat-thanh-tich-tot-nhat/1p6vs0ng1xn4f12aw8urmvnkel",
          "source": "Goal.com",
          "imgUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcSnqq7W8m2jQ6OYZxxzxowQYCFNn8qCmwmBnDkJR3MJfSWsor7L9b1AE0ueVT1jt_qpANJeApWgUYA"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_mJ2YQQEwAAABbM_vi&category=all&geo=VN#VN_lnk_mJ2YQQEwAAABbM_vi",
        "articles": [
          {
            "articleTitle": "Công Phượng: &#39;Tôi muốn giúp CLB TP.HCM đạt thành tích tốt nhất&#39;",
            "url": "https://www.goal.com/vn/tintuc/cong-phuong-toi-muon-giup-clb-tphcm-dat-thanh-tich-tot-nhat/1p6vs0ng1xn4f12aw8urmvnkel",
            "source": "Goal.com",
            "time": "4 hours ago",
            "snippet": "Công Phượng. Công Phượng ra mắt CLB TP.HCM. Buriram vs TPHCM. CLB TP.HCM tham dự AFC Champions League 2020. Chủ tịch Nguyễn Hữu Thắng. Lịch thi đấu TPHCM. Trực tiếp bóng đá. Trực tiếp bóng đá hôm nay. Kết quả bóng đá. Bóng đá."
          },
          {
            "articleTitle": "Công Phượng trải lòng về một năm xuất ngoại không thành công",
            "url": "https://thanhnien.vn/video/the-thao/cong-phuong-trai-long-ve-mot-nam-xuat-ngoai-khong-thanh-cong-144839.html",
            "source": "Thanh Niên",
            "time": "4 hours ago",
            "snippet": "Công Phượng đã có những chia sẻ về một năm xuất ngoại không mấy thành công."
          },
          {
            "articleTitle": "Công Phượng lên tiếng về phong độ khi trở lại Việt Nam khoác áo TPHCM",
            "url": "https://m.vov.vn/the-thao/bong-da/cong-phuong-len-tieng-ve-phong-do-khi-tro-lai-viet-nam-khoac-ao-tphcm-998596.vov",
            "source": "Đài Tiếng Nói Việt Nam",
            "time": "5 hours ago",
            "snippet": "Công Phượng lên tiếng về phong độ của bản thân khi trở lại Việt Nam từ đội bóng nước Bỉ Sint Truidense để khoác áo TPHCM."
          },
          {
            "articleTitle": "Công Phượng tự tin cạnh tranh tại CLB TPHCM",
            "url": "https://thethao.sggp.org.vn/cong-phuong-tu-tin-canh-tranh-tai-clb-tphcm-639525.html",
            "source": "Sài gòn Giải Phóng",
            "time": "7 hours ago",
            "snippet": "Tiền đạo Nguyễn Công Phượng tỏ ra khá tự tin cho việc cạnh tranh một suất đá chính trong màu áo CLB TPHCM."
          },
          {
            "articleTitle": "Công Phượng được săn đón ở TP.HCM",
            "url": "https://bongda365.com/cong-phuong-duoc-san-don-o-tp-hcm",
            "source": "Bóng Đá 365",
            "time": "5 hours ago",
            "snippet": "Trở thành tân binh của TP.HCM trong mùa giải mới, Công Phượng đã nhận được sự quan tâm lớn từ người hâm mộ và truyền thông."
          },
          {
            "articleTitle": "Công Phượng đặt mục tiêu gì khi đầu quân cho CLB TP.HCM?",
            "url": "https://thanhnien.vn/video/the-thao/cong-phuong-dat-muc-tieu-gi-khi-dau-quan-cho-clb-tphcm-144829.html",
            "source": "Báo Thanh Niên",
            "time": "17 hours ago",
            "snippet": "CLB TP.HCM có sự phục vụ của tiền đạo Nguyễn Công Phượng trong mùa giải 2020. Chiều 8.1, Công Phượng đã có buổi tập đầu tiên trong màu áo CLB mới."
          },
          {
            "articleTitle": "Công Phượng được chào đón ở TP.HCM",
            "url": "https://thethaovanhoa.vn/bong-da-viet-nam/cong-phuong-duoc-chao-don-o-tphcm-n20200108211454181.htm",
            "source": "Báo Thể thao & Văn hóa",
            "time": "7 hours ago",
            "snippet": "(Thethaovanhoa.vn)- Tiền đạo được săn đón bậc nhất bóng đá nước nhà hiện tại đã chính thức hội quân cùng đội bóng mới TP.HCM vào chiều 8/1. Công Phượng đã vui vẻ hoà nhập với nhiều người quen cũ như HLV Chung Hae Seong, hay các đồng đội ở&nbsp;..."
          },
          {
            "articleTitle": "Công Phượng tập buổi đầu cùng CLB TP.HCM: Đặt mục tiêu nào cho năm mới?",
            "url": "https://www.24h.com.vn/bong-da/cong-phuong-tap-buoi-dau-cung-clb-tphcm-dat-muc-tieu-nao-cho-nam-moi-c48a1115152.html",
            "source": "Tin tức 24h",
            "time": "21 hours ago",
            "snippet": "Công Phượng có buổi tập đầu tiên cùng CLB TP.Hồ Chí Minh và đã có những tiết lộ về mục tiêu trong năm 2020.-Bóng đá 24h."
          },
          {
            "articleTitle": "Công Phượng tập riêng trong ngày hội quân cùng CLB TP.HCM",
            "url": "http://news.zing.vn/cong-phuong-tap-rieng-trong-ngay-hoi-quan-cung-clb-tphcm-post1033987.html",
            "source": "Zing.vn",
            "time": "19 hours ago",
            "snippet": "Sau khi hoàn thành các bài khởi động, Công Phượng và một số cầu thủ khác của TP.HCM phải ra tập riêng ở một góc sân."
          },
          {
            "articleTitle": "Công Phượng trình làng tóc mới trong ngày tập đầu tiên cùng CLB TPHCM",
            "url": "https://laodong.vn/the-thao/cong-phuong-trinh-lang-toc-moi-trong-ngay-tap-dau-tien-cung-clb-tphcm-777303.ldo",
            "source": "Báo Lao Động",
            "time": "19 hours ago",
            "snippet": "Chỉ 2 ngày sau khi ra mắt, tiền đạo Công Phượng đã có buổi tập đầu tiên cùng câu lạc bộ TP.HCM với tâm trạng rất vui vẻ, thoải mái."
          }
        ],
        "idsForDedup": [
          "/m/012bd4_y /m/01xn5sr",
          "/m/012bd4_y /m/0263v35",
          "/m/012bd4_y /m/051gq6",
          "/m/012bd4_y /m/058q9lf",
          "/m/012bd4_y /m/0ghqgf",
          "/m/012bd4_y /m/0h3t6nv",
          "/m/01xn5sr /m/0263v35",
          "/m/01xn5sr /m/051gq6",
          "/m/01xn5sr /m/058q9lf",
          "/m/01xn5sr /m/0ghqgf",
          "/m/01xn5sr /m/0h3t6nv",
          "/m/0263v35 /m/051gq6",
          "/m/0263v35 /m/058q9lf",
          "/m/0263v35 /m/0ghqgf",
          "/m/0263v35 /m/0h3t6nv",
          "/m/051gq6 /m/058q9lf",
          "/m/051gq6 /m/0ghqgf",
          "/m/051gq6 /m/0h3t6nv",
          "/m/058q9lf /m/0ghqgf",
          "/m/058q9lf /m/0h3t6nv",
          "/m/0ghqgf /m/0h3t6nv"
        ],
        "id": "VN_lnk_mJ2YQQEwAAABbM_vi",
        "title": "Nguyễn Công Phượng, Ho Chi Minh City F.C., CLB Hoàng Anh Gia Lai, V.League 1, Vietnam national under-23 football team, AFC U-23 Championship, Sint-Truidense V.V.",
        "entityNames": [
          "Nguyễn Công Phượng",
          "Ho Chi Minh City F.C.",
          "CLB Hoàng Anh Gia Lai",
          "V.League 1",
          "Vietnam national under-23 football team",
          "AFC U-23 Championship",
          "Sint-Truidense V.V."
        ]
      },
      {
        "image": {
          "newsUrl": "https://dantri.com.vn/news-20200109095640064.htm",
          "source": "Dân Trí",
          "imgUrl": "//t1.gstatic.com/images?q=tbn:ANd9GcTROHrJitGGrsJOS-JYc3-bjfmUfBBNFfL4SzMsi7_PEZWxKXKkuLxhKBqz-cvHlXB1Z-SYFxBPyYA"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_ErC-QQEwAACtQM_vi&category=all&geo=VN#VN_lnk_ErC-QQEwAACtQM_vi",
        "articles": [
          {
            "articleTitle": "PSG 6-1 Saint-Etienne: Icardi lần đầu lập hat-trick",
            "url": "https://dantri.com.vn/news-20200109095640064.htm",
            "source": "Dân Trí",
            "time": "4 hours ago",
            "snippet": "(Dân trí) - Tiền đạo Mauro Icardi lần đầu tiên lập được hat-trick trong màu áo của PSG trong trận đấu tứ kết cúp liên đoàn Pháp giữa CLB PSG với Saint-Etienne, giúp nhà vô địch Pháp đánh bại đối thủ với tỷ số tennis."
          },
          {
            "articleTitle": "Kết quả PSG 6-1 Saint-Etienne: Icardi lập hat-trick đầu tiên cho PSG",
            "url": "https://bongdaplus.vn/bong-da-phap/ket-qua-psg-6-1-saint-etienne-icardi-lap-hat-trick-dau-tien-cho-psg-2856682001.html",
            "source": "Bóng Đá +",
            "time": "7 hours ago",
            "snippet": "Sau chiến thắng hủy diệt ở cúp quốc gia Pháp, PSG tiếp tục có thêm một màn dạo chơi nữa khi ghi vào lưới Saint-Etienne tới 6 bàn ở tứ kết cúp Liên đoàn, trong đó Mauro Icardi lập một hat-trick."
          },
          {
            "articleTitle": "Video highlight trận PSG - St. Etienne: Đại tiệc 7 bàn, rực rỡ Neymar - Icardi",
            "url": "https://www.24h.com.vn/bong-da/video-highlight-tran-psg-st-etienne-dai-tiec-7-ban-ruc-ro-neymar-icardi-c48a1115243.html",
            "source": "Tin tức 24h",
            "time": "6 hours ago",
            "snippet": "Video bóng đá, kết quả bóng đá, PSG - St. Etienne, Cúp Liên đoàn Pháp) Đội bóng thành Paris quyết tâm hướng đến chiến thắng để tiếp đà cho một mùa giải thắng lợi.-Bóng."
          },
          {
            "articleTitle": "&quot;PSG đang sở hữu 4 trong 10 cầu thủ tấn công giỏi nhất thế giới&quot;",
            "url": "https://bongda24h.vn/bong-da-phap/psg-so-huu-4-trong-10-cau-thu-gioi-nhat-the-gioi-197-241431.html",
            "source": "Bóng đá 24h",
            "time": "6 hours ago",
            "snippet": "Marco Verratti nói về trận PSG vs St.Etienne, cầu thủ người Italia khẳng định đội bóng nước Pháp đang sở hữu 4 trong 10 cầu thủ tấn công tốt nhất thế giới ở thời điểm hiện tại."
          },
          {
            "articleTitle": "PSG thắng hủy diệt trong ngày ngôi sao gốc Việt nổ súng",
            "url": "https://thethao247.vn/317-psg-thang-huy-diet-trong-ngay-ngoi-sao-goc-viet-no-sung-d196481.html",
            "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
            "time": "8 hours ago",
            "snippet": "Khi mà các khán giả có mặt trên sân Công Viên các Hoàng tử còn kịp ấm chỗ ngồi, tiền đạo Icardi đã đưa PSG vươn lên dẫn trước ngay ở phút thứ 2. Có bàn thắng sớm nhưng Neymar và các đồng đội lại thi đấu khá bế tắc cho đến khi Saint-Etienne chỉ còn&nbsp;..."
          },
          {
            "articleTitle": "Mbappe suýt ghi bàn thắng để đời cho PSG trong ngày lập kỷ lục",
            "url": "https://webthethao.vn/bong-da-quoc-te/mbappe-suyt-ghi-ban-thang-de-doi-cho-psg-trong-ngay-lap-ky-luc-113273.htm",
            "source": "Web Thể Thao (Thể Thao 24h)",
            "time": "7 hours ago",
            "snippet": "Kylian Mbappe suýt ghi một bàn thắng để đời cho PSG trong trận gặp Saint-Etienne nhưng anh vẫn san bằng kỷ lục của CLB."
          },
          {
            "articleTitle": "&#39;PSG có 4 trong số 10 cầu thủ hay nhất thế giới...&#39;",
            "url": "http://www.tinthethao.com.vn/psg-co-4-trong-so-10-cau-thu-hay-nhat-the-gioi-d565749.html",
            "source": "Tin Thể Thao",
            "time": "28 minutes ago",
            "snippet": "Tiền vệ của Paris Saint-Germain đã hết lời ca ngợi các cầu thủ tấn công của đội nhà sau chiến thắng 6-1 trước St-Etienne."
          },
          {
            "articleTitle": "Soi kèo nhà cái PSG vs Saint Etienne ngày 9/1 Cúp Liên đoàn Pháp",
            "url": "https://bongda365.com/soi-keo-nha-cai-psg-vs-saint-etienne-ngay-9-1-cup-lien-doan-phap",
            "source": "Bóng Đá 365",
            "time": "1 day ago",
            "snippet": "Có thể nói, PSG đang là cơn ác mộng cho bất cứ đối thủ nào không may đụng độ phải họ không riêng chỉ ở nước Pháp mà ngay cả trên toàn châu Âu. Với tổng giá trị đội hình lên tới 1,01 tỉ Euro thì đây cũng là điều không quá khó hiểu. 10 trận gần nhất, đội&nbsp;..."
          }
        ],
        "idsForDedup": [
          "/g/11bx55_6wp /m/01_1kk",
          "/g/11bx55_6wp /m/03m5111",
          "/g/11bx55_6wp /m/044hxl",
          "/g/11bx55_6wp /m/0g5sz92",
          "/m/01_1kk /m/03m5111",
          "/m/01_1kk /m/044hxl",
          "/m/01_1kk /m/0g5sz92",
          "/m/03m5111 /m/044hxl",
          "/m/03m5111 /m/0g5sz92",
          "/m/044hxl /m/0g5sz92"
        ],
        "id": "VN_lnk_ErC-QQEwAACtQM_vi",
        "title": "Paris Saint-Germain F.C., France Ligue 1, Mauro Icardi, Kylian Mbappé, Neymar",
        "entityNames": [
          "Paris Saint-Germain F.C.",
          "France Ligue 1",
          "Mauro Icardi",
          "Kylian Mbappé",
          "Neymar"
        ]
      },
      {
        "image": {
          "newsUrl": "https://bongda365.com/soi-keo-nha-cai-torino-vs-genoa-ngay-10-1-cup-quoc-gia-italia",
          "source": "Bóng Đá 365",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcQjtnPg9u1iJpWZAmUTU9klaI85H5hHcs3KyIVQmosfTZ1Jn8ndxMFwywlgHW6mimVhue7QNA9t7cA"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_cG7HQQEwAAC2nM_vi&category=all&geo=VN#VN_lnk_cG7HQQEwAAC2nM_vi",
        "articles": [
          {
            "articleTitle": "Soi kèo nhà cái Torino vs Genoa ngày 10/1 Cúp quốc gia Italia",
            "url": "https://bongda365.com/soi-keo-nha-cai-torino-vs-genoa-ngay-10-1-cup-quoc-gia-italia",
            "source": "Bóng Đá 365",
            "time": "9 hours ago",
            "snippet": "Serie A 2018/19 là một mùa giải tương đối thành công với Torino khi họ cán đích ở vị trí thứ 7 và suýt chút nữa đã giành vé dự UEFA Europa League nếu họ không thất bại trong trân playoffs. Mùa giải năm nay, đội bóng áo màu bã trầu cũng được hy vọng rất&nbsp;..."
          },
          {
            "articleTitle": "Soi kèo Torino vs Genoa 03h15 ngày 10/1 (Cúp QG Italia)",
            "url": "https://webthethao.vn/nhan-dinh-bong-da/italia/soi-keo-torino-vs-genoa-03h15-ngay-10-1-cup-qg-italia-113224.htm",
            "source": "Web Thể Thao (Thể Thao 24h)",
            "time": "23 hours ago",
            "snippet": "Soi kèo Torino vs Genoa: Nhận định, dự đoán bóng đá Torino vs Genoa, 03h15 ngày 10/1 thuộc vòng 1/8 cúp Quốc gia Italia 2019/20."
          },
          {
            "articleTitle": "Vừa tuyệt tình với MU, Smalling bị cười chê vì mắc lỗi siêu hài hước",
            "url": "https://bongdaplus.vn/bong-da-y/vua-tuyet-tinh-voi-m-u-smalling-bi-cuoi-che-vi-mac-loi-sieu-hai-huoc-2856152001.html",
            "source": "Bóng Đá +",
            "time": "1 day ago",
            "snippet": "Trung vệ Chris Smalling đã có hành động thiếu suy nghĩ khi dùng tay chơi bóng trong vòng 16m50 trong lúc kèm cặp Andrea Belotti."
          }
        ],
        "idsForDedup": [
          "/m/01hrtp /m/03zv9",
          "/m/01hrtp /m/04psgg",
          "/m/01hrtp /m/07r78j",
          "/m/01hrtp /m/08vk_r",
          "/m/01hrtp /m/0n47vbj",
          "/m/03zv9 /m/04psgg",
          "/m/03zv9 /m/07r78j",
          "/m/03zv9 /m/08vk_r",
          "/m/03zv9 /m/0n47vbj",
          "/m/04psgg /m/07r78j",
          "/m/04psgg /m/08vk_r",
          "/m/04psgg /m/0n47vbj",
          "/m/07r78j /m/08vk_r",
          "/m/07r78j /m/0n47vbj",
          "/m/08vk_r /m/0n47vbj"
        ],
        "id": "VN_lnk_cG7HQQEwAAC2nM_vi",
        "title": "Torino F.C., Genoa C.F.C., Serie A, Coppa Italia, Andrea Belotti, UEFA Europa League",
        "entityNames": [
          "Torino F.C.",
          "Genoa C.F.C.",
          "Serie A",
          "Coppa Italia",
          "Andrea Belotti",
          "UEFA Europa League"
        ]
      },
      {
        "image": {
          "newsUrl": "https://vtc.vn/bong-da-viet-nam/van-hau-cao-noi-bat-giua-dan-cau-thu-heerenveen-ar521102.html",
          "source": "VTC News",
          "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcQODcfTJloF9Xshxt-13rD-Apq_rw6eKUovH0CcpsMDZMn8CnbiMlhnOdNFJ3_ON6o-5YbTR93wBwQ"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_s45zQQEwAADBfM_vi&category=all&geo=VN#VN_lnk_s45zQQEwAADBfM_vi",
        "articles": [
          {
            "articleTitle": "Văn Hậu cao nổi bật giữa dàn cầu thủ Heerenveen",
            "url": "https://vtc.vn/bong-da-viet-nam/van-hau-cao-noi-bat-giua-dan-cau-thu-heerenveen-ar521102.html",
            "source": "VTC News",
            "time": "6 hours ago",
            "snippet": "Đoàn Văn Hậu cho thấy sự nổi trội về mặt thể hình dù đứng trong hàng ngũ những cầu thủ châu Âu của SC Heerenveen."
          },
          {
            "articleTitle": "Văn Hậu trải nghiệm cảm giác bay trong lồng gió",
            "url": "https://vtv.vn/ben-le/van-hau-trai-nghiem-cam-giac-bay-trong-long-gio-20200109080101421.htm",
            "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
            "time": "6 hours ago",
            "snippet": "VTV.vn - Đoàn Văn Hậu tỏ ra phấn khích khi cùng đồng đội tại SC Heerenveen có buổi trải nghiệm bay lượn trong lồng gió nhân chuyến tập huấn tại Tây Ban Nha."
          },
          {
            "articleTitle": "Heerenveen nhận tiền từ doanh nghiệp Việt: Văn Hậu chớp thời cơ!",
            "url": "https://baodatviet.vn/the-thao/binh-luan-bong-da/heerenveen-nhan-tien-tu-doanh-nghiep-viet-van-hau-chop-thoi-co-3394849/",
            "source": "BaoDatViet",
            "time": "5 hours ago",
            "snippet": "Doanh nghiệp Việt Nam có hợp đồng thương mại với CLB Heerenveen tạo khả năng Văn Hậu được ra sân thi đấu cao hơn."
          },
          {
            "articleTitle": "[Clip]: Văn Hậu dứt điểm ghi bàn đẹp mắt trên sân tập của SC Heerenveen",
            "url": "https://www.phapluatplus.vn/video/clip-van-hau-dut-diem-ghi-ban-dep-mat-tren-san-tap-cua-sc-heerenveen-d114768.html",
            "source": "Pháp Luật Plus (lời tuyên bố phát cho các báo)",
            "time": "3 hours ago",
            "snippet": "Trong buổi tập của SC Heerenveen trên đất Tây Ban Nha, Văn Hậu đã có pha dứt điểm cầu vồng đẹp mắt khiến thủ môn phải đứng nhìn bóng bay vào lưới."
          },
          {
            "articleTitle": "Đoàn Văn Hậu “đốn tim” người hâm mộ trong chuyến tập huấn Tây Ban Nha",
            "url": "https://m.vov.vn/the-thao/hau-truong/doan-van-hau-don-tim-nguoi-ham-mo-trong-chuyen-tap-huan-tay-ban-nha-998636.vov",
            "source": "Đài Tiếng Nói Việt Nam",
            "time": "4 hours ago",
            "snippet": "Đoàn Văn Hậu &quot;đốn tim&quot; người hâm mộ với nụ cười rạng rỡ, thể hình lý tưởng và nỗ lực trên sân cỏ trong chuyến tập huấn Tây Ban Nha cùng SC Heerenveen."
          },
          {
            "articleTitle": "Văn Hậu ghi bàn tuyệt đẹp trong buổi tập tại Tây Ban Nha",
            "url": "https://www.goal.com/vn/tintuc/van-hau-ghi-ban-tuyet-dep-trong-buoi-tap-tai-tay-ban-nha/hx10uejjzern1jokd1kzsovix",
            "source": "Goal.com",
            "time": "22 hours ago",
            "snippet": "Đoàn Văn Hậu. U23 Việt Nam. SC Heerenveen. VCK U23 châu Á. U23 CHDCND Triều Tiên. U23 Jordan. U23 UAE. Bảng D VCK U23 châu Á. Văn Hậu có đá VCK U23 không? Văn Hậu tham dự U23 Châu Á."
          },
          {
            "articleTitle": "Chiêm ngưỡng bàn thắng tuyệt đẹp của Văn Hậu trong buổi tập của Heerenveen",
            "url": "https://dantri.com.vn/the-thao/chiem-nguong-ban-thang-tuyet-dep-cua-van-hau-trong-buoi-tap-cua-heerenveen-20200108092407632.htm",
            "source": "Dân Trí",
            "time": "1 day ago",
            "snippet": "(Dân trí) - Trong buổi tập cùng các đồng đội SC Heerenveen tại Tây Ban Nha, hậu vệ cánh Đoàn Văn Hậu đã có một bàn thắng tuyệt đẹp bằng chân trái sở trường. Cầu thủ sinh năm 1999 đang thích nghi rất nhanh và được HLV Jansen đánh giá cao."
          },
          {
            "articleTitle": "Văn Hậu xuất hiện nổi bật trong dàn cầu thủ Heerenveen",
            "url": "https://2sao.vn/van-hau-xuat-hien-noi-bat-trong-dan-cau-thu-heerenveen-n-207935.html",
            "source": "2Sao",
            "time": "16 hours ago",
            "snippet": "Xuất hiện trong buổi tập của CLB Heerenveen trên đất Tây Ban Nha, Văn Hậu nhận được nhiều lời khen ngợi khi sở hữu thân hình lý tưởng và nụ cười rạng rỡ trước ống kính."
          },
          {
            "articleTitle": "Văn Hậu tập huấn tốt tại SC Heerenveen, hứa hẹn “chào sân” 2020",
            "url": "https://bongda365.com/van-hau-tap-huan-tot-tai-sc-heerenveen-hua-hen-chao-san-2020",
            "source": "Bóng Đá 365",
            "time": "18 hours ago",
            "snippet": "Hậu vệ Đoàn Văn Hậu đang cùng các đồng đội ở SC Heerenveen tham dự chuyến tập huấn tại Tây Ban Nha trong bầu không khí hứng khởi."
          },
          {
            "articleTitle": "Văn Hậu sút xa khiến thủ môn không thể cản phá",
            "url": "https://www.tienphong.vn/the-thao/van-hau-sut-xa-khien-thu-mon-khong-the-can-pha-1507094.tpo",
            "source": "Tiền Phong",
            "time": "1 day ago",
            "snippet": "Buổi tập mới đây của SC Heerenveen ở Tây Ban Nha chứng kiến tuyển thủ Việt Nam Đoàn Văn Hậu tung cú dứt điểm khiến thủ môn đứng nhìn bóng bay vào lưới."
          }
        ],
        "idsForDedup": [
          "/g/11c7428gtn /m/01crd5",
          "/g/11c7428gtn /m/037ts6",
          "/g/11c7428gtn /m/04b6sy",
          "/g/11c7428gtn /m/0h3t6nv",
          "/m/01crd5 /m/037ts6",
          "/m/01crd5 /m/04b6sy",
          "/m/01crd5 /m/0h3t6nv",
          "/m/037ts6 /m/04b6sy",
          "/m/037ts6 /m/0h3t6nv",
          "/m/04b6sy /m/0h3t6nv"
        ],
        "id": "VN_lnk_s45zQQEwAADBfM_vi",
        "title": "Đoàn Văn Hậu, SC Heerenveen, Vietnam, Vietnam national football team, AFC U-23 Championship",
        "entityNames": [
          "Đoàn Văn Hậu",
          "SC Heerenveen",
          "Vietnam",
          "Vietnam national football team",
          "AFC U-23 Championship"
        ]
      },
      {
        "image": {
          "newsUrl": "https://vnexpress.net/the-gioi/em-be-chet-duoi-cang-may-bay-4039443.html",
          "source": "VnExpress",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcQJiaS8ksjverPZq1vzbUDmFkmisU-QNfp0f1vGCtNK-hXmmB2p8-LhziqAYqKTJIbwuA3B-wt1UgU"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_neDLQQEwAABXEM_vi&category=all&geo=VN#VN_lnk_neDLQQEwAABXEM_vi",
        "articles": [
          {
            "articleTitle": "Em bé chết dưới càng máy bay",
            "url": "https://vnexpress.net/the-gioi/em-be-chet-duoi-cang-may-bay-4039443.html",
            "source": "VnExpress",
            "time": "6 hours ago",
            "snippet": "Thi thể một trẻ em khoảng 10 tuổi được phát hiện dưới càng máy bay Air France từ Bờ biển Ngà hạ cánh xuống Paris hôm qua. - VnExpress."
          },
          {
            "articleTitle": "Phát hiện thi thể một trẻ em trong càng máy bay của Air France",
            "url": "http://giadinh.net.vn/bon-phuong/phat-hien-thi-the-mot-tre-em-trong-cang-may-bay-cua-air-france-20200109084152908.htm",
            "source": "Báo Gia đình & Xã hội",
            "time": "5 hours ago",
            "snippet": "Air France không cho biết độ tuổi của nạn nhân xấu số đi lậu vé nhưng đây không phải lần đầu tiên có người thiệt mạng khi tìm cách vượt biên bằng cách trốn trong càng máy bay."
          },
          {
            "articleTitle": "Phát hiện thi thể em bé 10 tuổi dưới càng máy bay",
            "url": "https://m.vov.vn/the-gioi/phat-hien-thi-the-em-be-10-tuoi-duoi-cang-may-bay-998611.vov",
            "source": "Đài Tiếng Nói Việt Nam",
            "time": "5 hours ago",
            "snippet": "Ngày 7/1, thi thể của một em bé được tìm thấy dưới càng máy bay sau khi máy bay của hãng hàng không Air France hạ cánh xuống sân bay Paris."
          },
          {
            "articleTitle": "Phát hiện thi thể bé trai bám càng máy bay đi từ châu Phi sang Pháp",
            "url": "https://www.tinmoi.vn/phat-hien-thi-the-be-trai-bam-cang-may-bay-di-tu-chau-phi-sang-phap-011537773.html",
            "source": "Tinmoi.vn",
            "time": "4 hours ago",
            "snippet": "Thi thể của cậu bé đi lậu vé được phát hiện trong càng hạ cánh của máy bay hãng Air France ở Paris, hãng hàng không xác nhận."
          },
          {
            "articleTitle": "Tin tức đời sống mới nhất ngày 9/1/2020: Phát hiện thi thể bé trai trong càng máy bay",
            "url": "https://www.doisongphapluat.com/doi-song/tin-tuc-doi-song-moi-nhat-ngay-912020-phat-hien-thi-the-be-trai-trong-cang-may-bay-a307639.html",
            "source": "Đời Sống & Pháp Luật (lời tuyên bố phát cho các báo)",
            "time": "8 hours ago",
            "snippet": "Tin tức đời sống mới nhất ngày 9/1/2020. Cập nhật tin đời sống mới ngày 9/1/2020 trên trang Đời sống &amp; Pháp luật."
          },
          {
            "articleTitle": "Phát hiện thi thể trẻ 10 tuổi trong càng hạ cánh máy bay Air France tại Paris",
            "url": "https://dantri.com.vn/the-gioi/phat-hien-thi-the-tre-10-tuoi-trong-cang-ha-canh-may-bay-air-france-tai-paris-20200108201046749.htm",
            "source": "Dân Trí",
            "time": "18 hours ago",
            "snippet": "(Dân trí) - Một trẻ em khoảng 10 tuổi được phát hiện đã chết trong càng hạ cánh một máy bay đến từ Bờ biển Ngà của hãng hàng không Pháp Air France tại sân bay Paris (Pháp) vào hôm nay, một nguồn tin thân cận với cuộc điều tra tiết lộ."
          },
          {
            "articleTitle": "Phát hiện thi thể bé trai dưới càng bánh xe máy bay ở sân bay Paris",
            "url": "https://thanhnien.vn/the-gioi/phat-hien-thi-the-be-trai-duoi-cang-banh-xe-may-bay-o-san-bay-paris-1169749.html",
            "source": "Báo Thanh Niên",
            "time": "19 hours ago",
            "snippet": "Thi thể bé trai khoảng 10 tuổi đã được tìm thấy bên dưới càng bánh xe máy bay vừa đáp xuống sân bay Charles de Gaulle ở Paris sau cuộc hành trình từ thành phố Abidjan của Bờ Biển Ngà."
          },
          {
            "articleTitle": "Phát hiện thi thể một trẻ em trong càng máy bay ở Paris",
            "url": "https://baotintuc.vn/the-gioi/phat-hien-thi-the-mot-tre-em-trong-cang-may-bay-o-paris-20200108184933553.htm",
            "source": "baotintuc.vn",
            "time": "19 hours ago",
            "snippet": "Trong một thông báo, hãng hàng không Air France (Pháp) cho biết chiếc máy bay Boeing 777 của hãng khởi hành từ Abidjan tối 7/1 và hạ cánh xuống sân bay Charles de Gaulle vào sáng ngày sau đó. Air France không cho biết độ tuổi của nạn nhân xấu số&nbsp;..."
          },
          {
            "articleTitle": "Phát hiện thi thể một đứa trẻ 10 tuổi trong càng máy bay",
            "url": "https://saostar.vn/the-gioi/phat-hien-thi-the-mot-dua-tre-10-tuoi-trong-cang-may-bay-6785589.html",
            "source": "Saostar.vn",
            "time": "18 hours ago",
            "snippet": "Đứa trẻ khoảng 10 tuổi được tìm thấy đã chết bên trong càng của một chiếc máy bay của hãng Air France sau khi nó hạ cánh xuống Paris."
          }
        ],
        "idsForDedup": [
          "/m/05qtj /m/0f8l9c",
          "/m/05qtj /m/0h7k5",
          "/m/0f8l9c /m/0h7k5"
        ],
        "id": "VN_lnk_neDLQQEwAABXEM_vi",
        "title": "Air France, Paris, France",
        "entityNames": [
          "Air France",
          "Paris",
          "France"
        ]
      },
      {
        "image": {
          "newsUrl": "https://plo.vn/phap-luat/cong-bo-cam-nang-xu-ly-cac-vu-xam-hai-tinh-duc-tre-em-882757.html",
          "source": "Báo Pháp Luật TP.HCM",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcT6eR8HxHM4ThHqmgPKoMnY7_cbxZt_outUf0kcVzfBulybgg0oTECVzgSz5nKeUGzKTlGuiYu5d4g"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_Z4u1QQEwAADTeM_vi&category=all&geo=VN#VN_lnk_Z4u1QQEwAADTeM_vi",
        "articles": [
          {
            "articleTitle": "Công bố cẩm nang xử lý các vụ xâm hại tình dục trẻ em",
            "url": "https://plo.vn/phap-luat/cong-bo-cam-nang-xu-ly-cac-vu-xam-hai-tinh-duc-tre-em-882757.html",
            "source": "Báo Pháp Luật TP.HCM",
            "time": "10 hours ago",
            "snippet": "(PL)- Sáng 8-1, VKSND Tối cao, Bộ Công an và Cơ quan Phòng, chống ma túy và tội phạm của Liên Hiệp Quốc (UNODC) đã công bố bộ công cụ dành cho lực lượng cảnh sát, cán bộ ngành kiểm sát về giải quyết các vụ án, vụ việc xâm hại tình dục trẻ em."
          },
          {
            "articleTitle": "Công bố bộ công cụ về giải quyết các vụ án, vụ việc xâm hại trẻ em",
            "url": "https://vov.vn/tin-nong/cong-bo-bo-cong-cu-ve-giai-quyet-cac-vu-an-vu-viec-xam-hai-tre-em-998348.vov",
            "source": "Đài Tiếng Nói Việt Nam",
            "time": "23 hours ago",
            "snippet": "Bộ công cụ gồm các tài liệu dành cho lực lượng Cảnh sát với tội phạm xâm hại tình dục trẻ em; Sổ tay Cảnh sát giải quyết vụ án, vụ việc xâm hại trẻ em."
          },
          {
            "articleTitle": "“Cẩm nang” xử lý các vụ án xâm hại tình dục trẻ em",
            "url": "http://baodansinh.vn/cam-nang-xu-ly-cac-vu-an-xam-hai-tinh-duc-tre-em-20200108115142983.htm",
            "source": "Báo Dân Sinh (lời tuyên bố phát cho các báo)",
            "time": "1 day ago",
            "snippet": "(Dân sinh) - Ngày 8/1, tại Hà Nội, Viện kiểm sát nhân dân tối cao, Bộ Công an và Cơ quan Phòng, chống Ma túy và Tội phạm của Liên Hợp Quốc tổ chức công bố tài liệu: Lực lượng Cảnh sát với tội phạm xâm hại tình dục trẻ em; Sổ tay Cảnh sát giải quyết vụ&nbsp;..."
          },
          {
            "articleTitle": "Phòng, chống bạo lực và xâm hại trẻ em trong gia đình: Đừng đổ lỗi cho thể chế",
            "url": "http://kinhtedothi.vn/phong-chong-bao-luc-va-xam-hai-tre-em-trong-gia-dinh-dung-do-loi-cho-the-che-362036.html",
            "source": "Báo Kinh Tế Đô Thị",
            "time": "1 day ago",
            "snippet": "Kinhtedothi - Qua giám sát của Quốc hội tại 17 tỉnh/TP, các vụ việc bạo lực và xâm hại trẻ em xảy ra trong gia đình, do người thân quen, thậm chí là người ruột thịt, thân thích… chiếm tỷ lệ đáng kể. Thực hiện chính sách, pháp luật về phòng, chống xâm hại trẻ&nbsp;..."
          }
        ],
        "idsForDedup": [
          "/m/01crd5 /m/078_1p",
          "/m/01crd5 /m/0d36kj",
          "/m/078_1p /m/0d36kj"
        ],
        "id": "VN_lnk_Z4u1QQEwAADTeM_vi",
        "title": "Vietnam, Ministry of Public Security, Supreme People's Procuracy of Vietnam",
        "entityNames": [
          "Vietnam",
          "Ministry of Public Security",
          "Supreme People's Procuracy of Vietnam"
        ]
      },
      {
        "image": {
          "newsUrl": "https://www.tienphong.vn/xa-hoi/ban-noi-chinh-thanh-uy-tphcm-co-truong-ban-moi-1507656.tpo",
          "source": "Tiền Phong",
          "imgUrl": "//t1.gstatic.com/images?q=tbn:ANd9GcSYywzYawL8BoKL13shSDqnFICCZCrPJEhbaXFSRxCF0OzXNduBtE0Kct-I15F1R4b8uHGE9G8weuM"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_YzvaQQEwAAC4yM_vi&category=all&geo=VN#VN_lnk_YzvaQQEwAAC4yM_vi",
        "articles": [
          {
            "articleTitle": "Ban Nội chính Thành ủy TPHCM có trưởng ban mới",
            "url": "https://www.tienphong.vn/xa-hoi/ban-noi-chinh-thanh-uy-tphcm-co-truong-ban-moi-1507656.tpo",
            "source": "Tiền Phong",
            "time": "48 minutes ago",
            "snippet": "Ông Dương Ngọc Hải, 53 tuổi, trình độ Thạc sỹ Luật, Cao cấp lý luận chính trị vừa được Ban Thường vụ Thành ủy TPHCM bổ nhiệm là Trưởng ban Nội chính Thành ủy thay ông Trần Thế Lưu (nghỉ hưu)."
          },
          {
            "articleTitle": "TPHCM bổ nhiệm tân Trưởng Ban Nội chính Thành ủy",
            "url": "https://dantri.com.vn/xa-hoi/tphcm-bo-nhiem-tan-truong-ban-noi-chinh-thanh-uy-20200109135012658.htm",
            "source": "Dân Trí",
            "time": "50 minutes ago",
            "snippet": "(Dân trí) - Ông Dương Ngọc Hải, Phó Trưởng ban thường trực Ban Nội chính Thành ủy TPHCM được bổ nhiệm giữ chức Trưởng ban, thay cho ông Trần Thế Lưu vừa nghỉ hưu."
          },
          {
            "articleTitle": "Thành ủy TPHCM bổ nhiệm Trưởng ban Ban Nội chính Thành ủy",
            "url": "http://baochinhphu.vn/Hoat-dong-dia-phuong/Thanh-uy-TPHCM-bo-nhiem-Truong-ban-Ban-Noi-chinh-Thanh-uy/384614.vgp",
            "source": "ONLINE NEWSPAPER OF THE GOVERNMENT OF THE SOCIALIST REPUBLIC OF VIET NAM (lời tuyên bố phát cho các báo)",
            "time": "3 hours ago",
            "snippet": "(Chinhphu.vn) - Sáng 9/1, đồng chí Nguyễn Thiện Nhân, Ủy viên Bộ Chính trị, Bí thư Thành ủy TPHCM đã trao quyết định bổ nhiệm Trưởng ban Ban Nội chính Thành ủy TPHCM. - Thông tin chính thống hoạt động, quyết định, chỉ đạo của Chính phủ, Thủ&nbsp;..."
          },
          {
            "articleTitle": "Nguyên viện trưởng Viện Kiểm sát làm Trưởng ban Nội chính Thành ủy TPHCM",
            "url": "https://vietnamnet.vn/vn/thoi-su/chinh-tri/nguyen-vien-truong-vien-kiem-sat-lam-truong-ban-noi-chinh-thanh-uy-tp-hcm-607685.html",
            "source": "Vietnamnet.vn",
            "time": "4 hours ago",
            "snippet": "Ông Dương Ngọc Hải, nguyên Viện trưởng Viện KSND TP được bổ nhiệm từ Phó ban lên Trưởng ban Nội chính Thành ủy TP.HCM."
          },
          {
            "articleTitle": "Tân Trưởng ban Nội chính Thành ủy TP.HCM từng là Viện trưởng VKSND",
            "url": "https://thanhnien.vn/thoi-su/tan-truong-ban-noi-chinh-thanh-uy-tphcm-tung-la-vien-truong-vksnd-1169992.html",
            "source": "Báo Thanh Niên",
            "time": "1 hour ago",
            "snippet": "Trước khi được bổ nhiệm làm Trưởng ban Nội chính Thành ủy TP.HCM, ông Dương Ngọc Hải có gần 20 năm công tác trong ngành kiểm sát, giữ chức vụ cao nhất là Viện trưởng Viện KSND TP."
          },
          {
            "articleTitle": "TP HCM có Trưởng ban Nội chính mới",
            "url": "https://vnexpress.net/thoi-su/tp-hcm-co-truong-ban-noi-chinh-moi-4039620.html",
            "source": "VnExpress",
            "time": "3 hours ago",
            "snippet": "Ông Dương Ngọc Hải, Phó ban Nội chính Thành uỷ TP HCM được bổ nhiệm làm Trưởng ban thay ông Trần Thế Lưu đã nghỉ hưu, ngày 9/1. - VnExpress."
          },
          {
            "articleTitle": "Thành ủy TPHCM có tân Trưởng Ban Nội chính",
            "url": "http://cafef.vn/thanh-uy-tphcm-co-tan-truong-ban-noi-chinh-20200109105134486.chn",
            "source": "Cafef.vn",
            "time": "3 hours ago",
            "snippet": "Tại buổi lễ, Ủy viên Bộ Chính trị, Bí thư Thành ủy TP HCM Nguyễn Thiện Nhân đã trao quyết định của Ban Thường vụ Thành ủy TP HCM về bổ nhiệm ông Dương Ngọc Hải, Thành ủy viên, Phó Trưởng ban Thường trực Ban Nội chính Thành ủy giữ chức vụ&nbsp;..."
          },
          {
            "articleTitle": "Ông Dương Ngọc Hải làm Trưởng ban Nội chính Thành ủy TP.HCM",
            "url": "https://news.zing.vn/ong-duong-ngoc-hai-lam-truong-ban-noi-chinh-thanh-uy-tphcm-post1034239.html",
            "source": "Zing.vn",
            "time": "2 hours ago",
            "snippet": "Ông Dương Ngọc Hải vừa nhận quyết định bổ nhiệm chức vụ Trưởng ban Nội chính Thành ủy TP.HCM sáng 9/1."
          },
          {
            "articleTitle": "Bí thư Thành ủy TPHCM Nguyễn Thiện Nhân trao quyết định bổ nhiệm Trưởng Ban Ban Nội chính Thành ủy",
            "url": "https://www.sggp.org.vn/bi-thu-thanh-uy-tphcm-nguyen-thien-nhan-trao-quyet-dinh-bo-nhiem-truong-ban-ban-noi-chinh-thanh-uy-639562.html",
            "source": "Sài gòn Giải Phóng",
            "time": "5 hours ago",
            "snippet": "Sáng 9-1, đồng chí Nguyễn Thiện Nhân, Ủy viên Bộ Chính trị, Bí thư Thành ủy TPHCM, trao quyết định bổ nhiệm Trưởng Ban Nội chính Thành ủy TPHCM."
          },
          {
            "articleTitle": "Đồng chí Dương Ngọc Hải giữ chức Trưởng Ban Nội chính Thành ủy TPHCM",
            "url": "https://kiemsat.vn/dong-chi-duong-ngoc-hai-giu-chuc-truong-ban-noi-chinh-thanh-uy-tphcm-56426.html",
            "source": "Kiểm sát Online",
            "time": "5 hours ago",
            "snippet": "Sáng 9/1, Thành ủy TPHCM tổ chức lễ trao quyết định nhân sự Trưởng Ban Nội chính Thành ủy TP. Tham dự có Ủy viên Bộ Chính trị, Bí thư Thành ủy TPHCM Nguyễn Thiện Nhân; Ủy viên Ban Thường vụ Thành ủy, Trưởng Ban Tổ chức Thành ủy TP Nguyễn&nbsp;..."
          }
        ],
        "idsForDedup": [
          "/g/11df812hjr /g/121tt1h0",
          "/g/11df812hjr /g/122v8t1h",
          "/g/11df812hjr /g/1hc0h9bpc",
          "/g/11df812hjr /m/03cvspd",
          "/g/121tt1h0 /g/122v8t1h",
          "/g/121tt1h0 /g/1hc0h9bpc",
          "/g/121tt1h0 /m/03cvspd",
          "/g/122v8t1h /g/1hc0h9bpc",
          "/g/122v8t1h /m/03cvspd",
          "/g/1hc0h9bpc /m/03cvspd"
        ],
        "id": "VN_lnk_YzvaQQEwAAC4yM_vi",
        "title": "Central Internal Affairs Committee, Ho Chi Minh City Municipal Party Committee, Duong Ngoc Hai, Nguyen Thien Nhan",
        "entityNames": [
          "Central Internal Affairs Committee",
          "Ho Chi Minh City Municipal Party Committee",
          "Duong Ngoc Hai",
          "Nguyen Thien Nhan"
        ]
      },
      {
        "image": {
          "newsUrl": "https://dantri.com.vn/the-thao/hlv-u-23-nhat-ban-noi-gi-truoc-tran-ra-quan-o-u-23-chau-a-20200109132440395.htm",
          "source": "Dân Trí",
          "imgUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcR7e7Mv0IJhNmQURx6VE7IE_GBE27vsNDnhIwdt3V0JyPTUyAD-gdpVpCzRASlUdjgBQHIHjr2L4GY"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_zB7LQQEwAAAG7M_vi&category=all&geo=VN#VN_lnk_zB7LQQEwAAAG7M_vi",
        "articles": [
          {
            "articleTitle": "HLV U23 Nhật Bản nói gì trước trận ra quân ở U23 châu Á?",
            "url": "https://dantri.com.vn/the-thao/hlv-u-23-nhat-ban-noi-gi-truoc-tran-ra-quan-o-u-23-chau-a-20200109132440395.htm",
            "source": "Dân Trí",
            "time": "1 hour ago",
            "snippet": "(Dân trí) - Dù được đánh giá cao trước thềm trận đấu với U23 Saudi Arabia nhưng U23 Nhật Bản vẫn tỏ ra hết sức thận trọng."
          },
          {
            "articleTitle": "Lịch trực tiếp U23 châu Á: Nhà đương kim vô địch nhập cuộc",
            "url": "https://www.vietnamplus.vn/lich-truc-tiep-u23-chau-a-nha-duong-kim-vo-dich-nhap-cuoc/617505.vnp",
            "source": "Vietnam Plus (lời tuyên bố phát cho các báo)",
            "time": "5 hours ago",
            "snippet": "Sau lượt trận ra quân bảng A, vòng chung kết U23 châu Á 2020 sẽ tiếp tục guồng quay với nhiều trận cầu hấp dẫn ở bảng B và C trong ngày 9/1. Tại bảng B, hai ứng viên sáng giá cho chức vô địch là U23 Nhật Bản và U23 Saudi Arabia đã sớm phải gặp&nbsp;..."
          },
          {
            "articleTitle": "Nhật Bản - Saudi Arabia: Tạo đà cho Olympic",
            "url": "https://vnexpress.net/u23-chau-a-2020/nhat-ban-saudi-arabia-tao-da-cho-olympic-4039643.html",
            "source": "VnExpress",
            "time": "2 hours ago",
            "snippet": "Chắc suất dự Olympic 2020 với tư cách chủ nhà, nhưng Nhật Bản vẫn muốn vô địch U23 châu Á để tạo đà tâm lý tốt trước Thế vận hội. - U23 Châu Á 2020 VnExpress."
          },
          {
            "articleTitle": "Nhận định bóng đá bảng B VCK U23 châu Á 2020: Nhật Bản vs Saudi Arabia, Qatar vs Syria",
            "url": "https://bongdaplus.vn/bong-da-the-gioi/nhan-dinh-bong-da-bang-b-vck-u23-chau-a-2020-nhat-ban-vs-saudi-arabia-qatar-vs-syria-2857192001.html",
            "source": "Bóng Đá +",
            "time": "3 hours ago",
            "snippet": "Bongdaplus.vn cập nhật thông tin xung quanh 2 trận đấu tại bảng B giữa U23 Nhật Bản vs U23 Saudi Arabia và U23 Qatar vs U23 Syria. U23 Nhật Bản nhiều khả năng sẽ giành trọn 3 điểm trong khi U23 Qatar có thể phải chia điểm."
          },
          {
            "articleTitle": "Nhận định U23 Hàn Quốc vs U23 Trung Quốc 20h15 ngày 9/1 (VCK U23 châu Á 2020)",
            "url": "https://bongda24h.vn/nhan-dinh-bong-da/u23-han-quoc-vs-u23-trung-quoc-20h15-ngay-91-344-241463.html",
            "source": "Bóng đá 24h",
            "time": "1 hour ago",
            "snippet": "U23 Hàn Quốc vs U23 Trung Quốc 20h15 ngày 9/1 nhận định trận đấu VCK U23 châu Á 2020. Nhan dinh bong da phân tích soi kèo tip dự đoán kết quả tỷ số trận đấu Hàn Quốc vs Trung Quốc."
          },
          {
            "articleTitle": "Chủ nhà Olympic Tokyo biểu dương lực lượng",
            "url": "https://plo.vn/the-thao/chu-nha-olympic-tokyo-bieu-duong-luc-luong-882730.html",
            "source": "Báo Pháp Luật TP.HCM",
            "time": "9 hours ago",
            "snippet": "(PL)- Chiều và tối 9-1, bảng B và C của vòng chung kết U-23 châu Á thi đấu. U-23 Nhật Bản dù đã có suất dự Olympic Tokyo 2020 do là chủ nhà nhưng đội bóng của đất nước mặt trời mọc còn có tham vọng vô địch U-23 châu Á."
          },
          {
            "articleTitle": "Trực tiếp U23 Nhật Bản vs U23 Ả Rập Saudi: Thử thách đầu tiên",
            "url": "https://thethao247.vn/316-u23-chau-a-truc-tiep-u23-nhat-ban-vs-u23-a-rap-saudi-thu-thach-dau-tien-d196457.html",
            "source": "Thể Thao 247 (lời tuyên bố phát cho các báo)",
            "time": "7 hours ago",
            "snippet": "U23 Nhật Bản đối đầu trực tiếp U23 Ả Rập Saudi là trận đấu đáng chú ý nhất tại bảng B VCK U23 châu Á, liệu Nhật Bản dễ dàng có 3 điểm hay Ả Rập Saudi sẽ gây bất ngờ?"
          },
          {
            "articleTitle": "Nhận định U23 Nhật Bản vs U23 Saudi Arabia tại VCK U23 châu Á 2020",
            "url": "https://bongda365.com/nhan-dinh-u23-nhat-ban-vs-u23-saudi-arabia-tai-vck-u23-chau-a-2020",
            "source": "Bóng Đá 365",
            "time": "5 hours ago",
            "snippet": "Nhận định và thống kê trận đấu U23 Nhật Bản vs U23 Saudi Arabia lúc 20h15 ngày 9/1 tại VCK U23 châu Á 2020. Chiến thắng cho U23 Nhật Bản."
          },
          {
            "articleTitle": "Xem trực tiếp U23 Nhật Bản vs U23 Saudi Arabia trên kênh nào?",
            "url": "https://webthethao.vn/xem-bong-da-truc-tuyen/xem-truc-tiep-u23-nhat-ban-vs-u23-saudi-arabia-tren-kenh-nao-113270.htm",
            "source": "Web Thể Thao (Thể Thao 24h)",
            "time": "6 hours ago",
            "snippet": "Xem trực tiếp U23 Nhật Bản vs U23 Saudi Arabia (20h15, 09/01). Cập nhật kênh chiếu, link xem trực tiếp trận U23 Nhật Bản vs U23 Saudi Arabia thuộc VCK U23 châu Á 2020."
          },
          {
            "articleTitle": "Nhận diện bảng B U23 châu Á: Cơ hội nào cho Qatar trước Nhật Bản và Saudi Arabia?",
            "url": "https://thethaovanhoa.vn/u23-chau-a-2020/nhan-dien-bang-b-u23-chau-a-co-hoi-nao-cho-qatar-truoc-nhat-ban-va-saudi-arabia-n20200108111050370.htm",
            "source": "Báo Thể thao & Văn hóa",
            "time": "7 hours ago",
            "snippet": "(Thethaovanhoa.vn) - Chung bảng đấu với Nhật Bản, Saudi Arabia, Syria, U23 Qatar thực sự gặp thách thức không nhỏ ở VCK U23 Châu Á năm nay. Liệu họ có thể “sống sót”? Cây bút tên tuổi của Fox Sports Asia Gabriel Tan đánh giá và nhận định."
          }
        ],
        "idsForDedup": [
          "/g/11f647vn3y /m/01z215",
          "/g/11f647vn3y /m/03xh50",
          "/g/11f647vn3y /m/058q9lf",
          "/g/11f647vn3y /m/0bxz6kq",
          "/g/11f647vn3y /m/0h_cd0q",
          "/m/01z215 /m/03xh50",
          "/m/01z215 /m/058q9lf",
          "/m/01z215 /m/0bxz6kq",
          "/m/01z215 /m/0h_cd0q",
          "/m/03xh50 /m/058q9lf",
          "/m/03xh50 /m/0bxz6kq",
          "/m/03xh50 /m/0h_cd0q",
          "/m/058q9lf /m/0bxz6kq",
          "/m/058q9lf /m/0h_cd0q",
          "/m/0bxz6kq /m/0h_cd0q"
        ],
        "id": "VN_lnk_zB7LQQEwAAAG7M_vi",
        "title": "Japan national under-23 football team, Saudi Arabia national under-23 football team, Japan national football team, 2020 AFC U-23 Championship, Saudi Arabia, Vietnam national under-23 football team",
        "entityNames": [
          "Japan national under-23 football team",
          "Saudi Arabia national under-23 football team",
          "Japan national football team",
          "2020 AFC U-23 Championship",
          "Saudi Arabia",
          "Vietnam national under-23 football team"
        ]
      },
      {
        "image": {
          "newsUrl": "https://thanhnien.vn/doi-song/ram-thang-chap-cuoi-cung-trong-nam-hop-tuoi-nao-vi-sao-cac-gia-dinh-deu-cung-bai-1169778.html",
          "source": "Báo Thanh Niên",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcSBUbq1CtjCFiaZ0BSzVINWvnT9MAGTdhY0Tzsi502sxRYtrpNUOHBZjEB1Rdo4HiZZ48XV0M-_AZo"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_x0mWQQEwAABQuM_vi&category=all&geo=VN#VN_lnk_x0mWQQEwAABQuM_vi",
        "articles": [
          {
            "articleTitle": "Rằm tháng Chạp cuối cùng trong năm: Hợp tuổi nào, vì sao các gia đình đều cúng bái?",
            "url": "https://thanhnien.vn/doi-song/ram-thang-chap-cuoi-cung-trong-nam-hop-tuoi-nao-vi-sao-cac-gia-dinh-deu-cung-bai-1169778.html",
            "source": "Báo Thanh Niên",
            "time": "3 hours ago",
            "snippet": "Ngày Rằm tháng Chạp (15.12 Âm lịch) được xem là ngày rất tốt cho các tuổi Bính Dần, Giáp Tý và Giáp Dần. Xuất hành về hướng Tây Nam sẽ được cả tài lộc lẫn vui vẻ, may mắn."
          },
          {
            "articleTitle": "Nhiều món đồ cúng &quot;độc - lạ&quot; được ưa chuộng ngày cận Tết",
            "url": "https://vtv.vn/doi-song/nhieu-mon-do-cung-doc-la-duoc-ua-chuong-ngay-can-tet-20200108215617593.htm",
            "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
            "time": "8 hours ago",
            "snippet": "VTV.vn -Những món như cá chép rau câu, thỏi vàng làm từ đậu xanh, hoa quả khắc chữ hay bánh bao dát vàng là những món đồ cúng được &quot;săn đón&quot; dịp cận Tết."
          },
          {
            "articleTitle": "Những lưu ý khi chuẩn bị mâm cơm cúng Rằm tháng Chạp để được bình an",
            "url": "https://laodong.vn/chuyen-nha-minh/nhung-luu-y-khi-chuan-bi-mam-com-cung-ram-thang-chap-de-duoc-binh-an-777352.ldo",
            "source": "Báo Lao Động",
            "time": "4 hours ago",
            "snippet": "Bên cạnh hương hoa, trà, quả, nhiều nhà còn chuẩn bị mâm cỗ mặn cúng Rằm tháng Chạp ."
          },
          {
            "articleTitle": "3 lưu ý cúng rằm tháng Chạp gia chủ phải biết để tránh xui rủi",
            "url": "https://kienthuc.net.vn/kho-tri-thuc/3-luu-y-cung-ram-thang-chap-gia-chu-phai-biet-de-tranh-xui-rui-1327835.html",
            "source": "Báo điện tử Kiến Thức",
            "time": "6 hours ago",
            "snippet": "Rằm tháng Chạp là ngày rằm cuối cùng trong năm nên rất được coi trọng và chuẩn bị kỹ lưỡng. Trong dịp này, gia chủ cần chú ý những điều dưới đây."
          },
          {
            "articleTitle": "Lộc lá vô biên nếu mâm cúng mặn rằm Tháng Chạp có món này",
            "url": "https://kienthuc.net.vn/kho-tri-thuc/loc-la-vo-bien-neu-mam-cung-man-ram-thang-chap-co-mon-nay-1327609.html",
            "source": "Báo điện tử Kiến Thức",
            "time": "13 hours ago",
            "snippet": "Mâm cúng rằm tháng Chạp, bên cạnh hoa quả, gia chủ cần chuẩn bị trêm mâm cỗ món ăn đỏ như son này. Chắc chắn sẽ khiến Thần Tài ưng bụng, năm mới lộc lá vô biên."
          },
          {
            "articleTitle": "Cúng Rằm tháng Chạp nhớ lưu ý những điều này kẻo Thần tài trách phạt, tự tay quét sạch tài lộc",
            "url": "https://phunutoday.vn/cung-ram-thang-chap-nho-luu-y-nhung-dieu-nay-keo-than-tai-trach-phat-tu-tay-quet-sach-tai-loc-d239687.html",
            "source": "Phụ Nữ Today (lời tuyên bố phát cho các báo)",
            "time": "5 hours ago",
            "snippet": "Rằm tháng Chạp là 1 trong 3 ngày lễ quan trọng dịp cuối năm của người Việt. Dưới đây là những lưu ý khi cúng Rằm tháng Chạp các gia đình phải nắm."
          },
          {
            "articleTitle": "Cách làm mâm cỗ cúng Rằm tháng Chạp nhanh gọn, đơn giản và đẹp mắt nhất",
            "url": "http://danviet.vn/song-tre/cach-lam-mam-co-cung-ram-thang-chap-nhanh-gon-don-gian-va-dep-mat-nhat-1048443.html",
            "source": "Báo Dân Việt",
            "time": "8 hours ago",
            "snippet": "Rằm tháng Chạp là ngày lễ quan trọng của tháng cuối cùng trong năm, trước lễ cúng Ông Táo và giao thừa."
          },
          {
            "articleTitle": "Giao thừa 2020 nên cúng ở ngoài sân hay trong nhà trước?",
            "url": "https://cungcau.vn/giao-thua-2020-nen-cung-o-ngoai-san-hay-trong-nha-truoc-d193165.html",
            "source": "Cung Cầu",
            "time": "6 hours ago",
            "snippet": "Theo phong tục đón giao thừa ở Việt Nam, thời khắc giao thừa là giây phút vô cùng thiêng liêng mà người người đón chờ."
          },
          {
            "articleTitle": "Ngày Rằm tháng Chạp, đặt vật phong thủy này lên bàn thờ để cả năm đón may mắn ngập tràn",
            "url": "https://vtimes.com.au/ngay-ram-thang-chap-dat-vat-phong-thuy-nay-len-ban-tho-de-ca-nam-don-may-man-ngap-tran-3390568.html",
            "source": "Viet Times Australia",
            "time": "6 hours ago",
            "snippet": "Vào thời điểm bắt đầu bước sang ngày Rằm tháng Chạp hoặc sáng sớm, chú ý đặt vật phong thủy này lên bàn thờ để cả năm đón may mắn ngập tràn. 1. Tiền Xu. Nếu bạn muốn sang năm mới cuộc sống sung túc, vui vẻ hơn, có nhiều điều may mắn, tài lộc&nbsp;..."
          },
          {
            "articleTitle": "Sáng sớm ngày Rằm tháng Chạp, đặt 1 trong 3 thứ sau trên bàn thờ, cả năm sau thần tài sẽ tìm đến bạn",
            "url": "https://2sao.vn/sang-som-ngay-ram-thang-chap-dat-1-trong-3-thu-sau-tren-ban-tho-n-207890.html",
            "source": "2Sao",
            "time": "23 hours ago",
            "snippet": "Chú ý đến mẹo phong thủy này trong ngày Rằm tháng Chạp, đảm bảo bạn chắc chắn sẽ có một cuộc sống sung túc, may mắn cả năm 2020."
          }
        ],
        "idsForDedup": [
          "/g/11bc5g18_5 /g/1s04bfz0y",
          "/g/11bc5g18_5 /m/01crd5",
          "/g/1s04bfz0y /m/01crd5"
        ],
        "id": "VN_lnk_x0mWQQEwAABQuM_vi",
        "title": "Kitchen God, Kitchen God Festival, Vietnam",
        "entityNames": [
          "Kitchen God",
          "Kitchen God Festival",
          "Vietnam"
        ]
      },
      {
        "image": {
          "newsUrl": "https://baotintuc.vn/the-gioi/hoang-tu-anh-harry-va-cong-nuong-meghan-tu-bo-tuoc-hieu-hoang-gia-20200109082541443.htm",
          "source": "baotintuc.vn",
          "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcSLfu3OK8F0DIznVB2wLGujMEfO7MBucjBraqJHt3EykUeHHr_WF-8XrPXQHCNS6aHULAHjAlGRgJc"
        },
        "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_Md-YQQEwAACoLM_vi&category=all&geo=VN#VN_lnk_Md-YQQEwAACoLM_vi",
        "articles": [
          {
            "articleTitle": "Hoàng tử Anh Harry và Công nương Meghan từ bỏ tước hiệu hoàng gia",
            "url": "https://baotintuc.vn/the-gioi/hoang-tu-anh-harry-va-cong-nuong-meghan-tu-bo-tuoc-hieu-hoang-gia-20200109082541443.htm",
            "source": "baotintuc.vn",
            "time": "6 hours ago",
            "snippet": "Theo báo Daily Mail, cặp đôi tuyên bố sẽ không đại diện cho Hoàng gia Anh trong các sự kiện chính thức, song vẫn sẽ hoàn toàn ủng hộ Nữ hoàng và “thực hiện nghĩa vụ trước Nữ hoàng và khối Thịnh vượng chung”. Quyết định của họ được đưa ra hoàn&nbsp;..."
          },
          {
            "articleTitle": "Tin sốc: Vợ chồng Hoàng tử Harry - Meghan viết đơn rút khỏi hoàng gia Anh",
            "url": "http://giadinh.net.vn/bon-phuong/tin-soc-vo-chong-hoang-tu-harry-meghan-viet-don-rut-khoi-hoang-gia-anh-20200109113618186.htm",
            "source": "Báo Gia đình & Xã hội",
            "time": "2 hours ago",
            "snippet": "Trên tài khoản Instargram, vợ chồng Hoàng tử Harry và Meghan Markle đã chính thức tuyên bố rút lui khỏi hoàng gia Anh. Nhà Sussex thông báo: &quot;Sau một thời gian dài suy nghĩ và cùng nhau thảo luận, chúng tôi đã quyết định sẽ có một bước chuyển đổi&nbsp;..."
          },
          {
            "articleTitle": "Thông báo gây sốc của vợ chồng hoàng tử Harry",
            "url": "http://nld.com.vn/thoi-su-quoc-te/thong-bao-gay-soc-cua-vo-chong-hoang-tu-harry-20200109101237941.htm",
            "source": "Người Lao Động",
            "time": "3 hours ago",
            "snippet": "(NLĐO) - Hoàng tử Harry và vợ, công nương Meghan Markle, hôm 8-1 thông báo sắp rút khỏi các vị trí hoàng gia để trở nên &quot;độc lập về tài chính&quot;."
          },
          {
            "articleTitle": "Vợ chồng Hoàng tử Harry từ bỏ tước hiệu Hoàng gia, Nữ hoàng Anh là người biết tin cuối cùng?",
            "url": "https://cafebiz.vn/vo-chong-hoang-tu-harry-tu-bo-tuoc-hieu-hoang-gia-nu-hoang-anh-la-nguoi-biet-tin-cuoi-cung-20200109095506158.chn",
            "source": "CafeBiz.vn",
            "time": "4 hours ago",
            "snippet": "Theo Reuters, Nữ hoàng Elizabeth II có vẻ như là người cuối cùng biết được quyết định của vợ chồng Hoàng tử Harry, khi thông tin về sự việc đã tràn ngập các phương tiện truyền thông."
          },
          {
            "articleTitle": "Vợ chồng Meghan sắp phải thuê nhà",
            "url": "https://ngoisao.net/thoi-cuoc/vo-chong-meghan-sap-phai-thue-nha-4039460.html",
            "source": "Ngôi Sao",
            "time": "2 hours ago",
            "snippet": "Muốn giữ lại Frogmore Cottage để cư ngụ ở Anh sau khi từ bỏ nhiệm vụ hoàng gia, Harry - Meghan có thể sẽ phải trả tiền thuê. - Ngôi sao."
          },
          {
            "articleTitle": "Rời hoàng gia, Harry và Meghan mất luôn nguồn tài trợ hơn 2,6 triệu đô/năm",
            "url": "https://saostar.vn/the-gioi/roi-hoang-gia-harry-va-meghan-mat-luon-nguon-tai-tro-6787503.html",
            "source": "Saostar.vn",
            "time": "1 hour ago",
            "snippet": "Tuy nhiên, người nộp thuế ở Anh vẫn sẽ tiếp tục chi 600.000 £ (787.000 USD) mỗi năm cho 6 vệ sĩ bảo vệ gia đình nhỏ của Harry và Meghan. Cùng với bé Archie, Công tước và Nữ công tước xứ Sussex sẽ luân phiên sống ở Anh và Bắc Mỹ. Rất có khả năng&nbsp;..."
          },
          {
            "articleTitle": "Hoàng tử Harry và công nương Meghan muốn &#39;rút&#39; khỏi gia đình Hoàng gia",
            "url": "https://vtc.vn/thoi-su-quoc-te/hoang-tu-harry-va-cong-nuong-meghan-muon-rut-khoi-gia-dinh-hoang-gia-ar521124.html",
            "source": "VTC News",
            "time": "4 hours ago",
            "snippet": "Gia đình Công tước Sussex cho biết, họ muốn hướng tới việc độc lập tài chính và vẫn sẽ dành sự ủng hộ đối với Nữ hoàng."
          },
          {
            "articleTitle": "Rời bỏ hoàng gia, vợ chồng hoàng tử Harry kiếm tiền từ đâu?",
            "url": "https://news.zing.vn/roi-bo-hoang-gia-vo-chong-hoang-tu-harry-kiem-tien-tu-dau-post1034178.html",
            "source": "Zing.vn",
            "time": "4 hours ago",
            "snippet": "Hoàng tử Harry và vợ vốn đã là những triệu phú với nguồn thu riêng. Việc từ bỏ cuộc sống hoàng gia là cơ hội để họ gây dựng và phát triển sự nghiệp của mình."
          },
          {
            "articleTitle": "Vợ chồng Hoàng tử Anh từ bỏ vai trò thành viên cấp cao của Hoàng gia",
            "url": "https://www.vietnamplus.vn/vo-chong-hoang-tu-anh-tu-bo-vai-tro-thanh-vien-cap-cao-cua-hoang-gia/617528.vnp",
            "source": "Vietnam Plus (lời tuyên bố phát cho các báo)",
            "time": "3 hours ago",
            "snippet": "Ngày 8/1, Vợ chồng Hoàng tử Anh Harry và Công nương Meghan tuyên bố sẽ từ bỏ vai trò thành viên cấp cao của Hoàng gia Anh, một quyết định gây bất ngờ. Trên mạng xã hội Instagram, vợ chồng Hoàng tử Harry cho biết họ muốn ra riêng để làm việc và&nbsp;..."
          },
          {
            "articleTitle": "Vợ chồng hoàng tử Anh từ bỏ tước hiệu hoàng gia",
            "url": "https://congly.vn/the-gioi/tin-nhanh/vo-chong-hoang-tu-anh-tu-bo-tuoc-hieu-hoang-gia-327712.html",
            "source": "Báo Công Lý",
            "time": "4 hours ago",
            "snippet": "Vợ chồng hoàng tử nước Anh Harry và công nương Meghan Markle đã quyết định từ bỏ tước hiệu hoàng gia."
          }
        ],
        "idsForDedup": [
          "/g/11g0289lfb /m/03rbf",
          "/g/11g0289lfb /m/0ckz8",
          "/m/03rbf /m/0ckz8"
        ],
        "id": "VN_lnk_Md-YQQEwAACoLM_vi",
        "title": "Prince Harry, Duke of Sussex, British royal family, Wedding of Prince Harry and Meghan Markle",
        "entityNames": [
          "Prince Harry, Duke of Sussex",
          "British royal family",
          "Wedding of Prince Harry and Meghan Markle"
        ]
      }
    ]
  },
  "date": "Jan 9, 2020",
  "hideAllImages": false
}
*/
const realtimetrends = (opts, callback) => {
	// https://trends.google.com.vn/trends/api/realtimetrends?hl=vi-VN&tz=-420&cat=b&fi=0&fs=0&geo=VN&ri=300&rs=20&sort=0
	/*
	cat=all All
	cat=b bussiness
	cat=e Entertainment
	cat=m Health
	cat=t Sci/Tech
	cat=s Sport
	cat=h Top stories
	*/

  let categories = {
    ALL: 'all',
    BUSSINESS: 'b',
    ENTERTAINMENT: 'e',
    HEALTH: 'm',
    SCI_TECH: 't',
    SPORT: 's',
    TOP_STORIES: 'h'
  }

  opts = Object.assign({}, trendsDefaultOpts, opts);
  opts.category = categories[opts.category] || categories.ALL;

  let urlRealtime = `https://trends.google.com.vn/trends/api/realtimetrends?hl=${opts.hl}&tz=${opts.tz}&cat=${opts.category}&fi=0&fs=0&geo=${opts.geo}&ri=300&rs=20&sort=0`;

  debug('realtimetrends urlRealtime= %s', urlRealtime);

	request({
		url: urlRealtime,
		method: 'GET',
		headers: {
			'referer': `https://trends.google.com.vn/trends/trendingsearches/realtime?geo=${opts.geo}&category=${opts.category}`
		},
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(4);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "default": {
    "timelineData": [
      {
        "time": "1578362400",
        "formattedTime": "Jan 7, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 7 at 9:00 AM",
        "value": 35,
        "formattedValue": "35"
      },
      {
        "time": "1578366000",
        "formattedTime": "Jan 7, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 7 at 10:00 AM",
        "value": 23,
        "formattedValue": "23"
      },
      {
        "time": "1578369600",
        "formattedTime": "Jan 7, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 7 at 11:00 AM",
        "value": 18,
        "formattedValue": "18"
      },
      {
        "time": "1578373200",
        "formattedTime": "Jan 7, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 7 at 12:00 PM",
        "value": 18,
        "formattedValue": "18"
      },
      {
        "time": "1578376800",
        "formattedTime": "Jan 7, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 7 at 1:00 PM",
        "value": 32,
        "formattedValue": "32"
      },
      {
        "time": "1578380400",
        "formattedTime": "Jan 7, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 7 at 2:00 PM",
        "value": 6,
        "formattedValue": "6"
      },
      {
        "time": "1578384000",
        "formattedTime": "Jan 7, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 7 at 3:00 PM",
        "value": 6,
        "formattedValue": "6"
      },
      {
        "time": "1578387600",
        "formattedTime": "Jan 7, 2020 at 4:00 PM",
        "formattedAxisTime": "Jan 7 at 4:00 PM",
        "value": 20,
        "formattedValue": "20"
      },
      {
        "time": "1578391200",
        "formattedTime": "Jan 7, 2020 at 5:00 PM",
        "formattedAxisTime": "Jan 7 at 5:00 PM",
        "value": 16,
        "formattedValue": "16"
      },
      {
        "time": "1578394800",
        "formattedTime": "Jan 7, 2020 at 6:00 PM",
        "formattedAxisTime": "Jan 7 at 6:00 PM",
        "value": 9,
        "formattedValue": "9"
      },
      {
        "time": "1578398400",
        "formattedTime": "Jan 7, 2020 at 7:00 PM",
        "formattedAxisTime": "Jan 7 at 7:00 PM",
        "value": 37,
        "formattedValue": "37"
      },
      {
        "time": "1578402000",
        "formattedTime": "Jan 7, 2020 at 8:00 PM",
        "formattedAxisTime": "Jan 7 at 8:00 PM",
        "value": 10,
        "formattedValue": "10"
      },
      {
        "time": "1578405600",
        "formattedTime": "Jan 7, 2020 at 9:00 PM",
        "formattedAxisTime": "Jan 7 at 9:00 PM",
        "value": 16,
        "formattedValue": "16"
      },
      {
        "time": "1578409200",
        "formattedTime": "Jan 7, 2020 at 10:00 PM",
        "formattedAxisTime": "Jan 7 at 10:00 PM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578412800",
        "formattedTime": "Jan 7, 2020 at 11:00 PM",
        "formattedAxisTime": "Jan 7 at 11:00 PM",
        "value": 20,
        "formattedValue": "20"
      },
      {
        "time": "1578416400",
        "formattedTime": "Jan 8, 2020 at 12:00 AM",
        "formattedAxisTime": "Jan 8 at 12:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578420000",
        "formattedTime": "Jan 8, 2020 at 1:00 AM",
        "formattedAxisTime": "Jan 8 at 1:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578423600",
        "formattedTime": "Jan 8, 2020 at 2:00 AM",
        "formattedAxisTime": "Jan 8 at 2:00 AM",
        "value": 45,
        "formattedValue": "45"
      },
      {
        "time": "1578427200",
        "formattedTime": "Jan 8, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 8 at 3:00 AM",
        "value": 100,
        "formattedValue": "100"
      },
      {
        "time": "1578430800",
        "formattedTime": "Jan 8, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 8 at 4:00 AM",
        "value": 83,
        "formattedValue": "83"
      },
      {
        "time": "1578434400",
        "formattedTime": "Jan 8, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 8 at 5:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578438000",
        "formattedTime": "Jan 8, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 8 at 6:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578441600",
        "formattedTime": "Jan 8, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 8 at 7:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578445200",
        "formattedTime": "Jan 8, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 8 at 8:00 AM",
        "value": 13,
        "formattedValue": "13"
      },
      {
        "time": "1578448800",
        "formattedTime": "Jan 8, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 8 at 9:00 AM",
        "value": 6,
        "formattedValue": "6"
      },
      {
        "time": "1578452400",
        "formattedTime": "Jan 8, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 8 at 10:00 AM",
        "value": 46,
        "formattedValue": "46"
      },
      {
        "time": "1578456000",
        "formattedTime": "Jan 8, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 8 at 11:00 AM",
        "value": 11,
        "formattedValue": "11"
      },
      {
        "time": "1578459600",
        "formattedTime": "Jan 8, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 8 at 12:00 PM",
        "value": 12,
        "formattedValue": "12"
      },
      {
        "time": "1578463200",
        "formattedTime": "Jan 8, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 8 at 1:00 PM",
        "value": 18,
        "formattedValue": "18"
      },
      {
        "time": "1578466800",
        "formattedTime": "Jan 8, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 8 at 2:00 PM",
        "value": 18,
        "formattedValue": "18"
      },
      {
        "time": "1578470400",
        "formattedTime": "Jan 8, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 8 at 3:00 PM",
        "value": 5,
        "formattedValue": "5"
      },
      {
        "time": "1578474000",
        "formattedTime": "Jan 8, 2020 at 4:00 PM",
        "formattedAxisTime": "Jan 8 at 4:00 PM",
        "value": 9,
        "formattedValue": "9"
      },
      {
        "time": "1578477600",
        "formattedTime": "Jan 8, 2020 at 5:00 PM",
        "formattedAxisTime": "Jan 8 at 5:00 PM",
        "value": 10,
        "formattedValue": "10"
      },
      {
        "time": "1578481200",
        "formattedTime": "Jan 8, 2020 at 6:00 PM",
        "formattedAxisTime": "Jan 8 at 6:00 PM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578484800",
        "formattedTime": "Jan 8, 2020 at 7:00 PM",
        "formattedAxisTime": "Jan 8 at 7:00 PM",
        "value": 9,
        "formattedValue": "9"
      },
      {
        "time": "1578488400",
        "formattedTime": "Jan 8, 2020 at 8:00 PM",
        "formattedAxisTime": "Jan 8 at 8:00 PM",
        "value": 9,
        "formattedValue": "9"
      },
      {
        "time": "1578492000",
        "formattedTime": "Jan 8, 2020 at 9:00 PM",
        "formattedAxisTime": "Jan 8 at 9:00 PM",
        "value": 19,
        "formattedValue": "19"
      },
      {
        "time": "1578495600",
        "formattedTime": "Jan 8, 2020 at 10:00 PM",
        "formattedAxisTime": "Jan 8 at 10:00 PM",
        "value": 6,
        "formattedValue": "6"
      },
      {
        "time": "1578499200",
        "formattedTime": "Jan 8, 2020 at 11:00 PM",
        "formattedAxisTime": "Jan 8 at 11:00 PM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578502800",
        "formattedTime": "Jan 9, 2020 at 12:00 AM",
        "formattedAxisTime": "Jan 9 at 12:00 AM",
        "value": 14,
        "formattedValue": "14"
      },
      {
        "time": "1578506400",
        "formattedTime": "Jan 9, 2020 at 1:00 AM",
        "formattedAxisTime": "Jan 9 at 1:00 AM",
        "value": 23,
        "formattedValue": "23"
      },
      {
        "time": "1578510000",
        "formattedTime": "Jan 9, 2020 at 2:00 AM",
        "formattedAxisTime": "Jan 9 at 2:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578513600",
        "formattedTime": "Jan 9, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 9 at 3:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578517200",
        "formattedTime": "Jan 9, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 9 at 4:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578520800",
        "formattedTime": "Jan 9, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 9 at 5:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578524400",
        "formattedTime": "Jan 9, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 9 at 6:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578528000",
        "formattedTime": "Jan 9, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 9 at 7:00 AM",
        "value": 9,
        "formattedValue": "9"
      },
      {
        "time": "1578531600",
        "formattedTime": "Jan 9, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 9 at 8:00 AM",
        "value": 0,
        "formattedValue": "0"
      },
      {
        "time": "1578535200",
        "formattedTime": "Jan 9, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 9 at 9:00 AM",
        "value": 30,
        "formattedValue": "30"
      },
      {
        "time": "1578538800",
        "formattedTime": "Jan 9, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 9 at 10:00 AM",
        "value": 6,
        "formattedValue": "6"
      },
      {
        "time": "1578542400",
        "formattedTime": "Jan 9, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 9 at 11:00 AM",
        "value": 18,
        "formattedValue": "18"
      },
      {
        "time": "1578546000",
        "formattedTime": "Jan 9, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 9 at 12:00 PM",
        "value": 39,
        "formattedValue": "39"
      },
      {
        "time": "1578549600",
        "formattedTime": "Jan 9, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 9 at 1:00 PM",
        "value": 28,
        "formattedValue": "28"
      },
      {
        "time": "1578553200",
        "formattedTime": "Jan 9, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 9 at 2:00 PM",
        "value": 44,
        "formattedValue": "44"
      },
      {
        "time": "1578556800",
        "formattedTime": "Jan 9, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 9 at 3:00 PM",
        "value": 47,
        "formattedValue": "47",
        "isPartial": true
      }
    ]
  }
}
*/
const widgetdata_timeline = (opts, callback) => {
	// INTEREST OVER TIME trong search realtime
	// require token !!!!
	/*
	{"geo":{"country":"VN"},"time":"2020-01-07T02\\:00\\:00+2020-01-09T08\\:05\\:00","resolution":"HOUR","mid":["%2Fg%2F122lf050","%2Fm%2F0fnff","%2Fg%2F1tgjhr_8","%2Fg%2F1pzpdb8fn","%2Fg%2F11cm14zjjd"],"locale":"vi-VN"}
	*/
	request({
		url: `https://trends.google.com.vn/trends/api/widgetdata/timeline?hl=vi-VN&tz=-420&req=%7B%22geo%22:%7B%22country%22:%22VN%22%7D,%22time%22:%222020-01-07T02%5C%5C:00%5C%5C:00+2020-01-09T08%5C%5C:05%5C%5C:00%22,%22resolution%22:%22HOUR%22,%22mid%22:%5B%22%2Fg%2F122lf050%22,%22%2Fm%2F0fnff%22,%22%2Fg%2F1tgjhr_8%22,%22%2Fg%2F1pzpdb8fn%22,%22%2Fg%2F11cm14zjjd%22%5D,%22locale%22:%22vi-VN%22%7D&token=APP6_UEAAAAAXhgw0Xo70NQoxg5D1grAxg-X2H4618Ea&tz=-420`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "default": {
    "response": [
      {
        "errorCode": 0,
        "timelineResponse": {
          "timelineData": [
            {
              "time": "1578474000",
              "formattedTime": "Jan 8, 2020 at 4:00 PM",
              "value": 37,
              "formattedValue": "37"
            },
            {
              "time": "1578477600",
              "formattedTime": "Jan 8, 2020 at 5:00 PM",
              "value": 64,
              "formattedValue": "64"
            },
            {
              "time": "1578481200",
              "formattedTime": "Jan 8, 2020 at 6:00 PM",
              "value": 68,
              "formattedValue": "68"
            },
            {
              "time": "1578484800",
              "formattedTime": "Jan 8, 2020 at 7:00 PM",
              "value": 100,
              "formattedValue": "100"
            },
            {
              "time": "1578488400",
              "formattedTime": "Jan 8, 2020 at 8:00 PM",
              "value": 86,
              "formattedValue": "86"
            },
            {
              "time": "1578492000",
              "formattedTime": "Jan 8, 2020 at 9:00 PM",
              "value": 81,
              "formattedValue": "81"
            },
            {
              "time": "1578495600",
              "formattedTime": "Jan 8, 2020 at 10:00 PM",
              "value": 71,
              "formattedValue": "71"
            },
            {
              "time": "1578499200",
              "formattedTime": "Jan 8, 2020 at 11:00 PM",
              "value": 35,
              "formattedValue": "35"
            },
            {
              "time": "1578502800",
              "formattedTime": "Jan 9, 2020 at 12:00 AM",
              "value": 24,
              "formattedValue": "24"
            },
            {
              "time": "1578506400",
              "formattedTime": "Jan 9, 2020 at 1:00 AM",
              "value": 20,
              "formattedValue": "20"
            },
            {
              "time": "1578510000",
              "formattedTime": "Jan 9, 2020 at 2:00 AM",
              "value": 19,
              "formattedValue": "19"
            },
            {
              "time": "1578513600",
              "formattedTime": "Jan 9, 2020 at 3:00 AM",
              "value": 22,
              "formattedValue": "22"
            },
            {
              "time": "1578517200",
              "formattedTime": "Jan 9, 2020 at 4:00 AM",
              "value": 29,
              "formattedValue": "29"
            },
            {
              "time": "1578520800",
              "formattedTime": "Jan 9, 2020 at 5:00 AM",
              "value": 46,
              "formattedValue": "46"
            },
            {
              "time": "1578524400",
              "formattedTime": "Jan 9, 2020 at 6:00 AM",
              "value": 59,
              "formattedValue": "59"
            },
            {
              "time": "1578528000",
              "formattedTime": "Jan 9, 2020 at 7:00 AM",
              "value": 49,
              "formattedValue": "49"
            },
            {
              "time": "1578531600",
              "formattedTime": "Jan 9, 2020 at 8:00 AM",
              "value": 36,
              "formattedValue": "36"
            },
            {
              "time": "1578535200",
              "formattedTime": "Jan 9, 2020 at 9:00 AM",
              "value": 30,
              "formattedValue": "30"
            },
            {
              "time": "1578538800",
              "formattedTime": "Jan 9, 2020 at 10:00 AM",
              "value": 31,
              "formattedValue": "31"
            },
            {
              "time": "1578542400",
              "formattedTime": "Jan 9, 2020 at 11:00 AM",
              "value": 38,
              "formattedValue": "38"
            },
            {
              "time": "1578546000",
              "formattedTime": "Jan 9, 2020 at 12:00 PM",
              "value": 38,
              "formattedValue": "38"
            },
            {
              "time": "1578549600",
              "formattedTime": "Jan 9, 2020 at 1:00 PM",
              "value": 31,
              "formattedValue": "31"
            },
            {
              "time": "1578553200",
              "formattedTime": "Jan 9, 2020 at 2:00 PM",
              "value": 31,
              "formattedValue": "31"
            },
            {
              "time": "1578556800",
              "formattedTime": "Jan 9, 2020 at 3:00 PM",
              "value": 38,
              "formattedValue": "38"
            }
          ]
        }
      },
      {
        "errorCode": 0,
        "timelineResponse": {
          "timelineData": [
            {
              "time": "1578474000",
              "formattedTime": "Jan 8, 2020 at 4:00 PM",
              "value": 4,
              "formattedValue": "4"
            },
            {
              "time": "1578477600",
              "formattedTime": "Jan 8, 2020 at 5:00 PM",
              "value": 4,
              "formattedValue": "4"
            },
            {
              "time": "1578481200",
              "formattedTime": "Jan 8, 2020 at 6:00 PM",
              "value": 9,
              "formattedValue": "9"
            },
            {
              "time": "1578484800",
              "formattedTime": "Jan 8, 2020 at 7:00 PM",
              "value": 16,
              "formattedValue": "16"
            },
            {
              "time": "1578488400",
              "formattedTime": "Jan 8, 2020 at 8:00 PM",
              "value": 14,
              "formattedValue": "14"
            },
            {
              "time": "1578492000",
              "formattedTime": "Jan 8, 2020 at 9:00 PM",
              "value": 18,
              "formattedValue": "18"
            },
            {
              "time": "1578495600",
              "formattedTime": "Jan 8, 2020 at 10:00 PM",
              "value": 22,
              "formattedValue": "22"
            },
            {
              "time": "1578499200",
              "formattedTime": "Jan 8, 2020 at 11:00 PM",
              "value": 23,
              "formattedValue": "23"
            },
            {
              "time": "1578502800",
              "formattedTime": "Jan 9, 2020 at 12:00 AM",
              "value": 30,
              "formattedValue": "30"
            },
            {
              "time": "1578506400",
              "formattedTime": "Jan 9, 2020 at 1:00 AM",
              "value": 30,
              "formattedValue": "30"
            },
            {
              "time": "1578510000",
              "formattedTime": "Jan 9, 2020 at 2:00 AM",
              "value": 62,
              "formattedValue": "62"
            },
            {
              "time": "1578513600",
              "formattedTime": "Jan 9, 2020 at 3:00 AM",
              "value": 91,
              "formattedValue": "91"
            },
            {
              "time": "1578517200",
              "formattedTime": "Jan 9, 2020 at 4:00 AM",
              "value": 28,
              "formattedValue": "28"
            },
            {
              "time": "1578520800",
              "formattedTime": "Jan 9, 2020 at 5:00 AM",
              "value": 48,
              "formattedValue": "48"
            },
            {
              "time": "1578524400",
              "formattedTime": "Jan 9, 2020 at 6:00 AM",
              "value": 100,
              "formattedValue": "100"
            },
            {
              "time": "1578528000",
              "formattedTime": "Jan 9, 2020 at 7:00 AM",
              "value": 34,
              "formattedValue": "34"
            },
            {
              "time": "1578531600",
              "formattedTime": "Jan 9, 2020 at 8:00 AM",
              "value": 31,
              "formattedValue": "31"
            },
            {
              "time": "1578535200",
              "formattedTime": "Jan 9, 2020 at 9:00 AM",
              "value": 23,
              "formattedValue": "23"
            },
            {
              "time": "1578538800",
              "formattedTime": "Jan 9, 2020 at 10:00 AM",
              "value": 15,
              "formattedValue": "15"
            },
            {
              "time": "1578542400",
              "formattedTime": "Jan 9, 2020 at 11:00 AM",
              "value": 49,
              "formattedValue": "49"
            },
            {
              "time": "1578546000",
              "formattedTime": "Jan 9, 2020 at 12:00 PM",
              "value": 37,
              "formattedValue": "37"
            },
            {
              "time": "1578549600",
              "formattedTime": "Jan 9, 2020 at 1:00 PM",
              "value": 38,
              "formattedValue": "38"
            },
            {
              "time": "1578553200",
              "formattedTime": "Jan 9, 2020 at 2:00 PM",
              "value": 14,
              "formattedValue": "14"
            },
            {
              "time": "1578556800",
              "formattedTime": "Jan 9, 2020 at 3:00 PM",
              "value": 8,
              "formattedValue": "8"
            }
          ]
        }
      },
      {
        "errorCode": 0,
        "timelineResponse": {
          "timelineData": [
            {
              "time": "1578474000",
              "formattedTime": "Jan 8, 2020 at 4:00 PM",
              "value": 29,
              "formattedValue": "29"
            },
            {
              "time": "1578477600",
              "formattedTime": "Jan 8, 2020 at 5:00 PM",
              "value": 50,
              "formattedValue": "50"
            },
            {
              "time": "1578481200",
              "formattedTime": "Jan 8, 2020 at 6:00 PM",
              "value": 56,
              "formattedValue": "56"
            },
            {
              "time": "1578484800",
              "formattedTime": "Jan 8, 2020 at 7:00 PM",
              "value": 86,
              "formattedValue": "86"
            },
            {
              "time": "1578488400",
              "formattedTime": "Jan 8, 2020 at 8:00 PM",
              "value": 100,
              "formattedValue": "100"
            },
            {
              "time": "1578492000",
              "formattedTime": "Jan 8, 2020 at 9:00 PM",
              "value": 99,
              "formattedValue": "99"
            },
            {
              "time": "1578495600",
              "formattedTime": "Jan 8, 2020 at 10:00 PM",
              "value": 94,
              "formattedValue": "94"
            },
            {
              "time": "1578499200",
              "formattedTime": "Jan 8, 2020 at 11:00 PM",
              "value": 42,
              "formattedValue": "42"
            },
            {
              "time": "1578502800",
              "formattedTime": "Jan 9, 2020 at 12:00 AM",
              "value": 26,
              "formattedValue": "26"
            },
            {
              "time": "1578506400",
              "formattedTime": "Jan 9, 2020 at 1:00 AM",
              "value": 23,
              "formattedValue": "23"
            },
            {
              "time": "1578510000",
              "formattedTime": "Jan 9, 2020 at 2:00 AM",
              "value": 24,
              "formattedValue": "24"
            },
            {
              "time": "1578513600",
              "formattedTime": "Jan 9, 2020 at 3:00 AM",
              "value": 26,
              "formattedValue": "26"
            },
            {
              "time": "1578517200",
              "formattedTime": "Jan 9, 2020 at 4:00 AM",
              "value": 35,
              "formattedValue": "35"
            },
            {
              "time": "1578520800",
              "formattedTime": "Jan 9, 2020 at 5:00 AM",
              "value": 51,
              "formattedValue": "51"
            },
            {
              "time": "1578524400",
              "formattedTime": "Jan 9, 2020 at 6:00 AM",
              "value": 68,
              "formattedValue": "68"
            },
            {
              "time": "1578528000",
              "formattedTime": "Jan 9, 2020 at 7:00 AM",
              "value": 50,
              "formattedValue": "50"
            },
            {
              "time": "1578531600",
              "formattedTime": "Jan 9, 2020 at 8:00 AM",
              "value": 36,
              "formattedValue": "36"
            },
            {
              "time": "1578535200",
              "formattedTime": "Jan 9, 2020 at 9:00 AM",
              "value": 28,
              "formattedValue": "28"
            },
            {
              "time": "1578538800",
              "formattedTime": "Jan 9, 2020 at 10:00 AM",
              "value": 28,
              "formattedValue": "28"
            },
            {
              "time": "1578542400",
              "formattedTime": "Jan 9, 2020 at 11:00 AM",
              "value": 35,
              "formattedValue": "35"
            },
            {
              "time": "1578546000",
              "formattedTime": "Jan 9, 2020 at 12:00 PM",
              "value": 33,
              "formattedValue": "33"
            },
            {
              "time": "1578549600",
              "formattedTime": "Jan 9, 2020 at 1:00 PM",
              "value": 25,
              "formattedValue": "25"
            },
            {
              "time": "1578553200",
              "formattedTime": "Jan 9, 2020 at 2:00 PM",
              "value": 26,
              "formattedValue": "26"
            },
            {
              "time": "1578556800",
              "formattedTime": "Jan 9, 2020 at 3:00 PM",
              "value": 28,
              "formattedValue": "28"
            }
          ]
        }
      },
      {
        "errorCode": 0,
        "timelineResponse": {
          "timelineData": [
            {
              "time": "1578474000",
              "formattedTime": "Jan 8, 2020 at 4:00 PM",
              "value": 38,
              "formattedValue": "38"
            },
            {
              "time": "1578477600",
              "formattedTime": "Jan 8, 2020 at 5:00 PM",
              "value": 9,
              "formattedValue": "9"
            },
            {
              "time": "1578481200",
              "formattedTime": "Jan 8, 2020 at 6:00 PM",
              "value": 14,
              "formattedValue": "14"
            },
            {
              "time": "1578484800",
              "formattedTime": "Jan 8, 2020 at 7:00 PM",
              "value": 24,
              "formattedValue": "24"
            },
            {
              "time": "1578488400",
              "formattedTime": "Jan 8, 2020 at 8:00 PM",
              "value": 24,
              "formattedValue": "24"
            },
            {
              "time": "1578492000",
              "formattedTime": "Jan 8, 2020 at 9:00 PM",
              "value": 16,
              "formattedValue": "16"
            },
            {
              "time": "1578495600",
              "formattedTime": "Jan 8, 2020 at 10:00 PM",
              "value": 10,
              "formattedValue": "10"
            },
            {
              "time": "1578499200",
              "formattedTime": "Jan 8, 2020 at 11:00 PM",
              "value": 15,
              "formattedValue": "15"
            },
            {
              "time": "1578502800",
              "formattedTime": "Jan 9, 2020 at 12:00 AM",
              "value": 0,
              "formattedValue": "0"
            },
            {
              "time": "1578506400",
              "formattedTime": "Jan 9, 2020 at 1:00 AM",
              "value": 81,
              "formattedValue": "81"
            },
            {
              "time": "1578510000",
              "formattedTime": "Jan 9, 2020 at 2:00 AM",
              "value": 0,
              "formattedValue": "0"
            },
            {
              "time": "1578513600",
              "formattedTime": "Jan 9, 2020 at 3:00 AM",
              "value": 0,
              "formattedValue": "0"
            },
            {
              "time": "1578517200",
              "formattedTime": "Jan 9, 2020 at 4:00 AM",
              "value": 0,
              "formattedValue": "0"
            },
            {
              "time": "1578520800",
              "formattedTime": "Jan 9, 2020 at 5:00 AM",
              "value": 0,
              "formattedValue": "0"
            },
            {
              "time": "1578524400",
              "formattedTime": "Jan 9, 2020 at 6:00 AM",
              "value": 42,
              "formattedValue": "42"
            },
            {
              "time": "1578528000",
              "formattedTime": "Jan 9, 2020 at 7:00 AM",
              "value": 0,
              "formattedValue": "0"
            },
            {
              "time": "1578531600",
              "formattedTime": "Jan 9, 2020 at 8:00 AM",
              "value": 11,
              "formattedValue": "11"
            },
            {
              "time": "1578535200",
              "formattedTime": "Jan 9, 2020 at 9:00 AM",
              "value": 31,
              "formattedValue": "31"
            },
            {
              "time": "1578538800",
              "formattedTime": "Jan 9, 2020 at 10:00 AM",
              "value": 21,
              "formattedValue": "21"
            },
            {
              "time": "1578542400",
              "formattedTime": "Jan 9, 2020 at 11:00 AM",
              "value": 21,
              "formattedValue": "21"
            },
            {
              "time": "1578546000",
              "formattedTime": "Jan 9, 2020 at 12:00 PM",
              "value": 10,
              "formattedValue": "10"
            },
            {
              "time": "1578549600",
              "formattedTime": "Jan 9, 2020 at 1:00 PM",
              "value": 100,
              "formattedValue": "100"
            },
            {
              "time": "1578553200",
              "formattedTime": "Jan 9, 2020 at 2:00 PM",
              "value": 19,
              "formattedValue": "19"
            },
            {
              "time": "1578556800",
              "formattedTime": "Jan 9, 2020 at 3:00 PM",
              "value": 0,
              "formattedValue": "0"
            }
          ]
        }
      }
    ]
  }
}
*/
const widgetdata_sparkline = (opts, callback) => {
	request({
		url: `https://trends.google.com.vn/trends/api/widgetdata/sparkline?hl=vi-VN&tz=-420&id=VN_lnk_mJ2YQQEwAAABbM_vi&id=VN_lnk_ErC-QQEwAACtQM_vi&id=VN_lnk_KJvcQQEwAAD1aM_vi&id=VN_lnk_lxq2QQEwAAAg6M_vi`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "default": {
    "queries": [
      {
        "query": "lịch thi đấu u23",
        "value": 100,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "u23 2020 lịch thi đấu",
        "value": 47,
        "link": "/trends/explore?q=%22u23+2020+l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch thi đấu u23 châu á 2020",
        "value": 22,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+ch%C3%A2u+%C3%A1+2020%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "u23 việt nam",
        "value": 13,
        "link": "/trends/explore?q=%22u23+vi%E1%BB%87t+nam%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "u23",
        "value": 12,
        "link": "/trends/explore?q=%22u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch bóng đá u23",
        "value": 11,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+b%C3%B3ng+%C4%91%C3%A1+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "vòng chung kết u23 châu á 2020",
        "value": 11,
        "link": "/trends/explore?q=%22v%C3%B2ng+chung+k%E1%BA%BFt+u23+ch%C3%A2u+%C3%A1+2020%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "thái lan vs bahrain",
        "value": 10,
        "link": "/trends/explore?q=%22th%C3%A1i+lan+vs+bahrain%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "u23 châu á năm 2020",
        "value": 7,
        "link": "/trends/explore?q=%22u23+ch%C3%A2u+%C3%A1+n%C4%83m+2020%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch thi đấu bóng đá u23",
        "value": 6,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+b%C3%B3ng+%C4%91%C3%A1+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lich thi dau u23",
        "value": 6,
        "link": "/trends/explore?q=%22lich+thi+dau+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch thi đấu u23 việt nam",
        "value": 5,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+vi%E1%BB%87t+nam%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch u23",
        "value": 5,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "kết quả bóng đá u23",
        "value": 4,
        "link": "/trends/explore?q=%22k%E1%BA%BFt+qu%E1%BA%A3+b%C3%B3ng+%C4%91%C3%A1+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch đá bóng u23",
        "value": 4,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+%C4%91%C3%A1+b%C3%B3ng+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "trực tiếp u23 châu á",
        "value": 4,
        "link": "/trends/explore?q=%22tr%E1%BB%B1c+ti%E1%BA%BFp+u23+ch%C3%A2u+%C3%A1%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "vck u23",
        "value": 4,
        "link": "/trends/explore?q=%22vck+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch thi đấu u23 châu á năm 2020",
        "value": 4,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+u23+ch%C3%A2u+%C3%A1+n%C4%83m+2020%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "vtv6 trực tiếp bóng đá u23",
        "value": 4,
        "link": "/trends/explore?q=%22vtv6+tr%E1%BB%B1c+ti%E1%BA%BFp+b%C3%B3ng+%C4%91%C3%A1+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "bóng đá u23",
        "value": 4,
        "link": "/trends/explore?q=%22b%C3%B3ng+%C4%91%C3%A1+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "kết quả u23",
        "value": 3,
        "link": "/trends/explore?q=%22k%E1%BA%BFt+qu%E1%BA%A3+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lich thi dau u23 chau a 2020",
        "value": 3,
        "link": "/trends/explore?q=%22lich+thi+dau+u23+chau+a+2020%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lich u23",
        "value": 3,
        "link": "/trends/explore?q=%22lich+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "lịch thi đấu vòng chung kết u23 châu á 2020",
        "value": 3,
        "link": "/trends/explore?q=%22l%E1%BB%8Bch+thi+%C4%91%E1%BA%A5u+v%C3%B2ng+chung+k%E1%BA%BFt+u23+ch%C3%A2u+%C3%A1+2020%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      },
      {
        "query": "trực tiếp bóng đá u23",
        "value": 3,
        "link": "/trends/explore?q=%22tr%E1%BB%B1c+ti%E1%BA%BFp+b%C3%B3ng+%C4%91%C3%A1+u23%22&date=2020-01-07T00%5C:00%5C:00+2020-01-09T08%5C:05%5C:00&geo=VN"
      }
    ]
  }
}
*/
const widgetdata_relatedqueries = (opts, callback) => {
	let data = {
    "geo": {
        "country": "VN"
    },
    "time": "2020-01-07T00\\:00\\:00 2020-01-09T08\\:05\\:00",
    "term": [
        "bong da",
        "bóng đá việt nam",
        "bóng đá hôm nay",
        "tin bong da viet nam",
        "lịch bóng đá u23 châu á",
        "tin",
        "tin bóng đá",
        "bóng đá",
        "bong da vn",
        "tin bong da vn",
        "tin bóng đá vn",
        "tin bóng đá hôm nay",
        "tin bong da",
        "tin bong da 24h",
        "tin bóng đá việt nam",
        "bong da viet nam"
    ],
    "mid": [
        "/m/058q9lf",
        "/g/11f647vn3y",
        "/m/0412q4",
        "/g/11c5m51x4q",
        "/m/0j43kf_",
        "/m/0417bk0"
    ],
    "trendinessSettings": {
        "compareTime": "2020-01-03T12\\:00\\:00 2020-01-07T00\\:00\\:00",
        "jumpThreshold": 1.5
    },
    "locale": "vi-VN"
	}

	request({
		url: `https://trends.google.com.vn/trends/api/widgetdata/relatedqueries?hl=vi-VN&tz=-420&lq=true&token=APP6_UEAAAAAXhgw0MjRA3SxpYjrUsZsP5L-B_XJ25X3`,
		method: 'POST',
    jar: cookie,
		json: true,
		body: data,
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "featuredStories": [],
  "trendingStories": [
    {
      "image": {
        "newsUrl": "https://www.24h.com.vn/bong-da/nhan-dinh-bong-da-barcelona-atletico-madrid-cho-messi-thuc-giac-dap-loi-ronaldo-c48a1115252.html",
        "source": "Tin tức 24h",
        "imgUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcSUooy6QbdDVZb3HEV9C3F-fglC6YuYT5Or2ygGCNvQykZOJC6deuVpPtUpRzxQyHxibNuFlC9cnE0"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_DSaRQQEwAACd1M_vi&category=h&geo=VN#VN_lnk_DSaRQQEwAACd1M_vi",
      "articles": [
        {
          "articleTitle": "Nhận định bóng đá Barcelona - Atletico Madrid: Chờ Messi &quot;thức giấc&quot;, đáp lời Ronaldo",
          "url": "https://www.24h.com.vn/bong-da/nhan-dinh-bong-da-barcelona-atletico-madrid-cho-messi-thuc-giac-dap-loi-ronaldo-c48a1115252.html",
          "source": "Tin tức 24h",
          "time": "5 hours ago",
          "snippet": "Nhận định bóng đá Barcelona - Atletico Madrid, 2h, 10/1, bán kết Siêu cúp Tây Ban Nha) Đối diện với “mồi ngon“, Messi liệu có “thức giấc“ để đáp lại “lời kêu gọi“ của."
        },
        {
          "articleTitle": "Real Madrid chờ tái đấu “Siêu kinh điển” với Barcelona ở Ả Rập Saudi",
          "url": "https://thanhnien.vn/the-thao/bong-da-quoc-te/real-madrid-cho-tai-dau-sieu-kinh-dien-voi-barcelona-o-a-rap-saudi-109920.html",
          "source": "Báo Thanh Niên",
          "time": "7 hours ago",
          "snippet": "Real Madrid đã vượt qua trở ngại đầu tiên để hướng đến thêm danh hiệu dưới thời HLV Zinadine Zidane khi vượt qua Valencia với tỷ số 3-1 ở trận bán kết Siêu Cúp Tây Ban Nha tại Ả Rập Saudi. Real Madrid sẽ có trận “Siêu kinh điển” trong 1 tháng nếu&nbsp;..."
        },
        {
          "articleTitle": "Kroos lập siêu phẩm đưa Real tới Chung kết Siêu cúp Tây Ban Nha",
          "url": "https://www.goal.com/vn/tintuc/kroos-lap-sieu-pham-dua-real-toi-chung-ket-sieu-cup-tay-ban/1j0m1x45senk81bbkzom00qbex",
          "source": "Goal.com",
          "time": "6 hours ago",
          "snippet": "Toni Kroos. Real Madrid. Valencia. Siêu cúp Tây Ban Nha. Siêu phẩm. Link xem trực tiếp Real Madrid. Lịch thi đấu Siêu cúp Tây Ban Nha. Luka Modrid. Sergio Ramos. Marca. Cầu thủ Real xuất sắc nhất trận. Domenech. Dani Parejo."
        },
        {
          "articleTitle": "Kroos ghi siêu phẩm phạt góc cho Real",
          "url": "https://vnexpress.net/bong-da/kroos-ghi-sieu-pham-phat-goc-cho-real-4039421.html",
          "source": "VnExpress Thể thao",
          "time": "9 hours ago",
          "snippet": "Quả phạt góc thành bàn của Toni Kroos mở ra chiến thắng 3-1 cho Real Madrid trước Valencia, tại bán kết Siêu Cup Tây Ban Nha, tối 8/1."
        },
        {
          "articleTitle": "Đánh bại Valencia, Real Madrid tiến vào chung kết Siêu Cup Tây Ban Nha",
          "url": "https://m.dantri.com.vn/the-thao/danh-bai-valencia-real-madrid-tien-vao-chung-ket-sieu-cup-tay-ban-nha-20200109065944458.htm",
          "source": "Dân Trí",
          "time": "9 hours ago",
          "snippet": "(Dân trí) - Real Madrid đã dễ dàng đánh bại Valencia 3-1 để tiến vào trận chung kết Siêu Cup Tây Ban Nha trên sân King Abdullah Sports City. Người lập công cho đoàn quân HLV Zidane là Kroos, Isco và Modric."
        },
        {
          "articleTitle": "Siêu tiền vệ từng vô địch World Cup khiến cả thế giới trầm trồ bằng siêu phẩm khó tin từ... chấm phạt góc",
          "url": "http://kenh14.vn/sieu-tien-ve-tung-vo-dich-world-cup-khien-ca-the-gioi-tram-tro-bang-sieu-pham-kho-tin-tu-cham-phat-goc-20200109084133035.chn",
          "source": "Kênh 14",
          "time": "4 hours ago",
          "snippet": "Ở góc đá phạt cực hẹp, Kroos lập nên siêu phẩm mà người ta cứ ngỡ chỉ xuất hiện trong những bộ phim hoạt hình hay trò chơi điện tử."
        },
        {
          "articleTitle": "Real Madrid &quot;đánh úp&quot; Valencia, giành vé vào chung kết Siêu cúp",
          "url": "http://nld.com.vn/the-thao/real-madrid-danh-up-valencia-gianh-ve-vao-chung-ket-sieu-cup-20200109070105183.htm",
          "source": "Người Lao Động",
          "time": "8 hours ago",
          "snippet": "Ba bàn thắng của Toni Kroos, Isco và Luka Modric đưa Real Madrid đến trận chung kết Siêu cúp Tây Ban Nha lần đầu có đến 4 đội góp mặt."
        },
        {
          "articleTitle": "Toni Kroos lập siêu phẩm sút phạt góc, Real Madrid vào chung kết Siêu cúp TBN 2020",
          "url": "https://thethaovanhoa.vn/bong-da-tay-ban-nha/toni-kroos-lap-sieu-pham-sut-phat-goc-real-madrid-vao-chung-ket-sieu-cup-tbn-2020-n20200109073139521.htm",
          "source": "Báo Thể thao & Văn hóa",
          "time": "8 hours ago",
          "snippet": "Ket qua bong da, Kết quả bóng đá hôm nay, Valencia 1-3 Real Madrid, kết quả siêu cúp Tây Ban Nha, Kroos, Real Madrid, tin tuc bong da hom nay, kết quả Real Madrid."
        },
        {
          "articleTitle": "Đả bại Valencia 3-1, Real Madrid giành vé chơi trận chung kết Siêu cúp",
          "url": "https://laodong.vn/bong-da-quoc-te/da-bai-valencia-3-1-real-madrid-gianh-ve-choi-tran-chung-ket-sieu-cup-777426.ldo",
          "source": "Báo Lao Động",
          "time": "6 hours ago",
          "snippet": "Kroos (15&#39;), Isco (39&#39;), Modric (65&#39;) thay nhau lập công đã giúp Real đánh bại Valencia 3-1, giành vé vào chơi trận chung kết Siêu cúp Tây Ban Nha."
        },
        {
          "articleTitle": "Barcelona vs Atletico Madrid (2h00 ngày 10/1): Leo Messi luôn là ông vua ở Siêu Cúp",
          "url": "https://thethaovanhoa.vn/bong-da-tay-ban-nha/barcelona-vs-atletico-madrid-2h00-ngay-10-1-leo-messi-luon-la-ong-vua-o-sieu-cup-n20200108231512746.htm",
          "source": "Báo Thể thao & Văn hóa",
          "time": "9 hours ago",
          "snippet": "(Thethaovanhoa.vn) - Không một ai nổi bật hơn Lionel Messi trong lịch sử Siêu Cúp Tây Ban Nha, và Barca đang trông đợi ngôi sao người Argentina sẽ tạo nên khác biệt khi giải đấu được mang đến Saudi Arabia."
        }
      ],
      "idsForDedup": [
        "/m/02rf301 /m/06l22",
        "/m/02rf301 /m/080_y",
        "/m/02rf301 /m/09gqx",
        "/m/02rf301 /m/0hvgt",
        "/m/02rf301 /m/0kcv4",
        "/m/06l22 /m/080_y",
        "/m/06l22 /m/09gqx",
        "/m/06l22 /m/0hvgt",
        "/m/06l22 /m/0kcv4",
        "/m/080_y /m/09gqx",
        "/m/080_y /m/0hvgt",
        "/m/080_y /m/0kcv4",
        "/m/09gqx /m/0hvgt",
        "/m/09gqx /m/0kcv4",
        "/m/0hvgt /m/0kcv4"
      ],
      "id": "VN_lnk_DSaRQQEwAACd1M_vi",
      "title": "Real Madrid C.F., Valencia CF, La Liga, FC Barcelona, Toni Kroos, Zinedine Zidane",
      "entityNames": [
        "Real Madrid C.F.",
        "Valencia CF",
        "La Liga",
        "FC Barcelona",
        "Toni Kroos",
        "Zinedine Zidane"
      ]
    },
    {
      "image": {
        "newsUrl": "http://kenh14.vn/ve-nha-an-tet-2020-chap-canh-uoc-mo-gan-ket-ngay-tet-cho-2000-nguoi-lao-dong-20200108111956191.chn",
        "source": "Kênh 14",
        "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcQl_dHIRApoKE6oj91EjT1Uiw2KJpYXnyAipNUDjjY6V33HkRezzlN3t7xEJv_-9QuWSEfszQoUngo"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_PSasQQEwAACQ1M_vi&category=h&geo=VN#VN_lnk_PSasQQEwAACQ1M_vi",
      "articles": [
        {
          "articleTitle": "&quot;Về Nhà Ăn Tết&quot; 2020 – chắp cánh ước mơ gắn kết ngày Tết cho 2.000 người lao động",
          "url": "http://kenh14.vn/ve-nha-an-tet-2020-chap-canh-uoc-mo-gan-ket-ngay-tet-cho-2000-nguoi-lao-dong-20200108111956191.chn",
          "source": "Kênh 14",
          "time": "2 hours ago",
          "snippet": "Mỗi chiếc vé máy bay/vé xe khách gửi trao cho 2.000 người lao động có ý chí vươn lên trong cuộc sống, trở về sum họp bên gia đình trong dịp Tết Canh Tý sắp tới, không chỉ là niềm vui, mà còn là động lực cống hiến và lan toả sự thành công, niềm cảm hứng&nbsp;..."
        },
        {
          "articleTitle": "Tết Sum vầy, người lao động được nhận &quot;Mái ấm công đoàn&quot;",
          "url": "https://laodong.vn/cong-doan/tet-sum-vay-nguoi-lao-dong-duoc-nhan-mai-am-cong-doan-777446.ldo",
          "source": "Báo Lao Động",
          "time": "4 hours ago",
          "snippet": "Liên đoàn Lao động Thành phố Hà Giang vừa tổ chức Chương trình &quot;Tết sum vầy&quot; năm 2020. Ông Nguyễn Văn Chung – Tỉnh ủy viên, Chủ tịch Liên đoàn Lao động tỉnh Hà Giang đã dự, chỉ đạo."
        },
        {
          "articleTitle": "Tặng hơn 12.000 vé xe, vé tàu cho công nhân về quê đón Tết",
          "url": "https://www.vietnamplus.vn/tang-hon-12000-ve-xe-ve-tau-cho-cong-nhan-ve-que-don-tet/617485.vnp",
          "source": "Vietnam Plus (lời tuyên bố phát cho các báo)",
          "time": "8 hours ago",
          "snippet": "Tối 8/1, tại Nhà Thiếu nhi Quận Thủ Đức, Liên đoàn Lao động Thành phố Hồ Chí Minh tổ chức lễ trao vé xe, vé tàu về quê đón Tết Canh Tý cho công nhân lao động có hoàn cảnh khó khăn các khu chế xuất, khu công nghiệp trên địa bàn thành phố. Phát biểu&nbsp;..."
        },
        {
          "articleTitle": "Ấm áp những mái nhà nghĩa tình",
          "url": "http://laodongthudo.vn/am-ap-nhung-mai-nha-nghia-tinh-101934.html",
          "source": "Lao động Thủ đô",
          "time": "4 hours ago",
          "snippet": "(LĐTĐ) Từ năm 2006, chương trình “Mái ấm Công đoàn” do Liên đoàn Lao động (LĐLĐ) thành phố Hà Nội đã và đang triển khai đã trở thành một hoạt động xã hội có sức lan tỏa sâu rộng, thể hiện tinh thần đoàn kết, tương thân, tương ái “lá lành đùm lá rách”&nbsp;..."
        },
        {
          "articleTitle": "Tết này, cả nhà sum họp",
          "url": "http://nld.com.vn/cong-doan/tet-nay-ca-nha-sum-hop-2020010822300088.htm",
          "source": "Người Lao Động",
          "time": "8 hours ago",
          "snippet": "Chương trình &quot;Tấm vé nghĩa tình&quot; của LĐLĐ TP HCM thực hiện trong nhiều năm qua đã đưa những chuyến xe chở niềm vui sum họp cho nhiều gia đình công nhân."
        },
        {
          "articleTitle": "Ấm áp Tết Sum vầy",
          "url": "https://laodong.vn/cong-doan/am-ap-tet-sum-vay-777371.ldo",
          "source": "Báo Lao Động",
          "time": "8 hours ago",
          "snippet": "Chiều 8.1, đoàn công tác lãnh đạo Trung ương, tỉnh Kiên Giang do đồng chí Nguyễn Hòa Bình - Bí thư T.Ư Đảng, Chánh án Tòa án Nhân dân Tối cao, đồng chí Phan Văn Anh - Phó Chủ tịch Tổng LĐLĐVN, đồng chí Nguyễn Thanh Nghị - Ủy viên BCH T.Ư&nbsp;..."
        },
        {
          "articleTitle": "Tặng quà, vé xe Tết cho công nhân lao động khu nhà ở xã hội",
          "url": "https://laodong.vn/cong-doan/tang-qua-ve-xe-tet-cho-cong-nhan-lao-dong-khu-nha-o-xa-hoi-777416.ldo",
          "source": "Báo Lao Động",
          "time": "8 hours ago",
          "snippet": "Liên đoàn Lao động thành phố Hà Nội phối hợp với Công đoàn các Khu công nghiệp và chế xuất Hà Nội đã tới thăm, tặng quà, tặng vé xe ô tô miễn phí cho đoàn viên, công nhân lao động tại khu nhà ở xã hội xã Kim Chung – Đông Anh."
        },
        {
          "articleTitle": "Tổ chức &#39;Tết sum vầy 2020&#39; cho công nhân, người lao động trên đảo Phú Quốc",
          "url": "https://baotintuc.vn/van-de-quan-tam/to-chuc-tet-sum-vay-2020-cho-cong-nhan-nguoi-lao-dong-tren-dao-phu-quoc-20200108201328267.htm",
          "source": "baotintuc.vn",
          "time": "19 hours ago",
          "snippet": "Bí thư Trung ương Đảng, Chánh án Tòa án nhân dân tối cao Nguyễn Hòa Bình và đại diện lãnh đạo Bộ Quốc phòng, Tổng Liên đoàn Lao động Việt Nam, Liên đoàn Lao động tỉnh Kiên Giang cùng các doanh nghiệp đã dự chương trình cùng hơn 280 công&nbsp;..."
        },
        {
          "articleTitle": "Hơn 1.700 tấm vé nghĩa tình trao cho công nhân nghèo về quê đón Tết",
          "url": "https://vov.vn/tin-24h/hon-1700-tam-ve-nghia-tinh-trao-cho-cong-nhan-ngheo-ve-que-don-tet-998541.vov",
          "source": "Đài Tiếng Nói Việt Nam",
          "time": "16 hours ago",
          "snippet": "Những tấm vé nghĩa tình giúp cho nhiều người công nhân nghèo tại TP HCM đỡ một phần gánh nặng về chi phí đi lại khi về quê ăn Tết."
        },
        {
          "articleTitle": "Cùng công nhân vui &quot;Tết sum vầy&quot;",
          "url": "http://nld.com.vn/cong-doan/cung-cong-nhan-vui-tet-sum-vay-20200108223141126.htm",
          "source": "Người Lao Động",
          "time": "17 hours ago",
          "snippet": "Ngày 8-1, LĐLĐ tỉnh Kiên Giang phối hợp với LĐLĐ huyện Phú Quốc tổ chức chương trình &quot;Tết sum vầy 2020&quot; cho đoàn viên và người lao động (NLĐ) có hoàn cảnh khó khăn trên địa bàn huyện Phú Quốc. Đến dự có ông Nguyễn Hòa Bình - Bí thư Trung&nbsp;..."
        }
      ],
      "idsForDedup": [
        "/m/0dq415 /m/0j0lj"
      ],
      "id": "VN_lnk_PSasQQEwAACQ1M_vi",
      "title": "Tết, Vietnam General Confederation of Labour",
      "entityNames": [
        "Tết",
        "Vietnam General Confederation of Labour"
      ]
    },
    {
      "image": {
        "newsUrl": "https://bongda365.com/u23-viet-nam-u23-chau-a-giroud",
        "source": "Bóng Đá 365",
        "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcQoSsQF9amBqrdjkPa31fLL-fYZLr_zGhatpiL46lZ4dU5BefXKj6kUpxJsGHRN9WdbK1XS0DQzlc0"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_cJfaQQEwAACrZM_vi&category=h&geo=VN#VN_lnk_cJfaQQEwAACrZM_vi",
      "articles": [
        {
          "articleTitle": "U23 Việt Nam dự U23 châu Á: Cần lắm tiền đạo mang phong cách Giroud",
          "url": "https://bongda365.com/u23-viet-nam-u23-chau-a-giroud",
          "source": "Bóng Đá 365",
          "time": "1 day ago",
          "snippet": "U23 Việt Nam đến với vòng chung kết U23 châu Á cùng tư cách là nhà đương kim á quân. Tuy nhiên, bên cạnh sự tự tin và tinh thần quyết tâm, chúng ta còn cần một tiền đạo mang phong cách kiểu Olivier Giroud."
        },
        {
          "articleTitle": "Nội soi U23 Việt Nam: Gã &quot;chân gỗ&quot; thành công nhất thế giới và &quot;chim mồi&quot; của thầy Park",
          "url": "https://soha.vn/noi-soi-u23-viet-nam-ga-chan-go-thanh-cong-nhat-the-gioi-va-chim-moi-cua-thay-park-2020010801441908.htm",
          "source": "Soha",
          "time": "1 day ago",
          "snippet": "Trong bóng đá hiện đại, đôi khi nhiệm vụ chính dành cho một tiền đạo lại không phải là ghi bàn."
        }
      ],
      "idsForDedup": [
        "/g/11f647vn3y /m/058q9lf"
      ],
      "id": "VN_lnk_cJfaQQEwAACrZM_vi",
      "title": "Vietnam national under-23 football team, 2020 AFC U-23 Championship",
      "entityNames": [
        "Vietnam national under-23 football team",
        "2020 AFC U-23 Championship"
      ]
    },
    {
      "image": {
        "newsUrl": "http://cafef.vn/chuyen-co-quan-dieu-tra-vu-mua-can-ho-khai-gia-thap-so-voi-thuc-te-20200109091303267.chn",
        "source": "Cafef.vn",
        "imgUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcRhC2TSmAvBUUwDWnA1LbgT-s1Ziwfy0JBkTs3VlgFzOpPZSuHGrElK7aGnLYDksPmX3HRjIxZ5uYI"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_Gh2eQQEwAACF7M_vi&category=h&geo=VN#VN_lnk_Gh2eQQEwAACF7M_vi",
      "articles": [
        {
          "articleTitle": "Chuyển cơ quan điều tra vụ mua căn hộ khai giá thấp so với thực tế",
          "url": "http://cafef.vn/chuyen-co-quan-dieu-tra-vu-mua-can-ho-khai-gia-thap-so-voi-thuc-te-20200109091303267.chn",
          "source": "Cafef.vn",
          "time": "6 hours ago",
          "snippet": "Ngày 7/1, Chi Cục thuế quận 10 cho biết đã chuyển hồ sơ để công an quận này điều tra về hành vi trốn thuế. Trước đó. Chi Cục thuế quận 10 tiếp nhận hồ sơ mua bán căn hộ thuộc tầng 29, toà tháp Jasmine 1, khu cao tầng thuộc dự án HaDo Centrosa&nbsp;..."
        },
        {
          "articleTitle": "Phổ biến tình trạng khai hai giá khi mua bán bất động sản để né thuế",
          "url": "http://tapchitaichinh.vn/tai-chinh-phap-luat/pho-bien-tinh-trang-khai-hai-gia-khi-mua-ban-bat-dong-san-de-ne-thue-317629.html",
          "source": "Tạp Chí Tài Chính",
          "time": "7 hours ago",
          "snippet": "Cơ quan thuế ở TP. Hồ Chí Minh đã bắt đầu “gắt” hơn khi xem xét giá kê khai tính thuế chuyển nhượng bất động sản sau khi có chỉ đạo của Tổng Cục thuế. Và mới đây, một giao dịch mua bán căn hộ ở TP. Hồ Chí Minh đã bị cơ quan thuế “sờ gáy” và yêu cầu&nbsp;..."
        },
        {
          "articleTitle": "XNK Quảng Bình bị xử phạt về thuế hơn 5,5 tỷ đồng",
          "url": "https://vietnamdaily.net.vn/tai-chinh/xnk-quang-binh-bi-xu-phat-ve-thue-hon-55-ty-dong-80688.html",
          "source": "Vietnam Daily",
          "time": "7 hours ago",
          "snippet": "Cục Thuế Hải Phòng vừa có kết luận thanh tra thuế tại CTCP Xuất nhập khẩu Quảng Bình (HoSE: QBS) với số tiền phạt và truy thu hơn 5,5 tỷ đồng."
        },
        {
          "articleTitle": "Ngành thuế Hải Phòng: Quyết tâm hoàn thành mục tiêu mới",
          "url": "https://thanhphohaiphong.gov.vn/nganh-thue-hai-phong-quyet-tam-hoan-thanh-muc-tieu-moi.html",
          "source": "Tin tức Hải Phòng (lời tuyên bố phát cho các báo) (Blog)",
          "time": "7 hours ago",
          "snippet": "Cục trưởng Cục Thuế thành phố Hà Văn Trường cho biết, năm 2019, Hải Phòng được Trung ương giao dự toán thu nội địa 23.895 tỷ đồng, HĐND thành phố giao 26.365 tỷ đồng. Đến hết tháng 9/2019, Thành ủy, HĐND và UBND thành phố đặt mục tiêu&nbsp;..."
        },
        {
          "articleTitle": "Cục Thuế Hà Nội truy thu, phạt hơn 3.700 tỷ đồng sau thanh, kiểm tra thuế",
          "url": "https://baodauthau.vn/tai-chinh/cuc-thue-ha-noi-truy-thu-phat-hon-3700-ty-dong-sau-thanh-kiem-tra-thue-119602.html",
          "source": "Báo Đấu thầu",
          "time": "7 hours ago",
          "snippet": "(BĐT) - Cục Thuế Hà Nội cho biết, trong năm 2019 đã thực hiện được 18.702 cuộc thanh tra, kiểm tra thuế. Qua đó, truy thu, truy hoàn và phạt hơn 3.700 tỷ đồng, đạt 112% kế hoạch được giao."
        },
        {
          "articleTitle": "Công ty XNK Quảng Bình bị phạt và truy thu thuế hơn 5,5 tỷ đồng",
          "url": "https://m.thuongtruong.com.vn/kinh-te/tai-chinh-ngan-hang/cong-ty-xnk-quang-binh-bi-phat-va-truy-thu-22786.html",
          "source": "Tạp chí Thương Trường (lời tuyên bố phát cho các báo)",
          "time": "5 hours ago",
          "snippet": "Theo quyết định của Cục Thuế Hải Phòng, QBS đã kê khai chưa đầy đủ căn cứ xác định nghĩa vụ thuế, hạch toán các chi phí không đúng nên phản ánh không chính xác thu nhập chịu thuế TNDN và GTGT trong năm 2017 và 2018. Cục thuế yêu cầu QBS&nbsp;..."
        },
        {
          "articleTitle": "Vi phạm về thuế, Đầu tư Nam Long bị phạt và truy thu hơn 9 tỷ đồng",
          "url": "https://www.nguoiduatin.vn/vi-pham-ve-thue-dau-tu-nam-long-bi-phat-va-truy-thu-hon-9-ty-dong-a462330.html",
          "source": "Người đưa tin (lời tuyên bố phát cho các báo)",
          "time": "21 hours ago",
          "snippet": "Công ty Cổ phần Đầu tư Nam Long vừa bị Tổng Cục Thuế phạt và truy thu do vi phạm về thuế số tiền hơn 9 tỷ đồng. Công ty Cổ phần Đầu tư Nam Long vừa công bố Quyết định số 1394/QĐ-TCT ngày 27/12/2019 của Tổng Cục thuế về việc xử lý vi phạm&nbsp;..."
        },
        {
          "articleTitle": "Chương Dương Corp bị truy thu thuế và nộp phạt 2,2 tỷ đồng",
          "url": "https://kienthuc.net.vn/kinh-doanh/chuong-duong-corp-bi-truy-thu-thue-va-nop-phat-22-ty-dong-1327674.html",
          "source": "Báo điện tử Kiến Thức",
          "time": "20 hours ago",
          "snippet": "Tổng số tiền phải nộp truy thu, tiền chậm nộp, tiền phạt mà Chương Dương Corp nộp gần 2,2 tỷ đồng. ​"
        },
        {
          "articleTitle": "Bất động sản Nam Long bị phạt và truy thu hơn 9 tỉ đồng tiền thuế",
          "url": "https://thanhnien.vn/tai-chinh-kinh-doanh/bat-dong-san-nam-long-bi-phat-va-truy-thu-hon-9-ti-dong-tien-thue-1169739.html",
          "source": "Báo Thanh Niên",
          "time": "21 hours ago",
          "snippet": "Tổng cục Thuế mới công bố xử phạt vi phạm hành chính về thuế đối với Công ty cổ phần Đầu tư Nam Long (NLG)."
        },
        {
          "articleTitle": "Hà Nội: Lần đầu tiên Chi cục Thuế Đống Đa thu ngân sách trên 11.000 tỷ đồng",
          "url": "http://thoibaotaichinhvietnam.vn/pages/thue-voi-cuoc-song/2020-01-08/ha-noi-lan-dau-tien-chi-cuc-thue-dong-da-thu-ngan-sach-tren-11000-ty-dong-81281.aspx",
          "source": "Thời báo Tài chính Việt Nam",
          "time": "22 hours ago",
          "snippet": "(TBTCO) - Ông Lê Quang Hùng - Chi cục trưởng Chi cục Thuế Đống Đa (Hà Nội) cho biết, thu ngân sách do chi cục thực hiện đạt hơn 11.070 tỷ đồng, đạt 104,5% dự toán, tăng 29,3% so với thực hiện năm 2018. Hầu hết các chỉ tiêu thu ngân sách đều tăng&nbsp;..."
        }
      ],
      "idsForDedup": [
        "/g/119x70g_7 /m/01crd5"
      ],
      "id": "VN_lnk_Gh2eQQEwAACF7M_vi",
      "title": "General Department of Taxation, Vietnam",
      "entityNames": [
        "General Department of Taxation",
        "Vietnam"
      ]
    },
    {
      "image": {
        "newsUrl": "https://plo.vn/quoc-te/muon-mat/tang-208-ti-dong-cho-fan-twitter-de-do-luong-hanh-phuc-882845.html",
        "source": "Báo Pháp Luật TP.HCM",
        "imgUrl": "//t1.gstatic.com/images?q=tbn:ANd9GcQzjD_ya1LXLdlYwYCDdJvtGW5ir9SHelYpIDvXkjJWA3FtuC7sXgY0ybVoGEnkmFp7FCa2M97A7mQ"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_atzLQQEwAACgLM_vi&category=h&geo=VN#VN_lnk_atzLQQEwAACgLM_vi",
      "articles": [
        {
          "articleTitle": "Tặng 208 tỉ đồng cho &#39;fan&#39; Twitter để &#39;đo lường&#39; hạnh phúc",
          "url": "https://plo.vn/quoc-te/muon-mat/tang-208-ti-dong-cho-fan-twitter-de-do-luong-hanh-phuc-882845.html",
          "source": "Báo Pháp Luật TP.HCM",
          "time": "33 minutes ago",
          "snippet": "(PLO)- Tỉ phú Nhật Bản Yusaku Maezawa sẽ tặng 9 triệu USD (hơn 208 tỉ đồng) cho những người theo dõi Twitter để xem liệu tiền có làm tăng hạnh phúc hay không."
        },
        {
          "articleTitle": "Tỷ phú Nhật tặng 9 triệu USD cho người theo dõi trên Twitter để &quot;đo lường&quot; hạnh phúc",
          "url": "http://cafef.vn/ty-phu-nhat-tang-9-trieu-usd-cho-nguoi-theo-doi-tren-twitter-de-do-luong-hanh-phuc-2020010909030447.chn",
          "source": "Cafef.vn",
          "time": "5 hours ago",
          "snippet": "Tỷ phú Nhật Bản Yusaku Maezawa mới đây cho biết sẽ tặng 9 triệu USD cho những người theo dõi tài khoản mạng xã hội Twitter của ông trong một cuộc thử nghiệm nhằm xem liệu việc này có thể giúp gia tăng niềm hạnh phúc cho họ hay không, theo tin từ&nbsp;..."
        },
        {
          "articleTitle": "Tỷ phú Nhật Bản tặng 9 triệu USD cho người theo dõi trên Twitter",
          "url": "https://vtv.vn/tieu-dung/ty-phu-nhat-ban-tang-9-trieu-usd-cho-nguoi-theo-doi-tren-twitter-20200109123821906.htm",
          "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
          "time": "2 hours ago",
          "snippet": "VTV.vn - Tỷ phú Nhật Bản Yusaku Maezawa quyết định tặng 9 triệu USD cho 1.000 người theo dõi mình trên Twitter."
        },
        {
          "articleTitle": "Tỉ phú Nhật tặng 212 tỉ đồng cho những người theo dõi trên Twitter",
          "url": "https://thanhnien.vn/the-gioi/ti-phu-nhat-tang-212-ti-dong-cho-nhung-nguoi-theo-doi-tren-twitter-1169947.html",
          "source": "Báo Thanh Niên",
          "time": "4 hours ago",
          "snippet": "Tỉ phú thời trang Nhật Bản muốn tiến hành “thử nghiệm xã hội” xem số tiền có thể giúp nhiều người hạnh phúc hay không."
        },
        {
          "articleTitle": "Tỷ phú Nhật hứa tặng 200 tỷ cho người theo dõi trên Twitter, dân mạng &#39;nháo nhào&#39; ấn follow ngay lập tức",
          "url": "https://saostar.vn/cong-nghe/internet/ty-phu-nhat-hua-tang-200-ty-dong-cho-nguoi-theo-doi-minh-tren-twitter-6787359.html",
          "source": "Saostar.vn",
          "time": "5 hours ago",
          "snippet": "Mới đây, tỷ phú người Nhật Yusaku Maezawa – nhà sáng lập kiêm giám đốc điều hành công ty bán lẻ thời trang trực tuyến lớn nhất Nhật Bản – Zozo, vừa cho biết sẽ tặng 9 triệu USD (khoảng hơn 200 tỷ đồng) cho những người theo dõi tài khoản Twitter của&nbsp;..."
        },
        {
          "articleTitle": "Test xem &quot;Tiền có mang lại hạnh phúc hay không&quot;, tỷ phú Nhật dùng 9 triệu đô tặng người lạ mặt để thử nghiệm",
          "url": "https://gamek.vn/test-xem-tien-co-mang-lai-hanh-phuc-hay-khong-ty-phu-nhat-dung-9-trieu-do-tang-nguoi-la-mat-de-thu-nghiem-20200109145838377.chn",
          "source": "GameK",
          "time": "31 minutes ago",
          "snippet": "Tiền có mang lại hạnh phúc hay không - đó chắc chắn vẫn là chủ đề tranh luận nóng hổi mà rất nhiều người đã đặt ra trong thời gian qua, và đương nhiên cũng để lại không ít những tranh cãi. Người thì cho rằng tiền nhiều để làm gì và dẫn chứng ra nhiều vị&nbsp;..."
        },
        {
          "articleTitle": "Chiêu trò &quot;đốt&quot; tiền gây sốc của vị tỷ phú Nhật Bản: Tặng 9 triệu USD cho cư dân mạng, việc cần làm chỉ là follow và ...",
          "url": "http://kenh14.vn/chieu-tro-dot-tien-gay-soc-cua-vi-ty-phu-nhat-ban-tang-9-trieu-usd-cho-cu-dan-mang-viec-can-lam-chi-la-follow-va-share-bai-20200109102445176.chn",
          "source": "Kênh 14",
          "time": "5 hours ago",
          "snippet": "9 triệu USD sẽ được chia đều cho 1000 người may mắn nhất, tính ra cũng sương sương hơn 200 triệu đồng/người."
        },
        {
          "articleTitle": "Tỷ phú Nhật Bản đang tặng 9 triệu USD cho mọi người trên Twitter",
          "url": "http://toquoc.vn/ty-phu-nhat-ban-dang-tang-9-trieu-usd-cho-moi-nguoi-tren-twitter-820209111237161.htm",
          "source": "Báo Tổ quốc (lời tuyên bố phát cho các báo)",
          "time": "5 hours ago",
          "snippet": "Tỷ phú Nhật Bản Yusaku Maezawa đã chi 57 triệu USD chỉ để mua một bức tranh của nghệ sĩ da màu Basquiat, cũng như mua toàn bộ vé trên chuyến bay đầu tiên của SpaceX quanh mặt trăng. Giờ đây, người đàn ông này đã tìm ra một số cách xa hoa hơn&nbsp;..."
        },
        {
          "articleTitle": "Tỷ phú Nhật tặng 9 triệu USD cho người theo dõi trên Twitter",
          "url": "https://news.zing.vn/ty-phu-nhat-tang-9-trieu-usd-cho-nguoi-theo-doi-tren-twitter-post1034148.html",
          "source": "Zing.vn",
          "time": "7 hours ago",
          "snippet": "Tỷ phú thời trang Nhật Yusaku Maezawa quyết định tặng 9 triệu USD cho 1.000 người theo dõi mình trên Twitter."
        },
        {
          "articleTitle": "Tỷ phú Nhật tặng 9 triệu USD cho người theo dõi trên Twitter để &#39;đo lường&#39; hạnh phúc",
          "url": "http://tiin.vn/chuyen-muc/song/ty-phu-nhat-tang-9-trieu-usd-cho-nguoi-theo-doi-tren-twitter-de-do-luong-hanh-phuc.html",
          "source": "Tiin",
          "time": "4 hours ago",
          "snippet": "Tỷ phú Yusaku Maezawa được biết đến với những ý tưởng khác người, ví dụ như một thế giới không có tiền bạc... - Tiin.vn."
        }
      ],
      "idsForDedup": [
        "/m/0289n8t /m/03_3d",
        "/m/0289n8t /m/0j28jlw",
        "/m/03_3d /m/0j28jlw"
      ],
      "id": "VN_lnk_atzLQQEwAACgLM_vi",
      "title": "Yusaku Maezawa, Japan, Twitter",
      "entityNames": [
        "Yusaku Maezawa",
        "Japan",
        "Twitter"
      ]
    },
    {
      "image": {
        "newsUrl": "https://news.zing.vn/samsung-sap-mat-tien-vi-huawei-duoc-trung-quoc-ho-tro-post1022233.html",
        "source": "Zing.vn",
        "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcQfqC2H7Arp-Dyo69I75uUfSI0KCji23jUGFnhzo3yHkxdIoSgQRb7a2NAsNtv6DjPNJvixeqGwo8w"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_a7nWQQEwAAC8SM_vi&category=h&geo=VN#VN_lnk_a7nWQQEwAAC8SM_vi",
      "articles": [
        {
          "articleTitle": "Samsung sắp mất tiền vì Huawei được Trung Quốc hỗ trợ",
          "url": "https://news.zing.vn/samsung-sap-mat-tien-vi-huawei-duoc-trung-quoc-ho-tro-post1022233.html",
          "source": "Zing.vn",
          "time": "57 minutes ago",
          "snippet": "Chính quyền Trung Quốc sẽ hỗ trợ cho các công ty trong nước và giảm thiểu sự phụ thuộc vào các doanh nghiệp nước ngoài trong 5 năm kế tiếp."
        },
        {
          "articleTitle": "Lợi nhuận hoạt động năm 2019 của Samsung thấp nhất trong 4 năm qua",
          "url": "https://vtv.vn/kinh-te/loi-nhuan-hoat-dong-nam-2019-cua-samsung-thap-nhat-trong-4-nam-qua-20200109090617203.htm",
          "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
          "time": "6 hours ago",
          "snippet": "VTV.vn - Số liệu sơ bộ mới đây cho thấy, lợi nhuận hoạt động năm 2019 của hãng điện tử Samsung Electronics (Hàn Quốc) đã chạm mức thấp nhất trong 4 năm..."
        },
        {
          "articleTitle": "Lợi nhuận của Samsung thấp nhất trong bốn năm",
          "url": "https://bnews.vn/loi-nhuan-cua-samsung-thap-nhat-trong-bon-nam/144615.html",
          "source": "Bnews.vn (lời tuyên bố phát cho các báo)",
          "time": "9 hours ago",
          "snippet": "Lợi nhuận hoạt động năm 2019 của hãng điện tử Samsung Electronics (Hàn Quốc) đã chạm mức thấp nhất trong bốn năm qua, do sự suy thoái của thị trường chip toàn cầu."
        },
        {
          "articleTitle": "Năm 2019 Samsung ước tính giảm mạnh 53% lợi nhuận",
          "url": "https://cungcau.vn/nam-2009-samsung-uoc-tinh-giam-manh-53-loi-nhuan-d193208.html",
          "source": "Cung Cầu",
          "time": "7 hours ago",
          "snippet": "Samsung đã thừa nhận rằng lợi nhuận lợi nhuận 53% trong năm 2019 so với năm 2018, trong đó mất 1/3 lợi nhuận từ smartphone và chip trong Q4/2019."
        },
        {
          "articleTitle": "Lợi nhuận của Samsung trong quý 4/2019 đã giảm 33%",
          "url": "https://vn.trangcongnghe.com/tin-ict/219487-samsung-mat-1-3-loi-nhuan-tu-smartphone-v224-chip-trong-q4-2019.html",
          "source": "VnExpress.net",
          "time": "7 hours ago",
          "snippet": "Theo báo cáo tài chính mới, lợi nhuận của Samsung Electronics trong quý 4/2019 đã giảm 33%. Gã khổng lồ công nghệ Hàn Quốc là nhà sản xuất chip cũng như điện thoại thông minh lớn nhất thế giới và phải đối mặt với sự suy giảm lợi nhuận ở cả hai loại."
        },
        {
          "articleTitle": "Lợi nhuận quý IV/2019 của LG Electronics đạt thấp hơn dự kiến",
          "url": "https://bnews.vn/loi-nhuan-quy-iv-2019-cua-lg-electronics-dat-thap-hon-du-kien/144616.html",
          "source": "Bnews.vn (lời tuyên bố phát cho các báo)",
          "time": "18 hours ago",
          "snippet": "LG Electronics Inc. ước đạt lợi nhuận thấp hơn dự báo trong quý IV/2019, do mảng kinh doanh điện thoại thông minh suy yếu, nhưng doanh số bán đạt mức cao kỷ lục trong năm ngoái."
        },
        {
          "articleTitle": "Samsung Q4/2019: Lợi nhuận giảm 34% nhưng vẫn cao hơn dự báo, triển vọng tích cực hơn trong năm 2020",
          "url": "https://genk.vn/samsung-q4-2019-loi-nhuan-giam-34-nhung-van-cao-hon-du-bao-trien-vong-tich-cuc-hon-trong-nam-2020-20200108155848019.chn",
          "source": "GenK",
          "time": "1 day ago",
          "snippet": "Dù kết quả kinh doanh sụt giảm, nhưng các nhà đầu tư vẫn lạc quan vào tương lai của Samsung khi dự báo nhu cầu chip toàn cầu sẽ phục hồi và tăng trưởng trong năm 2020."
        },
        {
          "articleTitle": "Lợi nhuận hoạt động của Samsung chạm đáy trong năm 2019",
          "url": "https://vtimes.com.au/loi-nhuan-hoat-dong-cua-samsung-cham-day-trong-nam-2019-3390658.html",
          "source": "Viet Times Australia",
          "time": "6 hours ago",
          "snippet": "Cụ thể, lợi nhuận hoạt động của Samsung Electronics trong năm 2019 chỉ đạt 27.000 tỷ won (23,7 tỷ USD), giảm 52,9% so với năm trước đó và là mức thấp nhất kể từ năm 2015. Doanh thu của doanh nghiệp này năm 2019 đạt 229.500 tỷ won (196 tỷ USD),&nbsp;..."
        },
        {
          "articleTitle": "Lợi nhuận giảm mạnh nhưng giá cổ phiếu tăng vọt: Hiện tượng lạ của Samsung trong năm 2019",
          "url": "https://vietnambiz.vn/loi-nhuan-giam-manh-nhung-gia-co-phieu-tang-vot-hien-tuong-la-cua-samsung-trong-nam-2019-20200108110432009.htm",
          "source": "VietNamBiz",
          "time": "1 day ago",
          "snippet": "Thị trường chip và bộ nhớ đi xuống kể từ cuối năm 2018 là nguyên nhân dẫn đến việc Samsung không có được những thông số tài chính ấn tượng trong năm 2019."
        }
      ],
      "idsForDedup": [
        "/g/121jnq1m /m/07gv72"
      ],
      "id": "VN_lnk_a7nWQQEwAAC8SM_vi",
      "title": "Samsung Group, Business",
      "entityNames": [
        "Samsung Group",
        "Business"
      ]
    },
    {
      "image": {
        "newsUrl": "https://thanhnien.vn/thoi-su/mttq-vn-tphcm-phan-bien-ve-cong-tac-quy-hoach-1169388.html",
        "source": "Báo Thanh Niên",
        "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcTTeJRO8UD6ssPvlP8pnrg8d99fSQWFM_YfaGksMY-z4l3kzOm_61r_g_ppPq2zTkNrLhQnWhDwX-0"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_s9KXQQEwAAAlIM_vi&category=h&geo=VN#VN_lnk_s9KXQQEwAAAlIM_vi",
      "articles": [
        {
          "articleTitle": "MTTQ VN TP.HCM phản biện về công tác quy hoạch",
          "url": "https://thanhnien.vn/thoi-su/mttq-vn-tphcm-phan-bien-ve-cong-tac-quy-hoach-1169388.html",
          "source": "Báo Thanh Niên",
          "time": "1 day ago",
          "snippet": "Ngày 7.1, Ủy ban MTTQ VN TP.HCM tổ chức hội nghị lần thứ 3 với sự tham dự của Ủy viên Bộ Chính trị, Bí thư Thành ủy TP Nguyễn Thiện Nhân."
        },
        {
          "articleTitle": "Bí thư Nguyễn Thiện Nhân: &quot;Nguyện vọng của dân phải được lắng nghe, xử lý&quot;",
          "url": "http://nld.com.vn/chinh-tri/bi-thu-nguyen-thien-nhan-nguyen-vong-cua-dan-phai-duoc-lang-nghe-xu-ly-20200107144611972.htm",
          "source": "Người Lao Động",
          "time": "2 days ago",
          "snippet": "(NLĐO) - Ngày 7-1, Ủy ban MTTQ TP HCM đã tổ chức hội nghị lần thứ 3, khóa XI, nhiệm kỳ 2019-2024. Đến dự có Ủy viên Bộ Chính trị, Bí thư Thành ủy TP HCM Nguyễn Thiện Nhân."
        },
        {
          "articleTitle": "Phụ nữ TP HCM sinh ít vì làm việc nhiều",
          "url": "https://vnexpress.net/thoi-su/phu-nu-tp-hcm-sinh-it-vi-lam-viec-nhieu-4038014.html",
          "source": "VnExpress",
          "time": "2 days ago",
          "snippet": "Bí thư Thành ủy Nguyễn Thiện Nhân nói, tỷ lệ sinh ở TP HCM thấp là do phụ nữ làm việc nhiều hơn bình quân cả nước, không có thời gian cho gia đình. - VnExpress."
        },
        {
          "articleTitle": "Ông Nguyễn Thiện Nhân: Khiếu kiện đông người tại TP.HCM đã giảm",
          "url": "https://m.vov.vn/chinh-tri/ong-nguyen-thien-nhan-khieu-kien-dong-nguoi-tai-tphcm-da-giam-997534.vov",
          "source": "Đài Tiếng Nói Việt Nam",
          "time": "3 days ago",
          "snippet": "Ông Nguyễn Thiện Nhân đánh giá, các vấn đề nóng như Thủ Thiêm, Khu công nghệ cao, chợ An Đông… đã được giải quyết, mang lại niềm vui cho nhiều người."
        },
        {
          "articleTitle": "TP HCM xác định rõ những việc phải làm ngay",
          "url": "https://nld.com.vn/thoi-su/tp-hcm-xac-dinh-ro-nhung-viec-phai-lam-ngay-20200106220501165.htm",
          "source": "Người Lao Động",
          "time": "2 days ago",
          "snippet": "Ủy viên Bộ Chính trị, Bí thư Thành ủy TP HCM Nguyễn Thiện Nhân khẳng định phát triển văn hóa, con người là tiền đề trực tiếp để phát triển kinh tế."
        },
        {
          "articleTitle": "Bí thư Nhân: Không được nói phụ nữ TP.HCM lười đẻ",
          "url": "https://news.zing.vn/video-bi-thu-nhan-khong-duoc-noi-phu-nu-tphcm-luoi-de-post1033162.html",
          "source": "Zing.vn",
          "time": "3 days ago",
          "snippet": "Bí thư Thành ủy TP.HCM cho rằng việc một số báo nói phụ nữ TP.HCM lười đẻ khiến tỷ suất sinh thấp là không chính xác. Ông nhận định nguyên nhân là phụ nữ TP.HCM không có thời giờ."
        },
        {
          "articleTitle": "&#39;Người lao động tại TP.HCM dành quá nhiều thời gian cho công việc&#39;",
          "url": "https://news.zing.vn/nguoi-lao-dong-tai-tphcm-danh-qua-nhieu-thoi-gian-cho-cong-viec-post1033160.html",
          "source": "Zing.vn",
          "time": "3 days ago",
          "snippet": "Đó là đánh giá của Bí thư Thành ủy Nguyễn Thiện Nhân về thời gian làm việc của người lao động ở TP.HCM tại hội nghị triển khai nhiệm vụ phát triển kinh tế - xã hội sáng 6/1."
        },
        {
          "articleTitle": "Bí thư Nguyễn Thiện Nhân: TP HCM phát huy văn hóa để làm kinh tế tốt hơn",
          "url": "http://toquoc.vn/bi-thu-nguyen-thien-nhan-tp-hcm-phat-huy-van-hoa-de-lam-kinh-te-tot-hon-20200106155904171.htm",
          "source": "Báo Tổ quốc (lời tuyên bố phát cho các báo)",
          "time": "2 days ago",
          "snippet": "Bí thư Thành ủy Nguyễn Thiện Nhân cho biết, năm 2020, TP cần phải trình Bộ Chính trị đề án quan trọng là tỷ lệ phân chia ngân sách, tiếp tục thực hiện Nghị quyết 54, cải cách hành chính…TP cùng các quận huyện thực hiện quyết liệt Chỉ thị 23 về trật tự xây&nbsp;..."
        },
        {
          "articleTitle": "2020: TP.HCM cải thiện mạnh mẽ môi trường đầu tư",
          "url": "https://plo.vn/thoi-su/2020-tphcm-cai-thien-manh-me-moi-truong-dau-tu-882269.html",
          "source": "Báo Pháp Luật TP.HCM",
          "time": "2 days ago",
          "snippet": "(PL)- TP.HCM sẽ phấn đấu hoàn thành và hoàn thành vượt mức các chỉ tiêu phát triển kinh tế - xã hội năm 2020 và cả nhiệm kỳ."
        },
        {
          "articleTitle": "&#39;Nguyện vọng của dân phải được lắng nghe, xử lý&#39;",
          "url": "https://tuoitre.vn/nguyen-vong-cua-dan-phai-duoc-lang-nghe-xu-ly-2020010713053479.htm",
          "source": "Tuổi Trẻ Online",
          "time": "2 days ago",
          "snippet": "TTO - Đó là ý kiến chỉ đạo của Bí thư Thành ủy TP.HCM Nguyễn Thiện Nhân tại hội nghị Ủy ban MTTQ Việt Nam TP.HCM lần thứ 3, khóa XI (2019-2014) diễn ra sáng 7-1."
        }
      ],
      "idsForDedup": [
        "/g/1q66__7tl /m/03cvspd",
        "/g/1q66__7tl /m/0hn4h",
        "/m/03cvspd /m/0hn4h"
      ],
      "id": "VN_lnk_s9KXQQEwAAAlIM_vi",
      "title": "Ho Chi Minh City, Nguyen Thien Nhan, Vietnam Fatherland Front Central Committee",
      "entityNames": [
        "Ho Chi Minh City",
        "Nguyen Thien Nhan",
        "Vietnam Fatherland Front Central Committee"
      ]
    },
    {
      "image": {
        "newsUrl": "https://thanhnien.vn/tai-chinh-kinh-doanh/viet-nam-thiet-hai-hon-20000-ti-dong-do-virus-may-tinh-1170005.html",
        "source": "Báo Thanh Niên",
        "imgUrl": "//t1.gstatic.com/images?q=tbn:ANd9GcS7Cu5xgLeQhiqYSwstqNtyTisx1QOoEufiMkCB0RHCfO2ynrBoBMkvOP6WWVdeqZgs088eKp6uNHA"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_OwLdQQEwAADn8M_vi&category=h&geo=VN#VN_lnk_OwLdQQEwAADn8M_vi",
      "articles": [
        {
          "articleTitle": "Việt Nam thiệt hại hơn 20.000 tỉ đồng do virus máy tính",
          "url": "https://thanhnien.vn/tai-chinh-kinh-doanh/viet-nam-thiet-hai-hon-20000-ti-dong-do-virus-may-tinh-1170005.html",
          "source": "Báo Thanh Niên",
          "time": "2 hours ago",
          "snippet": "Hôm nay 9.1, Tập đoàn Bkav công bố tình hình an ninh mạng năm 2019 với thiệt hại gia tăng mạnh so với năm 2018."
        },
        {
          "articleTitle": "Virus máy tính gây thiệt hại 20.892 tỷ đồng",
          "url": "http://hanoimoi.com.vn/tin-tuc/Oto-xemay/955129/virus-may-tinh-gay-thiet-hai-20892-ty-dong",
          "source": "Hà Nội Mới",
          "time": "2 hours ago",
          "snippet": "(HNMO) - Năm 2019, thiệt hại do virus máy tính gây ra đối với người dùng Việt Nam lên tới 20.892 tỷ đồng (tương đương 902 triệu USD), vượt xa con số 14.900 tỷ đồng của năm 2018. Thông tin trên được Tập đoàn Công nghệ BKAV công bố tại báo cáo tổng&nbsp;..."
        },
        {
          "articleTitle": "Việt Nam thiệt hại 902 triệu USD vì virus máy tính trong năm 2019",
          "url": "https://www.vietnamplus.vn/viet-nam-thiet-hai-902-trieu-usd-vi-virus-may-tinh-trong-nam-2019/617582.vnp",
          "source": "Vietnam Plus (lời tuyên bố phát cho các báo)",
          "time": "2 hours ago",
          "snippet": "Theo báo cáo từ Công ty An ninh mạng BKAV, thiệt hại do virus máy tính gây ra đối với người dùng Việt Nam trong năm 2019 đã lên tới 20.892 tỷ đồng (902 triệu USD), vượt xa con số 14.900 tỷ đồng của năm 2018. Tuy không có sự cố nào đặc biệt nghiêm&nbsp;..."
        },
        {
          "articleTitle": "Thiệt hại do virus máy tính gây ra cho người dùng Việt Nam đã vượt ngưỡng 20.000 tỷ đồng",
          "url": "https://cafebiz.vn/thiet-hai-do-virus-may-tinh-gay-ra-cho-nguoi-dung-viet-nam-da-vuot-nguong-20000-ty-dong-20200109140326877.chn",
          "source": "CafeBiz.vn",
          "time": "2 hours ago",
          "snippet": "Thông tin nêu trên vừa được tập đoàn công nghệ Bkav cho biết trong báo cáo tổng kết tình hình an ninh mạng năm 2019. Khối cơ quan nhà nước chuyển biến tích cực. Cũng trong báo cáo tổng kết an ninh mạng 2019 mới phát ra trưa nay, ngày 9/1/2020,&nbsp;..."
        },
        {
          "articleTitle": "Năm 2020, an ninh trên các thiết bị IoT sẽ là “điểm nóng”",
          "url": "https://enternews.vn/nam-2020-an-ninh-tren-cac-thiet-bi-iot-se-la-diem-nong-164847.html",
          "source": "enternews.vn (lời tuyên bố phát cho các báo) (Blog)",
          "time": "1 hour ago",
          "snippet": "Các thiết bị IoT như: Router, Wi-Fi, Camera giám sát, thiết bị đầu cuối… sẽ là điểm nóng về an ninh mạng khi các thiết bị này ngày càng trở nên phổ biến và kết nối rộng."
        },
        {
          "articleTitle": "Việt Nam thiệt hại hơn 20 nghìn tỷ đồng do virus máy tính trong năm 2019",
          "url": "https://vnreview.vn/tin-tuc-an-ninh-mang/-/view_content/content/3030639/viet-nam-thiet-hai-hon-20-nghin-ty-dong-do-virus-may-tinh-trong-nam-2019",
          "source": "VNReview (lời tuyên bố phát cho các báo)",
          "time": "1 hour ago",
          "snippet": "Tập đoàn Công nghệ Bkav vừa phát hành báo cáo Tổng kết an ninh mạng năm 2019 và dự báo 2020, trong đó tính toán thiệt hại do virus máy tính gây ra ở Việt Nam đến 20,89 nghìn tỷ đồng, tăng hơn 6 nghìn tỷ đồng so với năm 2018. Theo đánh giá của&nbsp;..."
        },
        {
          "articleTitle": "Thiệt hại do virus máy tính vượt ngưỡng 20.000 tỷ đồng",
          "url": "https://baotintuc.vn/khoa-hoc-cong-nghe/thiet-hai-do-virus-may-tinh-vuot-nguong-20000-ty-dong-20200109134633400.htm",
          "source": "baotintuc.vn",
          "time": "11 minutes ago",
          "snippet": "Bkav vừa công bố báo cáo về tình hình an ninh mạng năm 2019 và dự báo cho năm 2010. Theo ông Ngô Tuấn Anh, Phó Tổng Giám đốc Bkav, tuy không có sự cố nào đặc biệt nghiêm trọng xảy ra, nhưng sự gia tăng các máy tính bị nhiễm mã độc mã hóa dữ&nbsp;..."
        },
        {
          "articleTitle": "Năm 2019, thiệt hại do virus máy tính vượt ngưỡng 20.000 tỷ đồng",
          "url": "https://vtv.vn/cong-nghe/nam-2019-thiet-hai-do-virus-may-tinh-vuot-nguong-20000-ty-dong-20200109153620343.htm",
          "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
          "time": "19 minutes ago",
          "snippet": "VTV.vn - Sự gia tăng các máy tính bị nhiễm mã độc mã hóa dữ liệu và mã độc tấn công có chủ đích APT là nguyên nhân chính gây ra những thiệt hại khổng lồ..."
        },
        {
          "articleTitle": "Thiệt hại do virus máy tính tại Việt Nam vượt ngưỡng 20.000 tỷ đồng",
          "url": "https://vov.vn/cong-nghe/thiet-hai-do-virus-may-tinh-tai-viet-nam-vuot-nguong-20000-ty-dong-998733.vov",
          "source": "Đài Tiếng Nói Việt Nam",
          "time": "30 minutes ago",
          "snippet": "Năm 2019, thiệt hại do virus máy tính gây ra đối với người dùng Việt Nam đã lên tới 20.892 tỷ đồng (902 triệu USD)."
        },
        {
          "articleTitle": "Những con số nổi bật an ninh mạng năm 2019 và dự báo 2020",
          "url": "https://congthuong.vn/nhung-con-so-noi-bat-an-ninh-mang-nam-2019-va-du-bao-2020-131220.html",
          "source": "Báo điện tử Công Thương",
          "time": "1 hour ago",
          "snippet": "Các chuyên gia Bkav dự báo, năm 2020 mã độc tấn công APT sẽ tinh vi hơn, Fileless sẽ là xu hướng chính, cùng với đó là các mã độc giả mạo các phần mềm, chương trình chuẩn thông qua kỹ thuật DLL Side-Loading để qua mặt phần mềm diệt virus."
        }
      ],
      "idsForDedup": [
        "/g/120y3d4z /m/01crd5"
      ],
      "id": "VN_lnk_OwLdQQEwAADn8M_vi",
      "title": "Vietnam, Bkav",
      "entityNames": [
        "Vietnam",
        "Bkav"
      ]
    },
    {
      "image": {
        "newsUrl": "http://giadinh.net.vn/bon-phuong/cap-doi-nga-bi-bat-gap-an-ai-tren-bai-bien-thai-20200108160118449.htm",
        "source": "Báo Gia đình & Xã hội",
        "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcSkd48sMz_8oelSbjEkqeZvtHcCDezqCRKBgxv7337B9Bi44sRQqhLOkrCYQqpq0DH6VPQ6Fu-sWII"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_wEbZQQEwAAAYtM_vi&category=h&geo=VN#VN_lnk_wEbZQQEwAAAYtM_vi",
      "articles": [
        {
          "articleTitle": "Cặp đôi Nga bị bắt gặp &#39;ân ái&#39; trên bãi biển Thái",
          "url": "http://giadinh.net.vn/bon-phuong/cap-doi-nga-bi-bat-gap-an-ai-tren-bai-bien-thai-20200108160118449.htm",
          "source": "Báo Gia đình & Xã hội",
          "time": "7 hours ago",
          "snippet": "Cặp đôi người Nga đã bị quay phim khi đang làm tình ở Pattaya, Thái Lan trong đêm giao thừa. Người dân địa phương đã quay được cảnh tượng này. Trung tá cảnh sát Piyapong Ensarn cho biết, hành vi của cặp đôi này có thể làm ảnh hưởng đến danh&nbsp;..."
        },
        {
          "articleTitle": "Sốc với cặp đôi thản nhiên quan hệ trên bãi biển công cộng",
          "url": "https://eva.vn/di-dau-xem-gi/soc-voi-cap-doi-than-nhien-quan-he-tren-bai-bien-cong-cong-c40a418559.html",
          "source": "Eva.vn",
          "time": "6 hours ago",
          "snippet": "Một cặp đôi người nước ngoài đã thản nhiên quan hệ trên bãi biển ở Thái Lan lúc 1h sáng. Cặp đôi này đã bị cảnh sát tạm giữ.-Xem ăn chơi."
        }
      ],
      "idsForDedup": [
        "/m/034_qm /m/07f1x"
      ],
      "id": "VN_lnk_wEbZQQEwAAAYtM_vi",
      "title": "Thailand, Pattaya City",
      "entityNames": [
        "Thailand",
        "Pattaya City"
      ]
    },
    {
      "image": {
        "newsUrl": "https://thanhnien.vn/doi-song/ram-thang-chap-cuoi-cung-trong-nam-hop-tuoi-nao-vi-sao-cac-gia-dinh-deu-cung-bai-1169778.html",
        "source": "Báo Thanh Niên",
        "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcSBUbq1CtjCFiaZ0BSzVINWvnT9MAGTdhY0Tzsi502sxRYtrpNUOHBZjEB1Rdo4HiZZ48XV0M-_AZo"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_x0mWQQEwAABQuM_vi&category=h&geo=VN#VN_lnk_x0mWQQEwAABQuM_vi",
      "articles": [
        {
          "articleTitle": "Rằm tháng Chạp cuối cùng trong năm: Hợp tuổi nào, vì sao các gia đình đều cúng bái?",
          "url": "https://thanhnien.vn/doi-song/ram-thang-chap-cuoi-cung-trong-nam-hop-tuoi-nao-vi-sao-cac-gia-dinh-deu-cung-bai-1169778.html",
          "source": "Báo Thanh Niên",
          "time": "5 hours ago",
          "snippet": "Ngày Rằm tháng Chạp (15.12 Âm lịch) được xem là ngày rất tốt cho các tuổi Bính Dần, Giáp Tý và Giáp Dần. Xuất hành về hướng Tây Nam sẽ được cả tài lộc lẫn vui vẻ, may mắn."
        },
        {
          "articleTitle": "Nhiều món đồ cúng &quot;độc - lạ&quot; được ưa chuộng ngày cận Tết",
          "url": "https://vtv.vn/doi-song/nhieu-mon-do-cung-doc-la-duoc-ua-chuong-ngay-can-tet-20200108215617593.htm",
          "source": "Báo điện tử VTV News - Đài Truyền Hình Việt Nam",
          "time": "9 hours ago",
          "snippet": "VTV.vn -Những món như cá chép rau câu, thỏi vàng làm từ đậu xanh, hoa quả khắc chữ hay bánh bao dát vàng là những món đồ cúng được &quot;săn đón&quot; dịp cận Tết."
        },
        {
          "articleTitle": "Những lưu ý khi chuẩn bị mâm cơm cúng Rằm tháng Chạp để được bình an",
          "url": "https://laodong.vn/chuyen-nha-minh/nhung-luu-y-khi-chuan-bi-mam-com-cung-ram-thang-chap-de-duoc-binh-an-777352.ldo",
          "source": "Báo Lao Động",
          "time": "5 hours ago",
          "snippet": "Bên cạnh hương hoa, trà, quả, nhiều nhà còn chuẩn bị mâm cỗ mặn cúng Rằm tháng Chạp ."
        },
        {
          "articleTitle": "3 lưu ý cúng rằm tháng Chạp gia chủ phải biết để tránh xui rủi",
          "url": "https://kienthuc.net.vn/kho-tri-thuc/3-luu-y-cung-ram-thang-chap-gia-chu-phai-biet-de-tranh-xui-rui-1327835.html",
          "source": "Báo điện tử Kiến Thức",
          "time": "8 hours ago",
          "snippet": "Rằm tháng Chạp là ngày rằm cuối cùng trong năm nên rất được coi trọng và chuẩn bị kỹ lưỡng. Trong dịp này, gia chủ cần chú ý những điều dưới đây."
        },
        {
          "articleTitle": "Cúng ông Công ông Táo vào lúc nào, cúng buổi tối được không?",
          "url": "https://www.giadinhmoi.vn/cung-ong-cong-ong-tao-vao-luc-nao-cung-buoi-toi-duoc-khong-d32976.html",
          "source": "Tạp Chí Gia Đình Mới (lời tuyên bố phát cho các báo)",
          "time": "59 minutes ago",
          "snippet": "Cúng ông Công ông Táo vào lúc nào là đúng? Tết ông Công ông Táo là một trong những ngày lễ quan trọng nhất trong năm. Vào ngày này, các gia đình thường sắm chút lễ mọn cùng tấm lòng thành kính dâng lên Thần linh, gia tiên. Theo truyền thống của&nbsp;..."
        },
        {
          "articleTitle": "Lộc lá vô biên nếu mâm cúng mặn rằm Tháng Chạp có món này",
          "url": "https://kienthuc.net.vn/kho-tri-thuc/loc-la-vo-bien-neu-mam-cung-man-ram-thang-chap-co-mon-nay-1327609.html",
          "source": "Báo điện tử Kiến Thức",
          "time": "14 hours ago",
          "snippet": "Mâm cúng rằm tháng Chạp, bên cạnh hoa quả, gia chủ cần chuẩn bị trêm mâm cỗ món ăn đỏ như son này. Chắc chắn sẽ khiến Thần Tài ưng bụng, năm mới lộc lá vô biên."
        },
        {
          "articleTitle": "Cúng Rằm tháng Chạp nhớ lưu ý những điều này kẻo Thần tài trách phạt, tự tay quét sạch tài lộc",
          "url": "https://phunutoday.vn/cung-ram-thang-chap-nho-luu-y-nhung-dieu-nay-keo-than-tai-trach-phat-tu-tay-quet-sach-tai-loc-d239687.html",
          "source": "Phụ Nữ Today (lời tuyên bố phát cho các báo)",
          "time": "6 hours ago",
          "snippet": "Rằm tháng Chạp là 1 trong 3 ngày lễ quan trọng dịp cuối năm của người Việt. Dưới đây là những lưu ý khi cúng Rằm tháng Chạp các gia đình phải nắm."
        },
        {
          "articleTitle": "Cách làm mâm cỗ cúng Rằm tháng Chạp nhanh gọn, đơn giản và đẹp mắt nhất",
          "url": "http://danviet.vn/song-tre/cach-lam-mam-co-cung-ram-thang-chap-nhanh-gon-don-gian-va-dep-mat-nhat-1048443.html",
          "source": "Báo Dân Việt",
          "time": "10 hours ago",
          "snippet": "Rằm tháng Chạp là ngày lễ quan trọng của tháng cuối cùng trong năm, trước lễ cúng Ông Táo và giao thừa."
        },
        {
          "articleTitle": "Giao thừa 2020 nên cúng ở ngoài sân hay trong nhà trước?",
          "url": "https://cungcau.vn/giao-thua-2020-nen-cung-o-ngoai-san-hay-trong-nha-truoc-d193165.html",
          "source": "Cung Cầu",
          "time": "7 hours ago",
          "snippet": "Theo phong tục đón giao thừa ở Việt Nam, thời khắc giao thừa là giây phút vô cùng thiêng liêng mà người người đón chờ."
        },
        {
          "articleTitle": "Văn khấn, văn cúng rằm tháng Chạp chuẩn nhất",
          "url": "https://giaoducthoidai.vn/van-hoa/van-khan-van-cung-ram-thang-chap-chuan-nhat-4057533-l.html",
          "source": "GD&TĐ",
          "time": "1 day ago",
          "snippet": "Trong lễ cúng Rằm tháng Chạp, ngoài việc chỉn chu trong mâm lễ cúng, chỉn chu về tác phong của người cúng, cái tâm của người cúng thì một điều vô cùng quan trọng đó chính là bài khấn Rằm tháng Chạp."
        }
      ],
      "idsForDedup": [
        "/g/11bc5g18_5 /g/1s04bfz0y",
        "/g/11bc5g18_5 /m/01crd5",
        "/g/1s04bfz0y /m/01crd5"
      ],
      "id": "VN_lnk_x0mWQQEwAABQuM_vi",
      "title": "Kitchen God, Kitchen God Festival, Vietnam",
      "entityNames": [
        "Kitchen God",
        "Kitchen God Festival",
        "Vietnam"
      ]
    },
    {
      "image": {
        "newsUrl": "http://www.vnmedia.vn/du-lich/202001/mu-cang-chai-diem-den-tuyet-voi-tuyet-voi-cho-du-khach-quoc-te-nam-2020-5bc28a3/",
        "source": "VNMedia",
        "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcQtewzWTXN6Ht0paWpKNFcnyl-sWV2UhGHuDf4h7D4NwhQAjeG8j7bgr1swaLthQD2Rkt2_Y0py4No"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_u1LOQQEwAAB0oM_vi&category=h&geo=VN#VN_lnk_u1LOQQEwAAB0oM_vi",
      "articles": [
        {
          "articleTitle": "Mù Cang Chải - điểm đến tuyệt vời cho du khách quốc tế năm 2020",
          "url": "http://www.vnmedia.vn/du-lich/202001/mu-cang-chai-diem-den-tuyet-voi-tuyet-voi-cho-du-khach-quoc-te-nam-2020-5bc28a3/",
          "source": "VNMedia",
          "time": "6 hours ago",
          "snippet": "(VnMedia)- Mù Cang Chải vừa được bình chọn là một điểm đến du lịch tuyệt vời cho các du khách quốc tế tới Việt Nam trong năm 2020 này. Đây là bình chọn từ hãng tin CNBC, Mỹ."
        },
        {
          "articleTitle": "Mù Cang Chải - Điểm du lịch hàng đầu thế giới trong năm 2020",
          "url": "https://www.vietnamplus.vn/mu-cang-chai-diem-du-lich-hang-dau-the-gioi-trong-nam-2020/617214.vnp",
          "source": "Vietnam Plus (lời tuyên bố phát cho các báo)",
          "time": "7 hours ago",
          "snippet": "Hãng tin CNBC vừa có bài viết đánh giá Mù Cang Chải (Yên Bái) là một điểm đến du lịch tuyệt vời cho các du khách quốc tế tới Việt Nam trong năm 2020 này. CNBC đã miêu tả Mù Cang Chải như một viên ngọc nằm sâu trong các thung lũng được bồi đắp&nbsp;..."
        },
        {
          "articleTitle": "Tại sao &#39;viên ngọc&#39; ẩn sâu trong núi này nên đứng đầu danh sách du lịch năm 2020 của bạn",
          "url": "https://thuonggiathitruong.vn/tai-sao-vien-ngoc-an-sau-trong-nui-nay-nen-dung-dau-danh-sach-du-lich-nam-2020-cua-ban/",
          "source": "Báo thương gia và thị trường (lời tuyên bố phát cho các báo) (Blog)",
          "time": "6 hours ago",
          "snippet": "Nguyên Hoàng biên dịch. Mù Cang Chải, Yên Bái, Việt Nam. Nằm sâu trong các thung lũng được tạo nên từ các vùng nước của Sông Hồng, là những ngôi làng trên núi đầy màu sắc, bao quanh bởi những cánh đồng ruộng bậc thang cao chót vót. Các cánh&nbsp;..."
        },
        {
          "articleTitle": "Mù Cang Chải xứng đáng vào top những điểm đến hàng đầu năm 2020",
          "url": "https://vtimes.com.au/mu-cang-chai-xung-dang-vao-top-nhung-diem-den-hang-dau-nam-2020-3390220.html",
          "source": "Viet Times Australia",
          "time": "8 hours ago",
          "snippet": "Hòn ngọc ẩn của Việt Nam. Trong những ngày đầu năm mới, kênh truyền hình Mỹ CNBC đã dành một bài viết riêng để nói về vẻ đẹp của Mù Cang Chải. Theo đó, Mù Cang Chải xứng đáng vào top những điểm đến hàng đầu năm 2020. Qua con mắt của&nbsp;..."
        },
        {
          "articleTitle": "Bắt đối tượng phụ nữ người Mông mua bán, vận chuyển 2,5 bánh heroin",
          "url": "https://soha.vn/bat-doi-tuong-phu-nu-nguoi-mong-mua-ban-van-chuyen-25-banh-heroin-20200108190410877.htm",
          "source": "Soha",
          "time": "18 hours ago",
          "snippet": "Lực lượng Công an đã thu giữ tại chỗ 2,5 bánh heroin, với trọng lượng 865,7 gam; 1 xe máy và một số tang vật liên quan."
        },
        {
          "articleTitle": "Hội nghị kiểm điểm tập thể và cá nhân Ban Thường vụ Huyện ủy Mù Cang Chải năm 2019",
          "url": "http://yenbai.gov.vn/noidung/tintuc/Pages/chi-tiet-tin-tuc.aspx?ItemID=3013&l=TinSoNganhDiaphuong",
          "source": "Cổng Thông tin điện tử Tỉnh Yên Bái (lời tuyên bố phát cho các báo)",
          "time": "12 minutes ago",
          "snippet": "CTTĐT - Ngày 9/1/2020, Huyện ủy Mù Cang Chải đã tổ chức hội nghị kiểm điểm tập thể và cá nhân Ban Thường vụ Huyện ủy năm 2019. Dự chỉ đạo, theo dõi việc kiểm điểm có đồng chí Nguyễn Văn Lịch, Ủy viên BTV Tỉnh ủy, Trưởng Ban Nội chính Tỉnh ủy."
        },
        {
          "articleTitle": "Mù Căng Chải được báo nước ngoài khen ngợi là điểm đến hàng đầu năm 2020",
          "url": "https://vietnammoi.vn/mu-cang-chai-duoc-bao-nuoc-ngoai-khen-ngoi-la-diem-den-hang-dau-nam-2020-20200109112920646.htm",
          "source": "Việt Nam Mới",
          "time": "30 minutes ago",
          "snippet": "Mới đây, hãng tin CNBC của Mỹ vừa có bài viết đánh giá Mù Cang Chải, tỉnh Yên Bái là điểm đến du lịch hàng đầu dành cho các du khách quốc tế tới Việt Nam trong năm 2020."
        }
      ],
      "idsForDedup": [
        "/m/024mv2 /m/03md87d",
        "/m/024mv2 /m/07m1kr",
        "/m/03md87d /m/07m1kr"
      ],
      "id": "VN_lnk_u1LOQQEwAAB0oM_vi",
      "title": "Mù Cang Chải District, Yên Bái, Provinces of Vietnam",
      "entityNames": [
        "Mù Cang Chải District",
        "Yên Bái",
        "Provinces of Vietnam"
      ]
    },
    {
      "image": {
        "newsUrl": "https://thanhnien.vn/van-hoa/dam-vinh-hung-gap-tai-nan-do-mau-khi-dang-hat-tren-san-khau-1169941.html",
        "source": "Báo Thanh Niên",
        "imgUrl": "//t0.gstatic.com/images?q=tbn:ANd9GcSGqDfnwE02xX-FOPgE9T2EQgcrbCkfrHfip62tY5bedEEyRLg4TuHhgR8sHiDRRJGtlIZiTxITEbM"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_20_YQQEwAAACvM_vi&category=h&geo=VN#VN_lnk_20_YQQEwAAACvM_vi",
      "articles": [
        {
          "articleTitle": "Đàm Vĩnh Hưng gặp tai nạn đổ máu khi đang hát trên sân khấu",
          "url": "https://thanhnien.vn/van-hoa/dam-vinh-hung-gap-tai-nan-do-mau-khi-dang-hat-tren-san-khau-1169941.html",
          "source": "Báo Thanh Niên",
          "time": "4 hours ago",
          "snippet": "Mới đây, người hâm mộ vô cùng lo lắng khi nam ca sĩ Đàm Vĩnh Hưng chia sẻ câu chuyện anh bị tai nạn đến đổ máu khi đang biểu diễn ở một quán bar tại Hải Phòng."
        },
        {
          "articleTitle": "Đàm Vĩnh Hưng bị chảy máu đầu, than thở vì năm tuổi liên tục gặp xui",
          "url": "https://vtc.vn/sao-viet/dam-vinh-hung-bi-chay-mau-dau-than-tho-vi-nam-tuoi-lien-tuc-gap-xui-ar521139.html",
          "source": "VTC News",
          "time": "3 hours ago",
          "snippet": "Tối 8/1, Đàm Vĩnh Hưng tham gia biểu diễn tại một sân khấu khá nhỏ nhưng lại bất ngờ gặp tai nạn. Nam ca sĩ chia sẻ, anh định giấu nhưng do buổi diễn có livestream nên fan và người thân đều thấy đầu anh chảy máu. Sau khi gặp tai nạn, nam ca sĩ quyết&nbsp;..."
        },
        {
          "articleTitle": "Dương Triệu Vũ: Tôi không sống nhờ vào Đàm Vĩnh Hưng và Hoài Linh",
          "url": "https://www.tienphong.vn/van-hoa/duong-trieu-vu-toi-khong-song-nho-vao-dam-vinh-hung-va-hoai-linh-1507601.tpo",
          "source": "Tiền Phong",
          "time": "5 hours ago",
          "snippet": "15 năm theo đuổi ca hát, Dương Triệu Vũ khẳng định anh có cho mình một vị trí riêng trong làng nhạc và hoàn toàn không cần phải “dựa” vào 2 tên tuổi Hoài Linh và Đàm Vĩnh Hưng để hoạt động."
        },
        {
          "articleTitle": "Đàm Vĩnh Hưng bị thương ở đầu",
          "url": "https://vnexpress.net/giai-tri/dam-vinh-hung-bi-thuong-o-dau-4039489.html",
          "source": "VnExpress Giải trí",
          "time": "5 hours ago",
          "snippet": "Ca sĩ Đàm Vĩnh Hưng bị bánh răng cưa sắt của mô hình trang trí sân khấu cắt trúng đầu khi diễn tại Hải Phòng, tối 8/1. - VnExpress Giải Trí."
        },
        {
          "articleTitle": "Đàm Vĩnh Hưng gặp tai nạn chảy máu đầu trên sân khấu",
          "url": "https://vietnamnet.vn/vn/giai-tri/the-gioi-sao/dam-vinh-hung-gap-tai-nan-chay-mau-dau-tren-san-khau-607709.html",
          "source": "Vietnamnet.vn",
          "time": "5 hours ago",
          "snippet": "Đàm Vĩnh Hưng dù bị chảy máu đầu ngay trên sân khấu nhưng phải nén đau để tiếp tục diễn."
        },
        {
          "articleTitle": "Đàm Vĩnh Hưng rơi vào tình huống nguy hiểm, bị thương phần đầu",
          "url": "https://www.tinmoi.vn/dam-vinh-hung-roi-vao-tinh-huong-nguy-hiem-bi-thuong-phan-dau-011537802.html",
          "source": "Tinmoi.vn",
          "time": "4 hours ago",
          "snippet": "Đàm Vĩnh Hưng khiến fan không khỏi lo lắng khi gặp tình huống nguy hiểm tính mạng bị thương ở phần đầu."
        },
        {
          "articleTitle": "Mr Đàm bị thương ở đầu",
          "url": "https://ngoisao.net/hau-truong/mr-dam-bi-thuong-o-dau-4039465.html",
          "source": "Ngôi Sao",
          "time": "7 hours ago",
          "snippet": "Gặp tai nạn trên sân khấu ở một quán bar Hải Phòng khuya 8/1, ca sĩ Đàm Vĩnh Hưng bị rách hai vết trên đầu phải nhập viện băng bó. - Ngôi sao."
        },
        {
          "articleTitle": "Đàm Vĩnh Hưng chảy máu đầu vì tai nạn sân khấu",
          "url": "https://news.zing.vn/dam-vinh-hung-chay-mau-dau-vi-tai-nan-san-khau-post1034198.html",
          "source": "Zing.vn",
          "time": "5 hours ago",
          "snippet": "Trong buổi diễn tối 8/1, Đàm Vĩnh Hưng đã bị phần đạo cụ trang trí sân khấu làm chảy máu đầu. Nam ca sĩ tới bệnh viện băng bó sau khi hoàn thành buổi biểu diễn."
        },
        {
          "articleTitle": "Vào viện băng bó vì tai nạn sân khấu, Đàm Vĩnh Hưng buồn bã: &#39;Sinh nghề tử nghiệp là có thật&#39;",
          "url": "https://saostar.vn/doi-song/dam-vinh-hung-phai-vao-vien-bang-bo-vi-tai-nan-san-khau-6788875.html",
          "source": "Saostar.vn",
          "time": "3 hours ago",
          "snippet": "Tối 8/1, fanpage Đàm Vĩnh Hưng đăng tải những hình ảnh anh đang băng bó vết thương ở đầu cùng dòng chia sẻ “Sinh nghề tử nghiệp là có thật” khiến nhiều người hâm mộ lo lắng. Theo đó, nam ca sĩ không may va vào đạo cụ trên sân khấu khiến đầu bị&nbsp;..."
        },
        {
          "articleTitle": "Đàm Vĩnh Hưng bị tai nạn chảy máu đầu, phải nhập viện băng bó",
          "url": "https://www.nguoiduatin.vn/dam-vinh-hung-bi-tai-nan-chay-mau-dau-phai-nhap-vien-bang-bo-a462399.html",
          "source": "Người đưa tin (lời tuyên bố phát cho các báo)",
          "time": "3 hours ago",
          "snippet": "Thông tin ca sĩ Đàm Vĩnh Hưng bị tai nạn lúc đang hát trên sân khấu, phải nhập viện băng bó khiến người hâm mộ vô cùng lo lắng. Cụ thể, tối 8/1 “ông hoàng nhạc Việt” được mời hát tại một quán bar ở Hải Phòng, trong lúc biểu diễn, anh không may gặp&nbsp;..."
        }
      ],
      "idsForDedup": [
        "/g/11c5b647t9 /m/01crd5",
        "/g/11c5b647t9 /m/01v704p",
        "/m/01crd5 /m/01v704p"
      ],
      "id": "VN_lnk_20_YQQEwAAACvM_vi",
      "title": "Dam Vinh Hung, Vietnam, HTV Award for the Most Favourite Male Singer",
      "entityNames": [
        "Dam Vinh Hung",
        "Vietnam",
        "HTV Award for the Most Favourite Male Singer"
      ]
    },
    {
      "image": {
        "newsUrl": "https://www.doisongphapluat.com/giai-tri/tin-tuc-giai-tri/lo-anh-hiem-cua-thanh-hang-anh-thu-tu-16-nam-truoc-a307620.html",
        "source": "Đời Sống & Pháp Luật (lời tuyên bố phát cho các báo)",
        "imgUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcS7bpLw4GFfznDXDxfClkhunc6CdpBbNUpLI8VIMXIA0G5dLdFvI7uftQC8O0MMVzTwkZcuf4DvbBE"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_C_zCQQEwAADIDM_vi&category=h&geo=VN#VN_lnk_C_zCQQEwAADIDM_vi",
      "articles": [
        {
          "articleTitle": "Lộ ảnh hiếm của Thanh Hằng, Anh Thư từ 16 năm trước",
          "url": "https://www.doisongphapluat.com/giai-tri/tin-tuc-giai-tri/lo-anh-hiem-cua-thanh-hang-anh-thu-tu-16-nam-truoc-a307620.html",
          "source": "Đời Sống & Pháp Luật (lời tuyên bố phát cho các báo)",
          "time": "6 hours ago",
          "snippet": "Loạt ảnh hậu trường &quot;Những cô gái chân dài&quot; (2004) hé lộ nhiều sắc thái hiếm có của Thanh Hằng, Anh Thư từ 16 năm về trước."
        },
        {
          "articleTitle": "Dương Yến Ngọc lộ ảnh quá khứ nóng bỏng hậu phản pháo vợ chồng Đặng Lê Nguyên Vũ",
          "url": "https://www.tinmoi.vn/duong-yen-ngoc-lo-anh-qua-khu-nong-bong-hau-phan-phao-vo-chong-dang-le-nguyen-vu-011537669.html",
          "source": "Tinmoi.vn",
          "time": "1 day ago",
          "snippet": "Cựu người mẫu Dương Yến Ngọc bất ngờ tung loạt ảnh nóng bỏng quá khứ, khoe đôi chân dài miên nam sau lời gửi gắm chân tình đến ông Đặng Lê Nguyên Vũ."
        },
        {
          "articleTitle": "Anh Thư, Thanh Hằng trong &#39;Những cô gái chân dài&#39; 16 năm trước",
          "url": "https://2sao.vn/anh-thu-thanh-hang-trong-nhung-co-gai-chan-dai-16-nam-truoc-n-207929.html",
          "source": "2Sao",
          "time": "18 hours ago",
          "snippet": "Trên trang cá nhân, đạo diễn Vũ Ngọc Đãng đã chia sẻ loạt ảnh hậu trường của bộ phim nổi tiếng 16 năm trước. Các diễn viên Anh Thư, Thanh Hằng, Minh Anh... đều ở độ tuổi đôi mươi."
        },
        {
          "articleTitle": "Anh Thư tung ảnh hiếm của &#39;Những cô gái chân dài&#39;: Toàn trai xinh gái đẹp một thời làm đảo điên khán giả",
          "url": "https://ngoisao.vn/dien-anh/toan-canh/anh-thu-tung-anh-hiem-cua-nhung-co-gai-chan-dai-toan-trai-xinh-gai-dep-mot-thoi-lam-dao-dien-khan-gia-283852.htm",
          "source": "Ngôi Sao VN (lời tuyên bố phát cho các báo)",
          "time": "19 hours ago",
          "snippet": "Những hình ảnh của Thanh Hằng, Dương Yến Ngọc, Anh Thư, Minh Anh.... khiến khán giả không khỏi bùi ngùi vì."
        },
        {
          "articleTitle": "Dàn sao “Nụ Hôn Thần Chết” sau 12 năm: Người thành nữ hoàng cảnh nóng, kẻ nhan sắc khác biệt ngỡ ngàng",
          "url": "http://kenh14.vn/dan-sao-nu-hon-than-chet-sau-12-nam-nguoi-thanh-nu-hoang-canh-nong-ke-nhan-sac-khac-biet-ngo-ngang-20200102083958535.chn",
          "source": "Kênh 14",
          "time": "1 day ago",
          "snippet": "Sau thành công của “Nụ Hôn Thần Chết”, dàn sao ngày đó mỗi người đều đã có một lối đi cho riêng mình."
        },
        {
          "articleTitle": "Thanh Hằng, Anh Thư 16 năm trước",
          "url": "https://ngoisao.net/hau-truong/thanh-hang-anh-thu-16-nam-truoc-4038891.html",
          "source": "Ngôi Sao",
          "time": "1 day ago",
          "snippet": "Đây là phim đầu tiên của Việt Nam khai thác câu chuyện hậu trường ngành thời trang với nhiều góc khuất, cám dỗ của nghề người mẫu, được thực hiện và chiếu rạp năm 2004. Trong phim, Anh Thư (giữa) đóng vai chính Thủy - một cô gái rời bỏ nông thôn&nbsp;..."
        }
      ],
      "idsForDedup": [
        "/g/11df0wk31j /g/122fvjn7",
        "/g/11df0wk31j /m/0105c1tg",
        "/g/11df0wk31j /m/01crd5",
        "/g/11df0wk31j /m/0hlrf07",
        "/g/122fvjn7 /m/0105c1tg",
        "/g/122fvjn7 /m/01crd5",
        "/g/122fvjn7 /m/0hlrf07",
        "/m/0105c1tg /m/01crd5",
        "/m/0105c1tg /m/0hlrf07",
        "/m/01crd5 /m/0hlrf07"
      ],
      "id": "VN_lnk_C_zCQQEwAADIDM_vi",
      "title": "Vietnam, Thanh Hang, Long Legged Girls, Duong Yen Ngoc, Vu Ngoc Dang",
      "entityNames": [
        "Vietnam",
        "Thanh Hang",
        "Long Legged Girls",
        "Duong Yen Ngoc",
        "Vu Ngoc Dang"
      ]
    },
    {
      "image": {
        "newsUrl": "https://www.24h.com.vn/thoi-trang-hi-tech/trinh-lang-realme-x50-5g-voi-man-hinh-120hz-cho-game-thu-c407a1115115.html",
        "source": "Tin tức 24h",
        "imgUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcQ-99vnwKOVQRkEect31YvHJMuqZ7d6YMolF6Zy0hpYWfPWw-MS2wz0nZsppVVNAHKXKkcc2r2hsdo"
      },
      "shareUrl": "https://trends.google.com.vn/trends/trendingsearches/realtime?id=VN_lnk_efSwQQEwAADIBM_vi&category=h&geo=VN#VN_lnk_efSwQQEwAADIBM_vi",
      "articles": [
        {
          "articleTitle": "Trình làng Realme X50 5G với màn hình 120Hz cho game thủ",
          "url": "https://www.24h.com.vn/thoi-trang-hi-tech/trinh-lang-realme-x50-5g-voi-man-hinh-120hz-cho-game-thu-c407a1115115.html",
          "source": "Tin tức 24h",
          "time": "8 hours ago",
          "snippet": "Mới đây, Realme X50 5G đã được ra mắt với màn hình có tốc độ làm mới 120Hz, giá cực hợp lý.-Thời trang Hi-tech."
        },
        {
          "articleTitle": "Realme X50 5G với màn hình 120Hz, chip Snapdragon 765G, 4 camera sau 64MP ra mắt, giá chỉ từ 8.3 triệu đồng",
          "url": "https://cellphones.com.vn/sforum/realme-x50-5g-voi-man-hinh-120hz-chip-snapdragon-765g-4-camera-sau-64mp-ra-mat-gia-chi-tu-8-3-trieu-dong",
          "source": "CellphoneS",
          "time": "1 day ago",
          "snippet": "Sau một thời gian dài xuất hiện dưới dạng tin đồn thì mới đây, Realme đã chính thức trình smartphone Realme X50 5G tại một sự kiện vừa diễn ra tại Trung Quốc. Đúng như các rò rỉ trước đó, điện thoại này gây ấn tượng với thiết kế “đục lỗ” bắt mắt, có cấu&nbsp;..."
        },
        {
          "articleTitle": "Realme đặt mục tiêu xuất xưởng 50 triệu chiếc smartphone vào 2020",
          "url": "https://vn.trangcongnghe.com/tin-tuc-cong-nghe/dien-thoai/219451-realme-du-dinh-xuat-xuong-50-trieu-chiec-smartphone-v224o-2020.html",
          "source": "VnExpress.net",
          "time": "21 hours ago",
          "snippet": "Năm ngoái, Realme đã xuất xưởng 25 triệu điện thoại thông minh trên toàn thế giới. Và mục tiêu năm nay hãng đã có mục tiêu gấp đôi. Gần đây, Realme đã tiết lộ kế hoạch cho năm 2020. Năm ngoái, hãng đã xuất xưởng 25 triệu chiếc smartphone, và năm&nbsp;..."
        },
        {
          "articleTitle": "Realme X50 5G chính thức ra mắt: màn hình 120Hz, Snapdragon 765G, hỗ trợ 5G",
          "url": "https://www.techz.vn/177-120-1-realme-x50-5g-chinh-thuc-ra-mat-man-hinh-120hz-snapdragon-765g-ho-tro-5g-ylt503652.html",
          "source": "Techz.vn (lời tuyên bố phát cho các báo)",
          "time": "1 day ago",
          "snippet": "(Techz.vn) Không chỉ gây chú ý với loạt thông số khủng, Realme X50 5G còn hấp dẫn hơn nhờ mức giá bán chưa tới 10 triệu đồng."
        },
        {
          "articleTitle": "Cận cảnh Realme X50: Smartphone 5G đầu tiên của Realme được trang bị Snapdragon 765G",
          "url": "https://cellphones.com.vn/sforum/can-canh-realme-x50-smartphone-5g-dau-tien-cua-realme-duoc-trang-bi-snapdragon-765g",
          "source": "CellphoneS",
          "time": "1 day ago",
          "snippet": "Sở hữu thiết kế đẹp cùng cấu hình phần cứng mạnh mẽ, Realme X50 5G sẽ là đối thủ trực tiếp của Redmi K30 5G trong phân khúc tầm trung. Ngày hôm nay, trong khi mọi người đều đang hướng về sự kiện CES 2020 với hàng loạt các sản phẩm công nghệ&nbsp;..."
        },
        {
          "articleTitle": "Realme X50 5G ra mắt: Màn hình 6,57 inch 120Hz, chip Snapdragon 765G, tản nhiệt 5 lớp, pin 4.200mAh, giá bán từ ...",
          "url": "https://genk.vn/realme-x50-5g-ra-mat-man-hinh-657-inch-120hz-chip-snapdragon-765g-tan-nhiet-5-lop-pin-4200mah-gia-ban-tu-360-usd-20200107161512191.chn",
          "source": "GenK",
          "time": "1 day ago",
          "snippet": "Realme X50 5G là một chiếc smartphone sinh ra để chơi game."
        },
        {
          "articleTitle": "Samsung và Apple như hụt hơi khi bị điện thoại 5G Trung Quốc cạnh tranh quá mạnh",
          "url": "https://vietnammoi.vn/dien-thoai-5g-gia-re-tu-thuong-hieu-trung-quoc-canh-tranh-manh-dau-nam-2020-20200106014340687.htm",
          "source": "Việt Nam Mới",
          "time": "2 days ago",
          "snippet": "Realme, Xiaomi, Huawei được cho là đã sẵn sàng cho năm 2020 hàng loạt điện thoại 5G được ra mắt. Trong khi đó, Samsung lẫn Apple vẫn được cho là bình yên trong sóng gió khi có vẻ hụt hơi."
        }
      ],
      "idsForDedup": [
        "/m/04csgml /m/07gv72",
        "/m/04csgml /m/0c41j8y",
        "/m/07gv72 /m/0c41j8y"
      ],
      "id": "VN_lnk_efSwQQEwAADIBM_vi",
      "title": "5G, Qualcomm Snapdragon, Samsung Group",
      "entityNames": [
        "5G",
        "Qualcomm Snapdragon",
        "Samsung Group"
      ]
    }
  ]
}
*/
const stories_summary = (opts, callback) => {
	request({
		url: `https://trends.google.com.vn/trends/api/stories/summary?hl=vi-VN&tz=-420&cat=h&id=VN_lnk_DSaRQQEwAACd1M_vi&id=VN_lnk_PSasQQEwAACQ1M_vi&id=VN_lnk_cJfaQQEwAACrZM_vi&id=VN_lnk_rfzDQQEwAABvDM_vi&id=VN_lnk_a-DWQQEwAAC8EM_vi&id=VN_lnk_YWXKQQEwAACqlM_vi&id=VN_lnk_Gh2eQQEwAACF7M_vi&id=VN_lnk_atzLQQEwAACgLM_vi&id=VN_lnk_a7nWQQEwAAC8SM_vi&id=VN_lnk_Dy3bQQEwAADV3M_vi&id=VN_lnk_s9KXQQEwAAAlIM_vi&id=VN_lnk_OwLdQQEwAADn8M_vi&id=VN_lnk_wEbZQQEwAAAYtM_vi&id=VN_lnk_VDXbQQEwAACOxM_vi&id=VN_lnk_x0mWQQEwAABQuM_vi&id=VN_lnk_u1LOQQEwAAB0oM_vi&id=VN_lnk_xFnJQQEwAAAMqM_vi&id=VN_lnk_20_YQQEwAAACvM_vi&id=VN_lnk_C_zCQQEwAADIDM_vi&id=VN_lnk_efSwQQEwAADIBM_vi`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(4);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "title": "Real Madrid C.F., Valencia CF, La Liga, FC Barcelona, Toni Kroos, Zinedine Zidane",
  "description": "",
  "entityNames": [
    "Real Madrid C.F.",
    "Valencia CF",
    "La Liga",
    "FC Barcelona",
    "Toni Kroos",
    "Zinedine Zidane"
  ],
  "entityExploreLinks": [
    "/trends/explore?q=/m/06l22&date=now+7-d&geo=VN",
    "/trends/explore?q=/m/080_y&date=now+7-d&geo=VN",
    "/trends/explore?q=/m/09gqx&date=now+7-d&geo=VN",
    "/trends/explore?q=/m/0hvgt&date=now+7-d&geo=VN",
    "/trends/explore?q=/m/02rf301&date=now+7-d&geo=VN",
    "/trends/explore?q=/m/0kcv4&date=now+7-d&geo=VN"
  ],
  "timeRange": "Jan 5, 2020 - Now",
  "timestamp": 1578561870,
  "bannerImgUrl": "",
  "bannerVideoUrl": "",
  "pageLayout": "REGULAR_STORY",
  "translate": false,
  "parentStoryId": "",
  "subTitle": "",
  "eventName": "",
  "colorTheme": "",
  "widgets": [
    {
      "newsClusterLinkUrl": "http://news.google.com/news/story?ncl=dHXOPkhlG--FwRM&hl=vi",
      "articles": [
        {
          "imageUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcSUooy6QbdDVZb3HEV9C3F-fglC6YuYT5Or2ygGCNvQykZOJC6deuVpPtUpRzxQyHxibNuFlC9cnE0",
          "title": "Nhận định bóng đá Barcelona - Atletico Madrid: Chờ Messi &quot;thức giấc&quot;, đáp lời Ronaldo",
          "url": "https://www.24h.com.vn/bong-da/nhan-dinh-bong-da-barcelona-atletico-madrid-cho-messi-thuc-giac-dap-loi-ronaldo-c48a1115252.html",
          "source": "Tin tức 24h",
          "time": "6 hours ago"
        },
        {
          "imageUrl": "//t1.gstatic.com/images?q=tbn:ANd9GcQwpnH9D1Y3yWdVbpqocPoTXwfOo2rzqfeE3a_9A109xT3XnVpBjIpdvv76SMGS7YaM1ju3cpzzt4Y",
          "title": "Real Madrid chờ tái đấu “Siêu kinh điển” với Barcelona ở Ả Rập Saudi",
          "url": "https://thanhnien.vn/the-thao/bong-da-quoc-te/real-madrid-cho-tai-dau-sieu-kinh-dien-voi-barcelona-o-a-rap-saudi-109920.html",
          "source": "Báo Thanh Niên",
          "time": "7 hours ago"
        },
        {
          "imageUrl": "//t3.gstatic.com/images?q=tbn:ANd9GcSJs0ZRC_kHl_9FVsrEWoVLkbZSnj2Br7wGmoNxPFKUjyPQfR42DheoT925Buhj_Zjzrw6_QMu4a5M",
          "title": "Kroos lập siêu phẩm đưa Real tới Chung kết Siêu cúp Tây Ban Nha",
          "url": "https://www.goal.com/vn/tintuc/kroos-lap-sieu-pham-dua-real-toi-chung-ket-sieu-cup-tay-ban/1j0m1x45senk81bbkzom00qbex",
          "source": "Goal.com",
          "time": "7 hours ago"
        },
        {
          "imageUrl": "//t1.gstatic.com/images?q=tbn:ANd9GcRrKTloD-jzlpu_GTaQQUgLqgGtb-eAwqt34eysehg9oXH-lLErLa-2ab1oOE6Yz60tNjzj6nmTbWg",
          "title": "Kroos ghi siêu phẩm phạt góc cho Real",
          "url": "https://vnexpress.net/bong-da/kroos-ghi-sieu-pham-phat-goc-cho-real-4039421.html",
          "source": "VnExpress Thể thao",
          "time": "10 hours ago"
        },
        {
          "imageUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcTBWnX2Yovc8ctHalZQjBrnGGqO7qlmDS_epIIIwYR-RBI9MZ5D-YBULRnFSnN0E6wW4HU2cEZ75hA",
          "title": "Đánh bại Valencia, Real Madrid tiến vào chung kết Siêu Cup Tây Ban Nha",
          "url": "https://m.dantri.com.vn/the-thao/danh-bai-valencia-real-madrid-tien-vao-chung-ket-sieu-cup-tay-ban-nha-20200109065944458.htm",
          "source": "Dân Trí",
          "time": "9 hours ago"
        },
        {
          "imageUrl": "//t2.gstatic.com/images?q=tbn:ANd9GcSOKz6raJcyvV7pCCCvoXCBS1iPD33LNZxSWkrgmoZMnSW4efglQ9ZondjRCnLo9bnmoGtGf6PquS8",
          "title": "Siêu tiền vệ từng vô địch World Cup khiến cả thế giới trầm trồ bằng siêu phẩm khó tin từ... chấm phạt góc",
          "url": "http://kenh14.vn/sieu-tien-ve-tung-vo-dich-world-cup-khien-ca-the-gioi-tram-tro-bang-sieu-pham-kho-tin-tu-cham-phat-goc-20200109084133035.chn",
          "source": "Kênh 14",
          "time": "4 hours ago"
        }
      ],
      "id": "NEWS_ARTICLE",
      "type": "fe_top_news",
      "title": "Most relevant articles",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": true,
      "isCurated": false
    },
    {
      "request": {
        "geo": {
          "country": "VN"
        },
        "time": "2020-01-04T20\\:00\\:00 2020-01-09T09\\:20\\:00",
        "resolution": "FOUR_HOUR",
        "mid": [
          "/m/06l22",
          "/m/080_y",
          "/m/09gqx",
          "/m/0hvgt",
          "/m/02rf301",
          "/m/0kcv4"
        ],
        "locale": "en-US"
      },
      "barData": [
        {
          "startTime": 1578168000,
          "articles": 0,
          "accumulative": 0,
          "formattedArticles": "0",
          "formattedAccumulative": "0"
        },
        {
          "startTime": 1578182400,
          "articles": 0,
          "accumulative": 0,
          "formattedArticles": "0",
          "formattedAccumulative": "0"
        },
        {
          "startTime": 1578196800,
          "articles": 0,
          "accumulative": 0,
          "formattedArticles": "0",
          "formattedAccumulative": "0"
        },
        {
          "startTime": 1578211200,
          "articles": 0,
          "accumulative": 0,
          "formattedArticles": "0",
          "formattedAccumulative": "0"
        },
        {
          "startTime": 1578225600,
          "articles": 0,
          "accumulative": 0,
          "formattedArticles": "0",
          "formattedAccumulative": "0"
        },
        {
          "startTime": 1578240000,
          "articles": 0,
          "accumulative": 0,
          "formattedArticles": "0",
          "formattedAccumulative": "0"
        },
        {
          "startTime": 1578254400,
          "articles": 1,
          "accumulative": 1,
          "formattedArticles": "1",
          "formattedAccumulative": "1"
        },
        {
          "startTime": 1578268800,
          "articles": 0,
          "accumulative": 1,
          "formattedArticles": "0",
          "formattedAccumulative": "1"
        },
        {
          "startTime": 1578283200,
          "articles": 2,
          "accumulative": 3,
          "formattedArticles": "2",
          "formattedAccumulative": "3"
        },
        {
          "startTime": 1578297600,
          "articles": 2,
          "accumulative": 5,
          "formattedArticles": "2",
          "formattedAccumulative": "5"
        },
        {
          "startTime": 1578312000,
          "articles": 4,
          "accumulative": 9,
          "formattedArticles": "4",
          "formattedAccumulative": "9"
        },
        {
          "startTime": 1578326400,
          "articles": 3,
          "accumulative": 12,
          "formattedArticles": "3",
          "formattedAccumulative": "12"
        },
        {
          "startTime": 1578340800,
          "articles": 0,
          "accumulative": 12,
          "formattedArticles": "0",
          "formattedAccumulative": "12"
        },
        {
          "startTime": 1578355200,
          "articles": 5,
          "accumulative": 17,
          "formattedArticles": "5",
          "formattedAccumulative": "17"
        },
        {
          "startTime": 1578369600,
          "articles": 4,
          "accumulative": 21,
          "formattedArticles": "4",
          "formattedAccumulative": "21"
        },
        {
          "startTime": 1578384000,
          "articles": 5,
          "accumulative": 26,
          "formattedArticles": "5",
          "formattedAccumulative": "26"
        },
        {
          "startTime": 1578398400,
          "articles": 2,
          "accumulative": 28,
          "formattedArticles": "2",
          "formattedAccumulative": "28"
        },
        {
          "startTime": 1578412800,
          "articles": 1,
          "accumulative": 29,
          "formattedArticles": "1",
          "formattedAccumulative": "29"
        },
        {
          "startTime": 1578427200,
          "articles": 1,
          "accumulative": 30,
          "formattedArticles": "1",
          "formattedAccumulative": "30"
        },
        {
          "startTime": 1578441600,
          "articles": 13,
          "accumulative": 43,
          "formattedArticles": "13",
          "formattedAccumulative": "43"
        },
        {
          "startTime": 1578456000,
          "articles": 6,
          "accumulative": 49,
          "formattedArticles": "6",
          "formattedAccumulative": "49"
        },
        {
          "startTime": 1578470400,
          "articles": 0,
          "accumulative": 49,
          "formattedArticles": "0",
          "formattedAccumulative": "49"
        },
        {
          "startTime": 1578484800,
          "articles": 5,
          "accumulative": 54,
          "formattedArticles": "5",
          "formattedAccumulative": "54"
        },
        {
          "startTime": 1578499200,
          "articles": 2,
          "accumulative": 56,
          "formattedArticles": "2",
          "formattedAccumulative": "56"
        },
        {
          "startTime": 1578513600,
          "articles": 26,
          "accumulative": 82,
          "formattedArticles": "26",
          "formattedAccumulative": "82"
        },
        {
          "startTime": 1578528000,
          "articles": 47,
          "accumulative": 129,
          "formattedArticles": "47",
          "formattedAccumulative": "129"
        },
        {
          "startTime": 1578542400,
          "articles": 4,
          "accumulative": 133,
          "formattedArticles": "4",
          "formattedAccumulative": "133"
        },
        {
          "startTime": 1578556800,
          "articles": 0,
          "accumulative": 133,
          "formattedArticles": "0",
          "formattedAccumulative": "133"
        }
      ],
      "barAnnotationText": "News articles",
      "lineAnnotationText": "Search interest",
      "sumAnnotationText": "Cumulative",
      "token": "APP6_UEAAAAAXhhCziEmkA_UPCS76474L-E4yfe-YOiB",
      "id": "TIMESERIES",
      "type": "fe_int_over_time",
      "title": "Interest over time",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": true,
      "isCurated": false
    },
    {
      "request": {
        "geo": {
          "country": "VN"
        },
        "time": "2020-01-04T20\\:00\\:00 2020-01-09T09\\:20\\:00",
        "resolution": "REGION",
        "mid": [
          "/m/06l22",
          "/m/080_y",
          "/m/09gqx",
          "/m/0hvgt",
          "/m/02rf301",
          "/m/0kcv4"
        ],
        "locale": "en-US",
        "skipPrivacyChecksForGeos": true
      },
      "geo": "VN",
      "resolution": "provinces",
      "searchInterestLabel": "Search interest",
      "displayMode": "regions",
      "token": "APP6_UEAAAAAXhhCztCuc669Lp0t5MkPbtuCd1zqrbqe",
      "id": "GEO_MAP",
      "type": "fe_geo_chart",
      "title": "Interest by subregion",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "request": {
        "geo": {
          "country": "VN"
        },
        "time": "2020-01-04T20\\:00\\:00 2020-01-09T09\\:20\\:00",
        "term": [
          "kết quả real madrid",
          "sieu cup tay ban nha",
          "bong đá",
          "truc",
          "trực tiếp real valencia",
          "kết quả siêu cúp tây ban nha",
          "bongdaplus",
          "thể thao",
          "man utd đấu với man city",
          "nhận định real madrid",
          "vn express",
          "real madrid vs valencia truc tiep",
          "real vs valencia",
          "nhan dinh tran real",
          "truc tiep real madrid",
          "kết quả bóng đá u23",
          "lịch thi đấu bóng đá tây ban nha",
          "kèo nhà cái",
          "cristiano ronaldo",
          "nhận định real madrid hôm nay",
          "eden hazard",
          "ket qua bong da hom nay",
          "24h bóng đa",
          "real vs",
          "trực tiếp real madrid vs valencia",
          "soi keo",
          "tin tuc bong da",
          "24h com vn bong da",
          "ket qua real",
          "24h bong da",
          "nhan dinh barca",
          "truc tiep sieu cup tay ban nha",
          "lịch thi đấu siêu cup tây ban nha",
          "siêu cúp tây ban nha là gì",
          "nhan dinh real",
          "trực tiếp bóng đá",
          "bong da 24",
          "tin nhanh the thao",
          "lịch thi đấu cúp tây ban nha",
          "ket quả bóng đá",
          "barca vs atletico madrid",
          "nhận định bóng đá plus",
          "trực tiếp bóng đá siêu cúp tây ban nha",
          "toni kroos",
          "24h bóng da",
          "24h com vn",
          "trực tiếp",
          "keo real madrid",
          "tin the thao",
          "siêu cup tây ban nha",
          "kết quả bóng đá châu á",
          "valencia",
          "lich thi dau la liga 2019",
          "zidane",
          "real madrid valencia",
          "nhận định trận real madrid",
          "kết quả bóng đá",
          "bóng đá trực tiếp",
          "lịch thi đấu siêu cúp tây ban nha 2019",
          "nhận định bong da",
          "valencia đấu với real madrid",
          "keo nha cai",
          "soi keo barca vs atletico madrid",
          "siêu cup tbn",
          "kenh14",
          "tin chuyen nhuong chelsea",
          "barcelona đấu với atlético madrid",
          "kết quả bóng đá u23 châu á",
          "vi deo bong da",
          "soi kèo barca",
          "nhận định",
          "xem truc tiep real vs valencia",
          "isco",
          "atletico madrid",
          "nhan dinh bong",
          "nhan dinh bong da plus hom nay",
          "bóng đá",
          "nhận định trận real",
          "truc tiep bong da",
          "tin tức 24 giờ",
          "bong da tay ban nha",
          "nhan dinh bong đa",
          "nhan dinh bong da plus",
          "nhận định valencia",
          "bong đa",
          "vnexpress net",
          "real valencia",
          "chuyen nhuong",
          "nhan dinh",
          "link trực tiếp real vs valencia",
          "cúp tây ban nha",
          "kết quả bóng đá tây ban nha",
          "nhan dinh bóng đá",
          "kết qua bong da hom nay",
          "tin bong da 24h",
          "nhận định barca vs atletico",
          "trực tiếp real vs valencia",
          "nhận định bóng đá",
          "tin 24h",
          "truc tiep real",
          "tin nhanh bong da",
          "lich bong da sieu cup tay ban nha",
          "tin thể thao",
          "kết quả bóng đá tây ban nha hôm nay",
          "nhận định barca vs",
          "kèo real madrid",
          "24h com",
          "soi kèo real",
          "ket qua tay ban nha",
          "nhan dinh bong da",
          "24h the thao",
          "bong da",
          "trực tiếp bóng đá real madrid",
          "barca vs",
          "bao 24h",
          "bóng đá real madrid",
          "nhan dinh bongdaplus",
          "bong đá 24h",
          "xem trực tiếp siêu cúp tây ban nha",
          "soi keo bong da",
          "trực tiếp real madrid",
          "barca vs atletico",
          "real madrid vs",
          "real",
          "video bong da",
          "truc tiep valencia vs real madrid",
          "truc tiep valencia",
          "link real vs valencia",
          "trực tiếp siêu cúp tây ban nha",
          "nhận định bóng đá hôm nay",
          "kenh 14",
          "nhận định real",
          "ket qua bong da 24h",
          "bóng đá tây ban nha",
          "keo real",
          "lịch thi đấu siêu cúp tây ban nha",
          "truc tiep tran real madrid",
          "real madrid vs valencia",
          "24h bong đá",
          "valencia real madrid",
          "nhan dinh real madrid",
          "ket quả bóng da",
          "nhan dinh valencia",
          "soi keo real madrid",
          "nhan dinh barca vs atletico",
          "kroos",
          "trực tiếp real",
          "ket qua bóng đá",
          "báo 24h",
          "barca",
          "bong da anh",
          "tin bóng đá",
          "nhận định bóng đá tây ban nha",
          "trực tiếp bóng đá real",
          "nhan dinh real vs valencia",
          "tin nhanh vnexpress",
          "xem trực tiếp trận real madrid",
          "soi kèo valencia",
          "lịch thi đấu siêu cúp",
          "soi keo valencia",
          "ket qua bong da",
          "24h bóng đá",
          "kết quả cúp tây ban nha",
          "tin tức 24h",
          "chelsea",
          "24h bong đa",
          "bong da 24h",
          "vnexpress",
          "truc tiep real vs valencia",
          "siêu cúp",
          "the thao",
          "tin 24",
          "tin bong da",
          "siêu cúp tây ban nha 2019",
          "lịch thi đấu cúp nhà vua tây ban nha",
          "tin tức 24",
          "trận real madrid",
          "cúp nhà vua",
          "keo nhà cái",
          "lich thi dau tay ban nha",
          "tin tức bóng đá",
          "nhận định real vs",
          "lich thi dau sieu cup tay ban nha",
          "la liga",
          "tin chuyen nhuong",
          "bóng da",
          "ket qua sieu cup tay ban nha",
          "the thao 24h",
          "bongda24h",
          "truc tiep bong da real vs valencia",
          "soi kèo real madrid",
          "lịch bóng đá",
          "bong",
          "kết qua bong da hom qua",
          "kết quả trận đấu",
          "valencia vs real madrid",
          "bong da truc tiep",
          "kết quả bóng đá cúp tây ban nha",
          "soi keo real",
          "truc tiep real madrid vs valencia",
          "ronaldo",
          "hazard",
          "lịch siêu cúp tây ban nha",
          "valencia vs",
          "m 24h",
          "nhan dinh bóng da",
          "xem real vs valencia",
          "kết quả bóng đá hôm nay",
          "24h",
          "real vs valencia truc tiep",
          "link real madrid",
          "nhận định trận barca",
          "lich sieu cup tay ban nha",
          "24h trong ngay",
          "bong da tbn",
          "siêu cúp tây ban nha",
          "nhận định barca",
          "lịch thi đấu world cup 2020",
          "thể thao bóng đá",
          "real madrid"
        ],
        "mid": [
          "/m/06l22",
          "/m/080_y",
          "/m/09gqx",
          "/m/0hvgt",
          "/m/02rf301",
          "/m/0kcv4"
        ],
        "trendinessSettings": {
          "compareTime": "2019-12-30T04\\:00\\:00 2020-01-04T20\\:00\\:00",
          "jumpThreshold": 1.5
        },
        "locale": "en-US"
      },
      "token": "APP6_UEAAAAAXhhCzrlR6d91lve-47I6yPA5UekUWSVI",
      "id": "RELATED_QUERIES",
      "type": "fe_related_queries",
      "title": "Trending queries",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "request": {
        "geo": {
          "country": "VN"
        },
        "time": "2020-01-04T20\\:00\\:00 2020-01-09T09\\:20\\:00",
        "mid": [
          "/m/06l22",
          "/m/080_y",
          "/m/09gqx",
          "/m/0hvgt",
          "/m/02rf301",
          "/m/0kcv4"
        ],
        "locale": "en-US"
      },
      "token": "APP6_UEAAAAAXhhCzoobrA_z_1aAy04V4t8X-kmGybP4",
      "id": "RELATED_TOPICS",
      "type": "fe_related_topics",
      "title": "Related topics",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": true,
      "isCurated": false
    }
  ],
  "widgetIds": [
    "NEWS_ARTICLE",
    "TIMESERIES",
    "GEO_MAP",
    "RELATED_QUERIES",
    "RELATED_TOPICS"
  ],
  "components": []
}
*/
const stories = (opts, callback) => {
	let idStory = opts.idStory;

	opts = Object.assign({}, trendsDefaultOpts, opts);

	let { hl, tz } = opts;

	request({
		url: `https://trends.google.com.vn/trends/api/stories/${idStory}?hl=${hl}&tz=${tz}`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(4);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "widgets": [
    {
      "request": {
        "time": "2019-01-10 2020-01-10",
        "resolution": "WEEK",
        "locale": "vi",
        "comparisonItem": [
          {
            "geo": {
              "country": "VN"
            },
            "complexKeywordsRestriction": {
              "keyword": [
                {
                  "type": "BROAD",
                  "value": "barca"
                }
              ]
            }
          }
        ],
        "requestOptions": {
          "property": "",
          "backend": "IZG",
          "category": 0
        }
      },
      "lineAnnotationText": "Sở thích tìm kiếm",
      "bullets": [
        {
          "text": "barca"
        }
      ],
      "showLegend": false,
      "showAverages": false,
      "helpDialog": {
        "title": "Sự quan tâm theo thời gian",
        "content": "Các con số thể hiện sở thích tìm kiếm có liên quan đến điểm cao nhất trên biểu đồ trong khoảng thời gian và khu vực đã cho. Giá trị 100 là cụm từ có truy vấn phổ biến nhất. Giá trị 50 nghĩa là cụm từ đó có tần suất tìm kiếm chỉ bằng một nửa. Điểm 0 nghĩa là không có đủ dữ liệu cho cụm từ này."
      },
      "token": "APP6_UEAAAAAXhmn575kii3oVpc73vdzqpvqexxj20rz",
      "id": "TIMESERIES",
      "type": "fe_line_chart",
      "title": "Sự quan tâm theo thời gian",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": true,
      "isCurated": false
    },
    {
      "request": {
        "geo": {
          "country": "VN"
        },
        "comparisonItem": [
          {
            "time": "2019-01-10 2020-01-10",
            "complexKeywordsRestriction": {
              "keyword": [
                {
                  "type": "BROAD",
                  "value": "barca"
                }
              ]
            }
          }
        ],
        "resolution": "REGION",
        "locale": "vi",
        "requestOptions": {
          "property": "",
          "backend": "IZG",
          "category": 0
        }
      },
      "geo": "VN",
      "resolution": "provinces",
      "searchInterestLabel": "Sở thích tìm kiếm",
      "displayMode": "regions",
      "helpDialog": {
        "title": "Sở thích theo tiểu vùng",
        "content": "Xem vị trí mà cụm từ của bạn phổ biến nhất trong khung thời gian được chỉ định. Giá trị được tính theo thang điểm từ 0 đến 100, trong đó 100 là vị trí có tìm kiếm phổ biến nhất theo tỷ lệ trong số tất cả các tìm kiếm tại vị trí đó, giá trị 50 cho biết vị trí có tần suất tìm kiếm chỉ bằng một nửa. Giá trị 0 cho biết vị trí không có đủ dữ liệu cho cụm từ này. <p><p> <b>Lưu ý:</b> Giá trị cao hơn có nghĩa là tỷ lệ tất cả các truy vấn cao hơn chứ không phải tổng số truy vấn tuyệt đối cao hơn. Vì vậy, một quốc gia nhỏ nơi các truy vấn về \"chuối\" chiếm 80% sẽ có số điểm gấp đôi một quốc gia lớn nơi truy vấn về \"chuối\" chiếm 40%.",
        "url": "https://support.google.com/trends/answer/4355212"
      },
      "color": "PALETTE_COLOR_1",
      "index": 0,
      "bullet": "barca",
      "token": "APP6_UEAAAAAXhmn50vsD5BKePbKaWQAe9DPuM3Fyrwd",
      "id": "GEO_MAP",
      "type": "fe_geo_chart_explore",
      "title": "Sở thích theo tiểu vùng",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": true,
      "isCurated": false
    },
    {
      "request": {
        "restriction": {
          "geo": {
            "country": "VN"
          },
          "time": "2019-01-10 2020-01-10",
          "originalTimeRangeForExploreUrl": "today 12-m",
          "complexKeywordsRestriction": {
            "keyword": [
              {
                "type": "BROAD",
                "value": "barca"
              }
            ]
          }
        },
        "keywordType": "ENTITY",
        "metric": [
          "TOP",
          "RISING"
        ],
        "trendinessSettings": {
          "compareTime": "2018-01-09 2019-01-09"
        },
        "requestOptions": {
          "property": "",
          "backend": "IZG",
          "category": 0
        },
        "language": "vi"
      },
      "helpDialog": {
        "title": "Chủ đề có liên quan",
        "content": "Người dùng đang tìm kiếm cụm từ của bạn cũng đã tìm kiếm các chủ đề này. Bạn có thể xem theo các chỉ số sau: <p>* <b>Hàng đầu</b> - Chủ đề phổ biến nhất. Điểm được tính theo thang điểm tương đối, trong đó giá trị 100 là chủ đề được tìm kiếm phổ biến nhất và 50 là chủ đề có tần suất tìm kiếm chỉ bằng một nửa so với thuật ngữ phổ biến nhất, v.v. <p>* <b>Tăng</b> - Các chủ đề liên quan có mức tăng lớn nhất về tần suất tìm kiếm kể từ khoảng thời gian trước. Kết quả được đánh dấu là \"Đột phá\" có mức tăng rất lớn, có thể do những chủ đề này mới và có ít tìm kiếm trước đây (nếu có)."
      },
      "color": "PALETTE_COLOR_1",
      "keywordName": "barca",
      "token": "APP6_UEAAAAAXhmn53WpQeeKsNC6H4bLu05LOG-yuAJ4",
      "id": "RELATED_TOPICS",
      "type": "fe_related_searches",
      "title": "Chủ đề có liên quan",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "request": {
        "restriction": {
          "geo": {
            "country": "VN"
          },
          "time": "2019-01-10 2020-01-10",
          "originalTimeRangeForExploreUrl": "today 12-m",
          "complexKeywordsRestriction": {
            "keyword": [
              {
                "type": "BROAD",
                "value": "barca"
              }
            ]
          }
        },
        "keywordType": "QUERY",
        "metric": [
          "TOP",
          "RISING"
        ],
        "trendinessSettings": {
          "compareTime": "2018-01-09 2019-01-09"
        },
        "requestOptions": {
          "property": "",
          "backend": "IZG",
          "category": 0
        },
        "language": "vi"
      },
      "helpDialog": {
        "title": "Cụm từ tìm kiếm có liên quan",
        "content": "Người dùng đang tìm kiếm cụm từ của bạn cũng đã tìm kiếm các truy vấn này. Bạn có thể sắp xếp theo các chỉ số sau: <p>* <b>Hàng đầu</b> - Truy vấn tìm kiếm phổ biến nhất. Điểm được tính theo thang điểm tương đối, trong đó giá trị 100 là truy vấn được tìm kiếm phổ biến nhất, 50 là truy vấn có tần suất tìm kiếm chỉ bằng một nửa so với truy vấn phổ biến nhất, v.v. <p>* <b>Tăng</b> - Các truy vấn có mức tăng lớn nhất về tần suất tìm kiếm kể từ khoảng thời gian trước. Kết quả được đánh dấu là \"Đột phá\" có mức tăng rất lớn, có thể do những truy vấn này mới và có ít tìm kiếm trước đây (nếu có).",
        "url": "https://support.google.com/trends/answer/4355000"
      },
      "color": "PALETTE_COLOR_1",
      "keywordName": "barca",
      "token": "APP6_UEAAAAAXhmn5yCRfj-xBp8MWCXB3GKJ0XQrYi12",
      "id": "RELATED_QUERIES",
      "type": "fe_related_searches",
      "title": "Cụm từ tìm kiếm có liên quan",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    }
  ],
  "keywords": [
    {
      "keyword": "barca",
      "name": "barca",
      "type": "Cụm từ tìm kiếm"
    }
  ],
  "timeRanges": [
    "12 tháng qua"
  ],
  "examples": [],
  "shareText": "Khám phá sở thích tìm kiếm cho barca theo thời gian, vị trí và mức độ phổ biến trên Google Xu hướng",
  "shouldShowMultiHeatMapMessage": false
}
*/
const explore = (opts, callback) => {
	request({
		url: `https://trends.google.com.vn/trends/api/explore?hl=vi&req=%7B%22comparisonItem%22:%5B%7B%22keyword%22:%22barca%22,%22geo%22:%22VN%22,%22time%22:%22today+12-m%22%7D%5D,%22category%22:0,%22property%22:%22%22%7D&tz=-420`,
		method: 'GET',
    headers: {
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
      'referer': `https://trends.google.com.vn/trends/explore?q=barca&geo=VN`,
      // 'cookie': 'NID=195%3DIsEs6F1R8HVec7ByYrI1WZbvGKVtgTQ48nvhPgdULLlkXPhIl_sSJ_85egxT7zyTAfhlp2hn8xcUEId2jy0qfP79mamLEkNmWi5Yq7Gv8_L7wqqhUyOaX7bDFmARh2HV6MvNO02-TD30ewTU1czUoQqLphQnokAlWK2AssmIgiE'
    },
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

    let tryparse = body.slice(4);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "default": {
    "rankedList": [
      {
        "rankedKeyword": [
          {
            "topic": {
              "mid": "/m/0hvgt",
              "title": "FC Barcelona",
              "type": "Football club"
            },
            "value": 100,
            "formattedValue": "100",
            "hasData": true,
            "link": "/trends/explore?q=/m/0hvgt&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/06l22",
              "title": "Real Madrid C.F.",
              "type": "Football club"
            },
            "value": 9,
            "formattedValue": "9",
            "hasData": true,
            "link": "/trends/explore?q=/m/06l22&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/025txtg",
              "title": "RCD Espanyol de Barcelona",
              "type": "Football club"
            },
            "value": 6,
            "formattedValue": "6",
            "hasData": true,
            "link": "/trends/explore?q=/m/025txtg&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/g/11c5b1ps_k",
              "title": "Dream League Soccer",
              "type": "Video game"
            },
            "value": 6,
            "formattedValue": "6",
            "hasData": true,
            "link": "/trends/explore?q=/g/11c5b1ps_k&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/050fh",
              "title": "Manchester United F.C.",
              "type": "Football club"
            },
            "value": 6,
            "formattedValue": "6",
            "hasData": true,
            "link": "/trends/explore?q=/m/050fh&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0lg7v",
              "title": "Atlético Madrid",
              "type": "Football club"
            },
            "value": 3,
            "formattedValue": "3",
            "hasData": true,
            "link": "/trends/explore?q=/m/0lg7v&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/01634x",
              "title": "Manchester City F.C.",
              "type": "Football club"
            },
            "value": 3,
            "formattedValue": "3",
            "hasData": true,
            "link": "/trends/explore?q=/m/01634x&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0dp8ry",
              "title": "Kit",
              "type": "Association football"
            },
            "value": 2,
            "formattedValue": "2",
            "hasData": true,
            "link": "/trends/explore?q=/m/0dp8ry&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/045xx",
              "title": "Juventus F.C.",
              "type": "Football club"
            },
            "value": 2,
            "formattedValue": "2",
            "hasData": true,
            "link": "/trends/explore?q=/m/045xx&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/09gqx",
              "title": "La Liga",
              "type": "Football league"
            },
            "value": 2,
            "formattedValue": "2",
            "hasData": true,
            "link": "/trends/explore?q=/m/09gqx&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/04ltf",
              "title": "Liverpool F.C.",
              "type": "Football club"
            },
            "value": 2,
            "formattedValue": "2",
            "hasData": true,
            "link": "/trends/explore?q=/m/04ltf&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0dwx7",
              "title": "Logo",
              "type": "Topic"
            },
            "value": 2,
            "formattedValue": "2",
            "hasData": true,
            "link": "/trends/explore?q=/m/0dwx7&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/07rcyr",
              "title": "Transfer window",
              "type": "Topic"
            },
            "value": 2,
            "formattedValue": "2",
            "hasData": true,
            "link": "/trends/explore?q=/m/07rcyr&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/06qjgc",
              "title": "Lionel Messi",
              "type": "Footballer"
            },
            "value": 1,
            "formattedValue": "1",
            "hasData": true,
            "link": "/trends/explore?q=/m/06qjgc&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/01rlzn",
              "title": "Leicester City F.C.",
              "type": "Football club"
            },
            "value": 1,
            "formattedValue": "1",
            "hasData": true,
            "link": "/trends/explore?q=/m/01rlzn&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0gl2ny2",
              "title": "Football player",
              "type": "Topic"
            },
            "value": 1,
            "formattedValue": "1",
            "hasData": true,
            "link": "/trends/explore?q=/m/0gl2ny2&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0b6fcrg",
              "title": "Wu Lei",
              "type": "Chinese footballer"
            },
            "value": 1,
            "formattedValue": "1",
            "hasData": true,
            "link": "/trends/explore?q=/m/0b6fcrg&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/02rh_0",
              "title": "S.L. Benfica",
              "type": "Professional sports club"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/02rh_0&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/03kwlb",
              "title": "Supercopa de España",
              "type": "Topic"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/03kwlb&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/075q_",
              "title": "SS Lazio",
              "type": "Professional sports club"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/075q_&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/094jc",
              "title": "Fishing",
              "type": "Topic"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/094jc&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/07r78j",
              "title": "Torino F.C.",
              "type": "Football club"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/07r78j&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0ddh5vg",
              "title": "King Abdullah Sport City Stadium",
              "type": "Stadium in Jeddah, Saudi Arabia"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/0ddh5vg&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/02qs4vr",
              "title": "Ernesto Valverde",
              "type": "Spanish footballer"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/02qs4vr&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/08vk_r",
              "title": "Genoa C.F.C.",
              "type": "Football club"
            },
            "value": 0,
            "formattedValue": "<1",
            "hasData": true,
            "link": "/trends/explore?q=/m/08vk_r&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          }
        ]
      },
      {
        "rankedKeyword": [
          {
            "topic": {
              "mid": "/m/0ddh5vg",
              "title": "King Abdullah Sport City Stadium",
              "type": "Stadium in Jeddah, Saudi Arabia"
            },
            "value": 16900,
            "formattedValue": "Breakout",
            "link": "/trends/explore?q=/m/0ddh5vg&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/046zk0",
              "title": "Qatar national football team",
              "type": "Football team"
            },
            "value": 6100,
            "formattedValue": "Breakout",
            "link": "/trends/explore?q=/m/046zk0&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/01xn4fj",
              "title": "Iran national under-23 football team",
              "type": "Football team"
            },
            "value": 4800,
            "formattedValue": "+4,800%",
            "link": "/trends/explore?q=/m/01xn4fj&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0dsb6rm",
              "title": "Uzbekistan national under-23 football team",
              "type": "Football team"
            },
            "value": 4700,
            "formattedValue": "+4,700%",
            "link": "/trends/explore?q=/m/0dsb6rm&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/01n_2f",
              "title": "Iran national football team",
              "type": "Football team"
            },
            "value": 4650,
            "formattedValue": "+4,650%",
            "link": "/trends/explore?q=/m/01n_2f&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/04b59m",
              "title": "AS Saint-Étienne",
              "type": "Football club"
            },
            "value": 4650,
            "formattedValue": "+4,650%",
            "link": "/trends/explore?q=/m/04b59m&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/02rytm",
              "title": "Sweden national football team",
              "type": "Football team"
            },
            "value": 3750,
            "formattedValue": "+3,750%",
            "link": "/trends/explore?q=/m/02rytm&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/03__77",
              "title": "Uzbekistan national football team",
              "type": "Football team"
            },
            "value": 3600,
            "formattedValue": "+3,600%",
            "link": "/trends/explore?q=/m/03__77&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0b6fcrg",
              "title": "Wu Lei",
              "type": "Chinese footballer"
            },
            "value": 2950,
            "formattedValue": "+2,950%",
            "link": "/trends/explore?q=/m/0b6fcrg&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/094jc",
              "title": "Fishing",
              "type": "Topic"
            },
            "value": 2850,
            "formattedValue": "+2,850%",
            "link": "/trends/explore?q=/m/094jc&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/057pp2",
              "title": "K.A.S. Eupen",
              "type": "Football club"
            },
            "value": 2500,
            "formattedValue": "+2,500%",
            "link": "/trends/explore?q=/m/057pp2&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0hndyry",
              "title": "Syria national under-23 football team",
              "type": "Association Football team"
            },
            "value": 1950,
            "formattedValue": "+1,950%",
            "link": "/trends/explore?q=/m/0hndyry&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/08vk_r",
              "title": "Genoa C.F.C.",
              "type": "Football club"
            },
            "value": 1500,
            "formattedValue": "+1,500%",
            "link": "/trends/explore?q=/m/08vk_r&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/07r78j",
              "title": "Torino F.C.",
              "type": "Football club"
            },
            "value": 1000,
            "formattedValue": "+1,000%",
            "link": "/trends/explore?q=/m/07r78j&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0f5hyg",
              "title": "Granada CF",
              "type": "Football club"
            },
            "value": 750,
            "formattedValue": "+750%",
            "link": "/trends/explore?q=/m/0f5hyg&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0j42p0y",
              "title": "Qatar national under-23 football team",
              "type": "Football team"
            },
            "value": 700,
            "formattedValue": "+700%",
            "link": "/trends/explore?q=/m/0j42p0y&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/01xml3",
              "title": "UEFA Super Cup",
              "type": "Football match"
            },
            "value": 650,
            "formattedValue": "+650%",
            "link": "/trends/explore?q=/m/01xml3&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/07t_x",
              "title": "Uzbekistan",
              "type": "Country in Central Asia"
            },
            "value": 600,
            "formattedValue": "+600%",
            "link": "/trends/explore?q=/m/07t_x&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/03zrhb",
              "title": "South Korea national football team",
              "type": "Football team"
            },
            "value": 500,
            "formattedValue": "+500%",
            "link": "/trends/explore?q=/m/03zrhb&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/03kwlb",
              "title": "Supercopa de España",
              "type": "Topic"
            },
            "value": 500,
            "formattedValue": "+500%",
            "link": "/trends/explore?q=/m/03kwlb&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/075q_",
              "title": "SS Lazio",
              "type": "Professional sports club"
            },
            "value": 400,
            "formattedValue": "+400%",
            "link": "/trends/explore?q=/m/075q_&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/0nd4hqb",
              "title": "Jesse Lingard",
              "type": "Footballer"
            },
            "value": 300,
            "formattedValue": "+300%",
            "link": "/trends/explore?q=/m/0nd4hqb&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/01ql79",
              "title": "FA Community Shield",
              "type": "League"
            },
            "value": 250,
            "formattedValue": "+250%",
            "link": "/trends/explore?q=/m/01ql79&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/02qs4vr",
              "title": "Ernesto Valverde",
              "type": "Spanish footballer"
            },
            "value": 200,
            "formattedValue": "+200%",
            "link": "/trends/explore?q=/m/02qs4vr&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          },
          {
            "topic": {
              "mid": "/m/02rh_0",
              "title": "S.L. Benfica",
              "type": "Professional sports club"
            },
            "value": 200,
            "formattedValue": "+200%",
            "link": "/trends/explore?q=/m/02rh_0&date=2020-01-04T20%5C:00%5C:00+2020-01-09T08%5C:40%5C:00&geo=VN"
          }
        ]
      }
    ]
  }
}
*/
const widgetdata_relatedsearches = (opts, callback) => {
	request({
		url: `https://trends.google.com.vn/trends/api/widgetdata/relatedsearches?hl=en-US&tz=-420&req=%7B%22restriction%22:%7B%22geo%22:%7B%22country%22:%22VN%22%7D,%22time%22:%222020-01-04T20%5C%5C:00%5C%5C:00+2020-01-09T08%5C%5C:40%5C%5C:00%22,%22originalTimeRangeForExploreUrl%22:%222020-01-04T20%5C%5C:00%5C%5C:00+2020-01-09T08%5C%5C:40%5C%5C:00%22,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22PHRASE%22,%22value%22:%22barca%22%7D%5D%7D%7D,%22keywordType%22:%22ENTITY%22,%22metric%22:%5B%22TOP%22,%22RISING%22%5D,%22trendinessSettings%22:%7B%22compareTime%22:%222019-12-31T08%5C%5C:00%5C%5C:00+2020-01-04T20%5C%5C:00%5C%5C:00%22%7D,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22CM%22,%22category%22:0%7D,%22language%22:%22en%22%7D&token=APP6_UEAAAAAXhhFHzyKW_NAj3KOQzUd2S899L4HbloU`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "default": {
    "timelineData": [
      {
        "time": "1578168000",
        "formattedTime": "Jan 5, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 5 at 3:00 AM",
        "value": [
          76
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "76"
        ]
      },
      {
        "time": "1578171600",
        "formattedTime": "Jan 5, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 5 at 4:00 AM",
        "value": [
          100
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "100"
        ]
      },
      {
        "time": "1578175200",
        "formattedTime": "Jan 5, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 5 at 5:00 AM",
        "value": [
          58
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "58"
        ]
      },
      {
        "time": "1578178800",
        "formattedTime": "Jan 5, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 5 at 6:00 AM",
        "value": [
          45
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "45"
        ]
      },
      {
        "time": "1578182400",
        "formattedTime": "Jan 5, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 5 at 7:00 AM",
        "value": [
          27
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "27"
        ]
      },
      {
        "time": "1578186000",
        "formattedTime": "Jan 5, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 5 at 8:00 AM",
        "value": [
          16
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "16"
        ]
      },
      {
        "time": "1578189600",
        "formattedTime": "Jan 5, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 5 at 9:00 AM",
        "value": [
          11
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "11"
        ]
      },
      {
        "time": "1578193200",
        "formattedTime": "Jan 5, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 5 at 10:00 AM",
        "value": [
          10
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "10"
        ]
      },
      {
        "time": "1578196800",
        "formattedTime": "Jan 5, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 5 at 11:00 AM",
        "value": [
          8
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "8"
        ]
      },
      {
        "time": "1578200400",
        "formattedTime": "Jan 5, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 5 at 12:00 PM",
        "value": [
          6
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "6"
        ]
      },
      {
        "time": "1578204000",
        "formattedTime": "Jan 5, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 5 at 1:00 PM",
        "value": [
          5
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "5"
        ]
      },
      {
        "time": "1578207600",
        "formattedTime": "Jan 5, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 5 at 2:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578211200",
        "formattedTime": "Jan 5, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 5 at 3:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578214800",
        "formattedTime": "Jan 5, 2020 at 4:00 PM",
        "formattedAxisTime": "Jan 5 at 4:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578218400",
        "formattedTime": "Jan 5, 2020 at 5:00 PM",
        "formattedAxisTime": "Jan 5 at 5:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578222000",
        "formattedTime": "Jan 5, 2020 at 6:00 PM",
        "formattedAxisTime": "Jan 5 at 6:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578225600",
        "formattedTime": "Jan 5, 2020 at 7:00 PM",
        "formattedAxisTime": "Jan 5 at 7:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578229200",
        "formattedTime": "Jan 5, 2020 at 8:00 PM",
        "formattedAxisTime": "Jan 5 at 8:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578232800",
        "formattedTime": "Jan 5, 2020 at 9:00 PM",
        "formattedAxisTime": "Jan 5 at 9:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578236400",
        "formattedTime": "Jan 5, 2020 at 10:00 PM",
        "formattedAxisTime": "Jan 5 at 10:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578240000",
        "formattedTime": "Jan 5, 2020 at 11:00 PM",
        "formattedAxisTime": "Jan 5 at 11:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578243600",
        "formattedTime": "Jan 6, 2020 at 12:00 AM",
        "formattedAxisTime": "Jan 6 at 12:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578247200",
        "formattedTime": "Jan 6, 2020 at 1:00 AM",
        "formattedAxisTime": "Jan 6 at 1:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578250800",
        "formattedTime": "Jan 6, 2020 at 2:00 AM",
        "formattedAxisTime": "Jan 6 at 2:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578254400",
        "formattedTime": "Jan 6, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 6 at 3:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578258000",
        "formattedTime": "Jan 6, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 6 at 4:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578261600",
        "formattedTime": "Jan 6, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 6 at 5:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578265200",
        "formattedTime": "Jan 6, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 6 at 6:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578268800",
        "formattedTime": "Jan 6, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 6 at 7:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578272400",
        "formattedTime": "Jan 6, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 6 at 8:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578276000",
        "formattedTime": "Jan 6, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 6 at 9:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578279600",
        "formattedTime": "Jan 6, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 6 at 10:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578283200",
        "formattedTime": "Jan 6, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 6 at 11:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578286800",
        "formattedTime": "Jan 6, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 6 at 12:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578290400",
        "formattedTime": "Jan 6, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 6 at 1:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578294000",
        "formattedTime": "Jan 6, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 6 at 2:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578297600",
        "formattedTime": "Jan 6, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 6 at 3:00 PM",
        "value": [
          1
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "1"
        ]
      },
      {
        "time": "1578301200",
        "formattedTime": "Jan 6, 2020 at 4:00 PM",
        "formattedAxisTime": "Jan 6 at 4:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578304800",
        "formattedTime": "Jan 6, 2020 at 5:00 PM",
        "formattedAxisTime": "Jan 6 at 5:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578308400",
        "formattedTime": "Jan 6, 2020 at 6:00 PM",
        "formattedAxisTime": "Jan 6 at 6:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578312000",
        "formattedTime": "Jan 6, 2020 at 7:00 PM",
        "formattedAxisTime": "Jan 6 at 7:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578315600",
        "formattedTime": "Jan 6, 2020 at 8:00 PM",
        "formattedAxisTime": "Jan 6 at 8:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578319200",
        "formattedTime": "Jan 6, 2020 at 9:00 PM",
        "formattedAxisTime": "Jan 6 at 9:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578322800",
        "formattedTime": "Jan 6, 2020 at 10:00 PM",
        "formattedAxisTime": "Jan 6 at 10:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578326400",
        "formattedTime": "Jan 6, 2020 at 11:00 PM",
        "formattedAxisTime": "Jan 6 at 11:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578330000",
        "formattedTime": "Jan 7, 2020 at 12:00 AM",
        "formattedAxisTime": "Jan 7 at 12:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578333600",
        "formattedTime": "Jan 7, 2020 at 1:00 AM",
        "formattedAxisTime": "Jan 7 at 1:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578337200",
        "formattedTime": "Jan 7, 2020 at 2:00 AM",
        "formattedAxisTime": "Jan 7 at 2:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578340800",
        "formattedTime": "Jan 7, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 7 at 3:00 AM",
        "value": [
          1
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "1"
        ]
      },
      {
        "time": "1578344400",
        "formattedTime": "Jan 7, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 7 at 4:00 AM",
        "value": [
          1
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "1"
        ]
      },
      {
        "time": "1578348000",
        "formattedTime": "Jan 7, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 7 at 5:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578351600",
        "formattedTime": "Jan 7, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 7 at 6:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578355200",
        "formattedTime": "Jan 7, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 7 at 7:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578358800",
        "formattedTime": "Jan 7, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 7 at 8:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578362400",
        "formattedTime": "Jan 7, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 7 at 9:00 AM",
        "value": [
          1
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "1"
        ]
      },
      {
        "time": "1578366000",
        "formattedTime": "Jan 7, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 7 at 10:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578369600",
        "formattedTime": "Jan 7, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 7 at 11:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578373200",
        "formattedTime": "Jan 7, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 7 at 12:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578376800",
        "formattedTime": "Jan 7, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 7 at 1:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578380400",
        "formattedTime": "Jan 7, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 7 at 2:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578384000",
        "formattedTime": "Jan 7, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 7 at 3:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578387600",
        "formattedTime": "Jan 7, 2020 at 4:00 PM",
        "formattedAxisTime": "Jan 7 at 4:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578391200",
        "formattedTime": "Jan 7, 2020 at 5:00 PM",
        "formattedAxisTime": "Jan 7 at 5:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578394800",
        "formattedTime": "Jan 7, 2020 at 6:00 PM",
        "formattedAxisTime": "Jan 7 at 6:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578398400",
        "formattedTime": "Jan 7, 2020 at 7:00 PM",
        "formattedAxisTime": "Jan 7 at 7:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578402000",
        "formattedTime": "Jan 7, 2020 at 8:00 PM",
        "formattedAxisTime": "Jan 7 at 8:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578405600",
        "formattedTime": "Jan 7, 2020 at 9:00 PM",
        "formattedAxisTime": "Jan 7 at 9:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578409200",
        "formattedTime": "Jan 7, 2020 at 10:00 PM",
        "formattedAxisTime": "Jan 7 at 10:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578412800",
        "formattedTime": "Jan 7, 2020 at 11:00 PM",
        "formattedAxisTime": "Jan 7 at 11:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578416400",
        "formattedTime": "Jan 8, 2020 at 12:00 AM",
        "formattedAxisTime": "Jan 8 at 12:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578420000",
        "formattedTime": "Jan 8, 2020 at 1:00 AM",
        "formattedAxisTime": "Jan 8 at 1:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578423600",
        "formattedTime": "Jan 8, 2020 at 2:00 AM",
        "formattedAxisTime": "Jan 8 at 2:00 AM",
        "value": [
          5
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "5"
        ]
      },
      {
        "time": "1578427200",
        "formattedTime": "Jan 8, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 8 at 3:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578430800",
        "formattedTime": "Jan 8, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 8 at 4:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578434400",
        "formattedTime": "Jan 8, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 8 at 5:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578438000",
        "formattedTime": "Jan 8, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 8 at 6:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578441600",
        "formattedTime": "Jan 8, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 8 at 7:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578445200",
        "formattedTime": "Jan 8, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 8 at 8:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578448800",
        "formattedTime": "Jan 8, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 8 at 9:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578452400",
        "formattedTime": "Jan 8, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 8 at 10:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578456000",
        "formattedTime": "Jan 8, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 8 at 11:00 AM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578459600",
        "formattedTime": "Jan 8, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 8 at 12:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578463200",
        "formattedTime": "Jan 8, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 8 at 1:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578466800",
        "formattedTime": "Jan 8, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 8 at 2:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578470400",
        "formattedTime": "Jan 8, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 8 at 3:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578474000",
        "formattedTime": "Jan 8, 2020 at 4:00 PM",
        "formattedAxisTime": "Jan 8 at 4:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578477600",
        "formattedTime": "Jan 8, 2020 at 5:00 PM",
        "formattedAxisTime": "Jan 8 at 5:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578481200",
        "formattedTime": "Jan 8, 2020 at 6:00 PM",
        "formattedAxisTime": "Jan 8 at 6:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578484800",
        "formattedTime": "Jan 8, 2020 at 7:00 PM",
        "formattedAxisTime": "Jan 8 at 7:00 PM",
        "value": [
          2
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "2"
        ]
      },
      {
        "time": "1578488400",
        "formattedTime": "Jan 8, 2020 at 8:00 PM",
        "formattedAxisTime": "Jan 8 at 8:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578492000",
        "formattedTime": "Jan 8, 2020 at 9:00 PM",
        "formattedAxisTime": "Jan 8 at 9:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578495600",
        "formattedTime": "Jan 8, 2020 at 10:00 PM",
        "formattedAxisTime": "Jan 8 at 10:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578499200",
        "formattedTime": "Jan 8, 2020 at 11:00 PM",
        "formattedAxisTime": "Jan 8 at 11:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578502800",
        "formattedTime": "Jan 9, 2020 at 12:00 AM",
        "formattedAxisTime": "Jan 9 at 12:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578506400",
        "formattedTime": "Jan 9, 2020 at 1:00 AM",
        "formattedAxisTime": "Jan 9 at 1:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578510000",
        "formattedTime": "Jan 9, 2020 at 2:00 AM",
        "formattedAxisTime": "Jan 9 at 2:00 AM",
        "value": [
          5
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "5"
        ]
      },
      {
        "time": "1578513600",
        "formattedTime": "Jan 9, 2020 at 3:00 AM",
        "formattedAxisTime": "Jan 9 at 3:00 AM",
        "value": [
          5
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "5"
        ]
      },
      {
        "time": "1578517200",
        "formattedTime": "Jan 9, 2020 at 4:00 AM",
        "formattedAxisTime": "Jan 9 at 4:00 AM",
        "value": [
          6
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "6"
        ]
      },
      {
        "time": "1578520800",
        "formattedTime": "Jan 9, 2020 at 5:00 AM",
        "formattedAxisTime": "Jan 9 at 5:00 AM",
        "value": [
          6
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "6"
        ]
      },
      {
        "time": "1578524400",
        "formattedTime": "Jan 9, 2020 at 6:00 AM",
        "formattedAxisTime": "Jan 9 at 6:00 AM",
        "value": [
          8
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "8"
        ]
      },
      {
        "time": "1578528000",
        "formattedTime": "Jan 9, 2020 at 7:00 AM",
        "formattedAxisTime": "Jan 9 at 7:00 AM",
        "value": [
          5
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "5"
        ]
      },
      {
        "time": "1578531600",
        "formattedTime": "Jan 9, 2020 at 8:00 AM",
        "formattedAxisTime": "Jan 9 at 8:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578535200",
        "formattedTime": "Jan 9, 2020 at 9:00 AM",
        "formattedAxisTime": "Jan 9 at 9:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578538800",
        "formattedTime": "Jan 9, 2020 at 10:00 AM",
        "formattedAxisTime": "Jan 9 at 10:00 AM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578542400",
        "formattedTime": "Jan 9, 2020 at 11:00 AM",
        "formattedAxisTime": "Jan 9 at 11:00 AM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578546000",
        "formattedTime": "Jan 9, 2020 at 12:00 PM",
        "formattedAxisTime": "Jan 9 at 12:00 PM",
        "value": [
          4
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "4"
        ]
      },
      {
        "time": "1578549600",
        "formattedTime": "Jan 9, 2020 at 1:00 PM",
        "formattedAxisTime": "Jan 9 at 1:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578553200",
        "formattedTime": "Jan 9, 2020 at 2:00 PM",
        "formattedAxisTime": "Jan 9 at 2:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      },
      {
        "time": "1578556800",
        "formattedTime": "Jan 9, 2020 at 3:00 PM",
        "formattedAxisTime": "Jan 9 at 3:00 PM",
        "value": [
          3
        ],
        "hasData": [
          true
        ],
        "formattedValue": [
          "3"
        ]
      }
    ],
    "averages": []
  }
}
*/
const widgetdata_multiline = (opts, callback) => {
	// chart Interest over time
	request({
		url: `https://trends.google.com.vn/trends/api/widgetdata/multiline?hl=en-US&tz=-420&req=%7B%22time%22:%222020-01-04T20%5C%5C:00%5C%5C:00+2020-01-09T08%5C%5C:40%5C%5C:00%22,%22resolution%22:%22HOUR%22,%22locale%22:%22en-US%22,%22comparisonItem%22:%5B%7B%22geo%22:%7B%22country%22:%22VN%22%7D,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22PHRASE%22,%22value%22:%22barca%22%7D%5D%7D%7D%5D,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22CM%22,%22category%22:0%7D%7D&token=APP6_UEAAAAAXhhFH0N9Bn6YhviRT5ixwEal5KRZZo2-&tz=-420`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "default": {
    "geoMapData": [
      {
        "coordinates": {
          "lat": 20.293321,
          "lng": 105.9773322
        },
        "geoName": "Thôn Bạch Cừ",
        "value": [
          100
        ],
        "formattedValue": [
          "100"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.0813263,
          "lng": 106.0292945
        },
        "geoName": "thôn RênTiên Du",
        "value": [
          85
        ],
        "formattedValue": [
          "85"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 12.512997,
          "lng": 109.140438
        },
        "geoName": "Ninh Hòa",
        "value": [
          80
        ],
        "formattedValue": [
          "80"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 18.3559537,
          "lng": 105.8877494
        },
        "geoName": "Hà Tĩnh",
        "value": [
          77
        ],
        "formattedValue": [
          "77"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 18.8726853,
          "lng": 105.5122694
        },
        "geoName": "Nghi Văn",
        "value": [
          71
        ],
        "formattedValue": [
          "71"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 14.4756838,
          "lng": 109.0037125
        },
        "geoName": "Hoài Tân",
        "value": [
          65
        ],
        "formattedValue": [
          "65"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 16.4198395,
          "lng": 107.6464295
        },
        "geoName": "tx. Hương Thủy",
        "value": [
          63
        ],
        "formattedValue": [
          "63"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 14.4585271,
          "lng": 109.0423479
        },
        "geoName": "Hoài Xuân",
        "value": [
          63
        ],
        "formattedValue": [
          "63"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 18.5301567,
          "lng": 105.7064569
        },
        "geoName": "tx. Hồng Lĩnh",
        "value": [
          61
        ],
        "formattedValue": [
          "61"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.7667086,
          "lng": 105.8994956
        },
        "geoName": "tx. Kiến Tường",
        "value": [
          60
        ],
        "formattedValue": [
          "60"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.71574,
          "lng": 107.7991545
        },
        "geoName": "La Gi",
        "value": [
          57
        ],
        "formattedValue": [
          "57"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.5419456,
          "lng": 107.8794943
        },
        "geoName": "tp. Móng Cái",
        "value": [
          55
        ],
        "formattedValue": [
          "55"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 13.4744193,
          "lng": 109.2355764
        },
        "geoName": "tx. Sông Cầu",
        "value": [
          55
        ],
        "formattedValue": [
          "55"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 16.4498,
          "lng": 107.5623501
        },
        "geoName": "Huế",
        "value": [
          53
        ],
        "formattedValue": [
          "53"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.1766814,
          "lng": 106.0621591
        },
        "geoName": "tp. Bắc Ninh",
        "value": [
          53
        ],
        "formattedValue": [
          "53"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 11.536023,
          "lng": 106.8908253
        },
        "geoName": "tx. Đồng Xoài",
        "value": [
          53
        ],
        "formattedValue": [
          "53"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 19.2931124,
          "lng": 105.4653897
        },
        "geoName": "tx. Thái Hòa",
        "value": [
          52
        ],
        "formattedValue": [
          "52"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 13.1057062,
          "lng": 109.295048
        },
        "geoName": "Tuy Hòa",
        "value": [
          50
        ],
        "formattedValue": [
          "50"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.4631513,
          "lng": 103.664991
        },
        "geoName": "Phổng Lăng",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.5825677,
          "lng": 108.9912066
        },
        "geoName": "Phan Rang–Tháp Chàm",
        "value": [
          49
        ],
        "formattedValue": [
          "49"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 20.8178012,
          "lng": 105.6793792
        },
        "geoName": "Đồng Lạc",
        "value": [
          49
        ],
        "formattedValue": [
          "49"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.021507,
          "lng": 105.0910974
        },
        "geoName": "Rạch Giá",
        "value": [
          49
        ],
        "formattedValue": [
          "49"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.9155965,
          "lng": 106.7692013
        },
        "geoName": "Di An",
        "value": [
          48
        ],
        "formattedValue": [
          "48"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 14.0279256,
          "lng": 108.6888227
        },
        "geoName": "tx. An Khê",
        "value": [
          48
        ],
        "formattedValue": [
          "48"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.4054168,
          "lng": 107.2607289
        },
        "geoName": "Lang Phuoc Hai",
        "value": [
          47
        ],
        "formattedValue": [
          "47"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 15.5638825,
          "lng": 108.4786313
        },
        "geoName": "tp. Tam Kỳ",
        "value": [
          47
        ],
        "formattedValue": [
          "47"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.081585,
          "lng": 106.7470536
        },
        "geoName": "tp. Uông Bí",
        "value": [
          46
        ],
        "formattedValue": [
          "46"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.2448442,
          "lng": 105.958865
        },
        "geoName": "tp. Vĩnh Long",
        "value": [
          45
        ],
        "formattedValue": [
          "45"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 18.6795848,
          "lng": 105.6813333
        },
        "geoName": "Vinh",
        "value": [
          45
        ],
        "formattedValue": [
          "45"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 19.2370094,
          "lng": 105.7116464
        },
        "geoName": "tx. Hoàng Mai",
        "value": [
          45
        ],
        "formattedValue": [
          "45"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.9574128,
          "lng": 106.8426871
        },
        "geoName": "Bien Hoa",
        "value": [
          45
        ],
        "formattedValue": [
          "45"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.3325846,
          "lng": 105.7233814
        },
        "geoName": "tx. Phúc Yên",
        "value": [
          44
        ],
        "formattedValue": [
          "44"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 9.602521,
          "lng": 105.9739049
        },
        "geoName": "Sóc Trăng",
        "value": [
          44
        ],
        "formattedValue": [
          "44"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 13.0294461,
          "lng": 109.3381695
        },
        "geoName": "Hòa Hiệp Bắc",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.9008657,
          "lng": 109.140438
        },
        "geoName": "Cam Ranh",
        "value": [
          44
        ],
        "formattedValue": [
          "44"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 20.5476734,
          "lng": 105.9347384
        },
        "geoName": "tp. Phủ Lý",
        "value": [
          44
        ],
        "formattedValue": [
          "44"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.9442612,
          "lng": 107.2311774
        },
        "geoName": "Long Khanh",
        "value": [
          44
        ],
        "formattedValue": [
          "44"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 13.8237794,
          "lng": 109.1588926
        },
        "geoName": "Thôn Giang Nam",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.4388225,
          "lng": 106.1621053
        },
        "geoName": "Nam Định",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.1032279,
          "lng": 105.4969964
        },
        "geoName": "tx. Sơn Tây",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 21.1196529,
          "lng": 105.9623161
        },
        "geoName": "tx. Từ Sơn",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.029192,
          "lng": 105.8525154
        },
        "geoName": "tx. Bình Minh",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.3765284,
          "lng": 106.3438891
        },
        "geoName": "Mỹ Tho",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.241361,
          "lng": 106.3762601
        },
        "geoName": "tp. Bến Tre",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.4113797,
          "lng": 107.136224
        },
        "geoName": "Vũng Tàu",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 16.420796,
          "lng": 107.5031811
        },
        "geoName": "tx. Hương Trà",
        "value": [
          43
        ],
        "formattedValue": [
          "43"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 19.7575271,
          "lng": 105.9053689
        },
        "geoName": "tx. Sầm Sơn",
        "value": [
          42
        ],
        "formattedValue": [
          "42"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.9804603,
          "lng": 108.2614775
        },
        "geoName": "Phan Thiet",
        "value": [
          42
        ],
        "formattedValue": [
          "42"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 20.9373413,
          "lng": 106.3145542
        },
        "geoName": "Hải Dương",
        "value": [
          42
        ],
        "formattedValue": [
          "42"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 20.4463471,
          "lng": 106.3365828
        },
        "geoName": "Thái Bình",
        "value": [
          42
        ],
        "formattedValue": [
          "42"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 20.2506149,
          "lng": 105.9744536
        },
        "geoName": "Ninh Bình",
        "value": [
          41
        ],
        "formattedValue": [
          "41"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 9.8252566,
          "lng": 105.8172881
        },
        "geoName": "tx. Ngã Bảy",
        "value": [
          41
        ],
        "formattedValue": [
          "41"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 22.8025588,
          "lng": 104.9784494
        },
        "geoName": "tp. Hà Giang",
        "value": [
          41
        ],
        "formattedValue": [
          "41"
        ],
        "maxValueIndex": 0,
        "hasData": [
          true
        ]
      },
      {
        "coordinates": {
          "lat": 10.4106494,
          "lng": 106.6645007
        },
        "geoName": "tx. Gò Công",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.3425399,
          "lng": 105.3716684
        },
        "geoName": "tp. Việt Trì",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.8449115,
          "lng": 106.6880841
        },
        "geoName": "Hai Phong",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.9302095,
          "lng": 106.71167
        },
        "geoName": "tx. Thuận An",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.0451618,
          "lng": 105.7468535
        },
        "geoName": "Can Tho",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.101302,
          "lng": 106.5819789
        },
        "geoName": "tx. Bến Cát",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.508928,
          "lng": 107.1816257
        },
        "geoName": "tp. Bà Rịa",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.9334638,
          "lng": 106.8414374
        },
        "geoName": "tx. Quảng Yên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.6523683,
          "lng": 106.0522616
        },
        "geoName": "tp. Hưng Yên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.8337331,
          "lng": 106.9948945
        },
        "geoName": "tx. Phước Long",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.9711977,
          "lng": 107.0448069
        },
        "geoName": "tp. Hạ Long",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.8026827,
          "lng": 105.1960795
        },
        "geoName": "tx. Tân Châu",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 12.2387911,
          "lng": 109.1967488
        },
        "geoName": "Nha Trang",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.1586245,
          "lng": 103.98402
        },
        "geoName": "Phu Quoc",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.1564917,
          "lng": 105.8736936
        },
        "geoName": "tp. Tam Điệp",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 22.0498734,
          "lng": 103.1634988
        },
        "geoName": "Thị Xã Mường Lay",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.5671559,
          "lng": 105.8252038
        },
        "geoName": "Thái Nguyên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.828578,
          "lng": 105.3380302
        },
        "geoName": "tp. Hòa Bình",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 19.806692,
          "lng": 105.7851816
        },
        "geoName": "Thanh Hóa",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 16.0544068,
          "lng": 108.2021667
        },
        "geoName": "Da Nang",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.0272159,
          "lng": 105.6147432
        },
        "geoName": "Hữu Bằng",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 12.6661944,
          "lng": 108.0382475
        },
        "geoName": "Buon Ma Thuot",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.3270341,
          "lng": 103.9141288
        },
        "geoName": "tp. Sơn La",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.6820814,
          "lng": 105.0823967
        },
        "geoName": "tp. Châu Đốc",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.853708,
          "lng": 106.761519
        },
        "geoName": "Lạng Sơn",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.3759416,
          "lng": 105.4185406
        },
        "geoName": "Long Xuyên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.8255238,
          "lng": 105.3950939
        },
        "geoName": "Hồng Ngự",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.7167689,
          "lng": 104.8985878
        },
        "geoName": "tp. Yên Bái",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 13.7829673,
          "lng": 109.2196634
        },
        "geoName": "Qui Nhơn",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.4094269,
          "lng": 103.0355852
        },
        "geoName": "tp. Điện Biên Phủ",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.0277644,
          "lng": 105.8341598
        },
        "geoName": "Hanoi",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.7767246,
          "lng": 105.2280196
        },
        "geoName": "Tuyên Quang",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.2583922,
          "lng": 106.3375493
        },
        "geoName": "Yên Sơn",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.8230989,
          "lng": 106.6296638
        },
        "geoName": "Ho Chi Minh City",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.1608547,
          "lng": 106.4170311
        },
        "geoName": "tx. Chí Linh",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 13.8641717,
          "lng": 109.0690976
        },
        "geoName": "tx. An Nhơn",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.3675415,
          "lng": 106.1192802
        },
        "geoName": "Tây Ninh",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.9929842,
          "lng": 106.6557073
        },
        "geoName": "tp. Thủ Dầu Một",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 16.8088928,
          "lng": 107.0893798
        },
        "geoName": "Đông Hà",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.2973262,
          "lng": 105.6060661
        },
        "geoName": "tp. Vĩnh Yên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.2909028,
          "lng": 106.1867027
        },
        "geoName": "tp. Bắc Giang",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 20.0889153,
          "lng": 105.8877494
        },
        "geoName": "tx. Bỉm Sơn",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 13.9718356,
          "lng": 108.0150796
        },
        "geoName": "Pleiku",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.4549723,
          "lng": 105.6340352
        },
        "geoName": "Cao Lãnh",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.381909,
          "lng": 104.4901728
        },
        "geoName": "tx. Hà Tiên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 15.8800584,
          "lng": 108.3380469
        },
        "geoName": "Hội An",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.9404192,
          "lng": 108.4583132
        },
        "geoName": "Dalat",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.537222,
          "lng": 106.080556
        },
        "geoName": "Tam Tiến",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.5330098,
          "lng": 106.4052541
        },
        "geoName": "Tân An",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.6922032,
          "lng": 106.6055534
        },
        "geoName": "tx. Bình Long",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.0715863,
          "lng": 106.6943524
        },
        "geoName": "tx. Tân Uyên",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 18.7916127,
          "lng": 105.7175138
        },
        "geoName": "tx. Cửa Lò",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 9.1526728,
          "lng": 105.1960795
        },
        "geoName": "Cà Mau",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 15.1213873,
          "lng": 108.8044145
        },
        "geoName": "Quảng Ngãi",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 13.3743393,
          "lng": 108.3989809
        },
        "geoName": "Ayun Pa",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 12.0036455,
          "lng": 107.6876481
        },
        "geoName": "tx. Gia Nghĩa",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 11.5731051,
          "lng": 107.8346924
        },
        "geoName": "tp. Bảo Lộc",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 9.9513316,
          "lng": 106.3346061
        },
        "geoName": "Trà Vinh",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 9.2573324,
          "lng": 105.7557791
        },
        "geoName": "tp. Bạc Liêu",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 17.4659391,
          "lng": 106.5983958
        },
        "geoName": "Đồng Hới",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.6018769,
          "lng": 104.5062651
        },
        "geoName": "tx. Nghĩa Lộ",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 22.1329032,
          "lng": 105.8407722
        },
        "geoName": "tp. Bắc Kạn",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.4252786,
          "lng": 105.2311827
        },
        "geoName": "tx. Phú Thọ",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.0694762,
          "lng": 107.3139304
        },
        "geoName": "tp. Cẩm Phả",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 12.8628297,
          "lng": 108.2614775
        },
        "geoName": "tx. Buôn Hồ",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.4757637,
          "lng": 105.8234766
        },
        "geoName": "tp. Sông Công",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 14.3497403,
          "lng": 108.0004606
        },
        "geoName": "Kon Tum",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 9.7731921,
          "lng": 105.4537082
        },
        "geoName": "Vị Thanh",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 9.3249582,
          "lng": 105.9804542
        },
        "geoName": "tx. Vĩnh Châu",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 22.4458835,
          "lng": 104.0037764
        },
        "geoName": "tp. Lào Cai",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.4138656,
          "lng": 105.8730678
        },
        "geoName": "Ba Hàng",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 16.750563,
          "lng": 107.1857063
        },
        "geoName": "tx. Quảng Trị",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 22.6655648,
          "lng": 106.2606733
        },
        "geoName": "tp. Cao Bằng",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 22.3997565,
          "lng": 103.4477219
        },
        "geoName": "tp. Lai Châu",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.3057678,
          "lng": 105.7468535
        },
        "geoName": "tp. Sa Đéc",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 21.8883672,
          "lng": 106.8768415
        },
        "geoName": "Hải Yến",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      },
      {
        "coordinates": {
          "lat": 10.5471497,
          "lng": 108.941309
        },
        "geoName": "Long Hải",
        "value": [
          0
        ],
        "formattedValue": [
          ""
        ],
        "maxValueIndex": 0,
        "hasData": [
          false
        ]
      }
    ]
  }
}
*/
const widgetdata_comparedgeo = (opts, callback) => {
	// Interest by subregion

	// Subregion
	// https://trends.google.com.vn/trends/api/widgetdata/comparedgeo?hl=en-US&tz=-420&req=%7B%22geo%22:%7B%22country%22:%22VN%22%7D,%22comparisonItem%22:%5B%7B%22time%22:%222020-01-04T20%5C%5C:00%5C%5C:00+2020-01-09T08%5C%5C:40%5C%5C:00%22,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22PHRASE%22,%22value%22:%22barca%22%7D%5D%7D%7D%5D,%22resolution%22:%22REGION%22,%22locale%22:%22en-US%22,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22CM%22,%22category%22:0%7D,%22includeLowSearchVolumeGeos%22:false%7D&token=APP6_UEAAAAAXhhH76CGxNUkMxJsq6BZlsDqGLE9yg-c
	request({
		// city
		url: `https://trends.google.com.vn/trends/api/widgetdata/comparedgeo?hl=en-US&tz=-420&req=%7B%22geo%22:%7B%22country%22:%22VN%22%7D,%22comparisonItem%22:%5B%7B%22time%22:%222020-01-04T20%5C%5C:00%5C%5C:00+2020-01-09T08%5C%5C:40%5C%5C:00%22,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22PHRASE%22,%22value%22:%22barca%22%7D%5D%7D%7D%5D,%22resolution%22:%22CITY%22,%22locale%22:%22en-US%22,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22CM%22,%22category%22:0%7D,%22includeLowSearchVolumeGeos%22:false%7D&token=APP6_UEAAAAAXhhH76CGxNUkMxJsq6BZlsDqGLE9yg-c`,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(5);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

/*
{
  "topCharts": [
    {
      "listTitle": "Xu Hướng Tìm Kiếm Nổi Bật",
      "listItems": [
        {
          "title": "Thời Tiết",
          "exploreQuery": ""
        },
        {
          "title": "ASEAN Cup 2019",
          "exploreQuery": ""
        },
        {
          "title": "Hoàng Hậu Ki",
          "exploreQuery": ""
        },
        {
          "title": "Độ Ta Không Độ Nàng",
          "exploreQuery": ""
        },
        {
          "title": "Nguyễn Phú Trọng",
          "exploreQuery": ""
        },
        {
          "title": "Chiếc Lá Cuốn Bay",
          "exploreQuery": ""
        },
        {
          "title": "Iphone 11",
          "exploreQuery": ""
        },
        {
          "title": "Cá Mực Hầm Mật",
          "exploreQuery": ""
        },
        {
          "title": "Hãy Trao Cho Anh",
          "exploreQuery": ""
        },
        {
          "title": "Thanos",
          "exploreQuery": ""
        }
      ],
      "id": "566c1ffc-c582-4cdb-9c43-00ccb6aa9a2d",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Tin Tức",
      "listItems": [
        {
          "title": "Bão Số 6",
          "exploreQuery": ""
        },
        {
          "title": "Sức Khỏe ông Nguyễn Phú Trọng",
          "exploreQuery": ""
        },
        {
          "title": "Anh Vũ qua đời",
          "exploreQuery": ""
        },
        {
          "title": "Phúc XO bị bắt",
          "exploreQuery": ""
        },
        {
          "title": "Vi khuẩn Whitmore ăn thịt người",
          "exploreQuery": ""
        },
        {
          "title": "Song Hye Kyo li dị chồng",
          "exploreQuery": ""
        },
        {
          "title": "Huấn Hoa Hồng bị bắt",
          "exploreQuery": ""
        },
        {
          "title": "Khá Bảnh bị bắt",
          "exploreQuery": ""
        },
        {
          "title": "39 người chết trong container",
          "exploreQuery": ""
        },
        {
          "title": "Vụ chém người ở Hà Nội",
          "exploreQuery": ""
        }
      ],
      "id": "999160d8-258f-4d9b-9a77-1952739fa633",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Nhân Vật",
      "listItems": [
        {
          "title": "Nguyễn Phú Trọng",
          "exploreQuery": ""
        },
        {
          "title": "Xuân Quỳnh",
          "exploreQuery": ""
        },
        {
          "title": "Khá Bảnh",
          "exploreQuery": ""
        },
        {
          "title": "Seungri",
          "exploreQuery": ""
        },
        {
          "title": "Kim Jong Un",
          "exploreQuery": ""
        },
        {
          "title": "Phúc XO",
          "exploreQuery": ""
        },
        {
          "title": "Jung Joon Young",
          "exploreQuery": ""
        },
        {
          "title": "Jack",
          "exploreQuery": ""
        },
        {
          "title": "Đông Nhi",
          "exploreQuery": ""
        },
        {
          "title": "Bà Tân Vlog",
          "exploreQuery": ""
        }
      ],
      "id": "6e9825e6-2a6c-43a5-9776-31baca76a0be",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Phim Điện Ảnh",
      "listItems": [
        {
          "title": "Joker",
          "exploreQuery": ""
        },
        {
          "title": "Cua Lại Vợ Bầu",
          "exploreQuery": ""
        },
        {
          "title": "Avenger Endgame",
          "exploreQuery": ""
        },
        {
          "title": "Aquaman",
          "exploreQuery": ""
        },
        {
          "title": "Vợ Ba",
          "exploreQuery": ""
        },
        {
          "title": "Trạng Quỳnh",
          "exploreQuery": ""
        },
        {
          "title": "Fast and Furious 9",
          "exploreQuery": ""
        },
        {
          "title": "Captian Marvel",
          "exploreQuery": ""
        },
        {
          "title": "Pháp Sư Mù",
          "exploreQuery": ""
        },
        {
          "title": "Godzilla",
          "exploreQuery": ""
        }
      ],
      "id": "a698193c-79b2-4b09-9b5a-5bb4e67c92eb",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Bài Hát",
      "listItems": [
        {
          "title": "Độ ta không độ nàng",
          "exploreQuery": ""
        },
        {
          "title": "Hãy trao cho anh",
          "exploreQuery": ""
        },
        {
          "title": "Sóng gió",
          "exploreQuery": ""
        },
        {
          "title": "Bạc phận",
          "exploreQuery": ""
        },
        {
          "title": "Cô Thắm không về",
          "exploreQuery": ""
        },
        {
          "title": "Simple love",
          "exploreQuery": ""
        },
        {
          "title": "Hồng nhan",
          "exploreQuery": ""
        },
        {
          "title": "Kill this love",
          "exploreQuery": ""
        },
        {
          "title": "Đúng người đúng thời điểm",
          "exploreQuery": ""
        },
        {
          "title": "Sai lầm của anh",
          "exploreQuery": ""
        }
      ],
      "id": "81317981-c431-442d-b601-ab34cd8a2f04",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Địa Điểm Gần Đây",
      "listItems": [
        {
          "title": "Cơm tấm gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Nhà hàng gần đây",
          "exploreQuery": ""
        },
        {
          "title": "ATM gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Quán cafe gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Quán ăn gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Trà sữa gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Rạp chiếu phim gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Bánh mì gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Trung tâm mua sắm gần đây",
          "exploreQuery": ""
        },
        {
          "title": "Nhà thuốc gần đây",
          "exploreQuery": ""
        }
      ],
      "id": "4678cc19-1597-4070-8c91-dc3fa25976da",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Phim Truyền Hình",
      "listItems": [
        {
          "title": "Về nhà đi con",
          "exploreQuery": ""
        },
        {
          "title": "Về nhà đi con ngoại truyện",
          "exploreQuery": ""
        },
        {
          "title": "Mối tình đầu của tôi",
          "exploreQuery": ""
        },
        {
          "title": "Tiếng sét trong mưa",
          "exploreQuery": ""
        },
        {
          "title": "Mê cung",
          "exploreQuery": ""
        },
        {
          "title": "Gạo nếp gạo tẻ",
          "exploreQuery": ""
        },
        {
          "title": "Bán chồng",
          "exploreQuery": ""
        },
        {
          "title": "Trà táo đỏ",
          "exploreQuery": ""
        },
        {
          "title": "Nnững cô gái trong thành phố",
          "exploreQuery": ""
        },
        {
          "title": "Đánh cắp giấc mơ",
          "exploreQuery": ""
        }
      ],
      "id": "18b80070-ea55-486f-bae6-950e99a5137c",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Những Câu Hỏi Nổi Bật",
      "listItems": [
        {
          "title": "Kumanthong là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Cà khịa là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Curacao ở đâu?",
          "exploreQuery": ""
        },
        {
          "title": "Độ ta không độ nàng là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Văn hóa giao thông là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Senorita là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Cục xì lầu ông bê lắp là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Chill là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Đường lưỡi bò là gì?",
          "exploreQuery": ""
        },
        {
          "title": "Cúng rằm tháng Bảy như thế nào cho đúng?",
          "exploreQuery": ""
        }
      ],
      "id": "95eafba6-f886-4722-929c-913a5c3a595c",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    },
    {
      "listTitle": "Du Lịch Trong Nước",
      "listItems": [
        {
          "title": "Phú Hữu",
          "exploreQuery": ""
        },
        {
          "title": "Nha Trang",
          "exploreQuery": ""
        },
        {
          "title": "Đà Lạt",
          "exploreQuery": ""
        },
        {
          "title": "Bến Tre",
          "exploreQuery": ""
        },
        {
          "title": "Đại Lải",
          "exploreQuery": ""
        },
        {
          "title": "Ba Vì",
          "exploreQuery": ""
        },
        {
          "title": "Vũng Tàu",
          "exploreQuery": ""
        },
        {
          "title": "Quy Nhơn",
          "exploreQuery": ""
        },
        {
          "title": "Hà Giang",
          "exploreQuery": ""
        },
        {
          "title": "Quãng Ngãi",
          "exploreQuery": ""
        }
      ],
      "id": "e5af1496-c737-4a03-920c-e8e68b899d6b",
      "type": "fe_expandable_list",
      "title": "",
      "template": "fe",
      "embedTemplate": "fe_embed",
      "version": "1",
      "isLong": false,
      "isCurated": false
    }
  ],
  "interactive": {
    "url": "https://about.google/stories/year-in-search-2019?utm_source=trends_site&utm_medium=referral&utm_campaign=yis2019",
    "imgUrl": "https://ssl.gstatic.com/trends_tpt/3c9b9689e1527caa1537ac5d7783f39eeea46d365d0de95d502c9ffeb395edad.png"
  }
}
*/
const topcharts = (opts, callback) => {
	// Year in Search
  debug('opts= %o', opts);

  opts = Object.assign({}, trendsDefaultOpts, opts);
  opts.date = opts.date || opts.year || new Date().getFullYear() - 1;

  let urlTopcharts = `https://trends.google.com.vn/trends/api/topcharts?hl=${opts.hl}&tz=${opts.tz}&date=${opts.date}&geo=${opts.geo}&isMobile=false`;

  debug('urlTopcharts= %s', urlTopcharts);

	request({
		url: urlTopcharts,
		method: 'GET',
    jar: cookie
	}, (err, response, body) => {
		if (err) return callback(err);

		let tryparse = body.slice(4);
		tryparse = safeParse(tryparse);

		return callback(null, tryparse);
	})
}

const autocomplete = (opts = {}, callback) => {
  let df = {
    hl: 'vi',
    tz: -420
  }

  opts = Object.assign({}, df, opts);

  if (!opts.keyword) return callback('ENOKEYWORD');

  request({
    url: `https://trends.google.com.vn/trends/api/autocomplete/${opts.keyword}?hl=${opts.hl}&tz=${opts.tz}`,
    method: 'GET',
    jar: cookie
  }, (err, response, body) => {
    if (err) return callback(err);

    let tryparse = body.slice(5);
    tryparse = safeParse(tryparse);

    return callback(null, tryparse);
  })
}

module.exports = {
	dailytrends,
	searchDailyByRss,
	realtimetrends,

	widgetdata_timeline,
	widgetdata_sparkline,
	widgetdata_relatedqueries,
	stories_summary,
	stories,
	explore,
	widgetdata_relatedsearches,
	widgetdata_multiline,
	widgetdata_comparedgeo,
	topcharts,
  autocomplete
}