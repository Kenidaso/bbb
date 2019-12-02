// {"mainContentSelector": ".container .sidebar_1"}
const NODE_ENV = process.env.NODE_ENV || 'development';

const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const path = require('path');
const async = require('async');

const debug = require('debug')('BaseEngine');
const fatal = require('debug')('FATAL');

const request = require('request').defaults({
  headers: {
    'cache-control': 'max-age=0',
    'upgrade-insecure-requests': 1,
    dnt: 1,
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'sec-fetch-site': 'cross-site',
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,la;q=0.5',
  }
});

const minify = require('html-minifier').minify;

const {
  extract
} = require('article-parser');
const extractor = require('article-extractor');

const defaultSanitizeHtml = () => {
  return {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'header', 'article', 'section', 'footer', 'figure', 'video' ]),
    allowedAttributes: {
      a: [ 'href', 'name' ],
      img: [ 'src', 'alt' ],
      video: [ 'src' ],
    },
  }
}

let base = {};
module.exports = base;

base.fetch = (link, callback) => {
  request({
    url: link,
    method: 'GET'
  }, (err, response, body) => {
    return callback(err, body);
  })
}

base.getRawContent = (link, hostInfo = {}, engine = {}, callback) => {
  if (NODE_ENV !== 'production') debug('hostInfo= %o', hostInfo);

  engine = engine || {};
  hostInfo = hostInfo || {};

  let NAME = 'default';

  let fetchEngine = base.fetch;

  if (engine.fetch) {
    debug('using fetch of engine')
    fetchEngine = engine.fetch;
  }

  let config = hostInfo.metadata || {};

  debug('host config= %o', config);

  // if (!config) return callback('ENOCONFIG');
  // if (!config.mainContentSelector) return callback('ENOMAINCONTENTSELECTOR');

  config.mainContentSelector = hostInfo.mainContentSelector || config.mainContentSelector;
  config.removeSelectors = config.removeSelectors || [];

  if (hostInfo && hostInfo.name) NAME = hostInfo.name;

  fetchEngine(link, (err, html) => {
    if (err) return callback('EFETCHLINK', err);

    // debug('html= %s', html);

    const $ = cheerio.load(html);

    debug('host %s : mainContentSelector= %s', hostInfo.website, config.mainContentSelector);

    let heroImageSelector = `${config.mainContentSelector} img`;
    let content = $(config.mainContentSelector);

    if ((!content || content.length == 0) && hostInfo.fallbackMainContent) {
      debug('use mainContentSelector not found content, using fallbackMainContent ...');

      for (let i=0; i < hostInfo.fallbackMainContent.length; i++) {
        let selector = hostInfo.fallbackMainContent[i];
        content = $(selector);

        if (content && content.length !== 0) {
          debug('found main content, use selector %s', selector);
          heroImageSelector = `${selector} img`;
          break;
        }
      }
    }

    if (!content || content.length == 0) {
      fatal('Can not parse link %s, please check', link);
      return callback(null, null);
    }

    $('script', content).remove();

    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
    }

    if (engine.cleanSpecial) {
      debug('go cleanSpecial ...');
      engine.cleanSpecial($, content);
    }

    // get hero Image
    let heroImage = null;
    // debug('selector hero image: %s', heroImageSelector);
    let imgs = $('img', content);

    if (imgs && imgs.length > 0) {
      debug('---> get hero image ...');
      heroImage = $(imgs[0]).attr('src');
    }

    // remove in config metadata
    for (let i=0; i < config.removeSelectors.length; i++) {
      let selector = config.removeSelectors[i];
      $(selector, content).remove();
      debug('remove selector %s', selector);
    }

    // remove in setup model
    if (hostInfo.removeSelectors) {
      for (let i=0; i < hostInfo.removeSelectors.length; i++) {
        let selector = hostInfo.removeSelectors[i];
        $(selector, content).remove();
        debug('remove selector %s', selector);
      }
    }

    // remove class and inline style
    $('*', content).each(function () {
      $(this).removeAttr('class');
      $(this).removeAttr('style');
      $(this).removeAttr('href');
      $(this).removeAttr('onclick');
      $(this).remove('script');
    });

    let contentStr = $(content).html();
    try {
      contentStr = contentStr.replace(/\n/g, ' ').replace(/\t/g, ' ');

      while (contentStr.indexOf('  ') > -1) {
        contentStr = contentStr.replace(/\s\s/g, ' ');
      }

      contentStr = contentStr.replace(/\>\s\</g, '><');
      contentStr = contentStr.trim();

      contentStr = minify(contentStr, {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeEmptyElements: true,

        decodeEntities: true,
        collapseInlineTagWhitespace: true,

        conservativeCollapse: true,
        html5: true,
        quoteCharacter: '\'',
        removeScriptTypeAttributes: true,
        useShortDoctype: true
      });
    } catch (ex) {
      fatal('minify err= %s', ex.toString());
    }

    debug('sanitize html ...');
    let optSanitize = Object.assign({}, defaultSanitizeHtml(), engine.optSanitizeHtml || {});
    contentStr = sanitizeHtml(contentStr, optSanitize);

    if (contentStr == null || contentStr == 'null' || contentStr.length == 0) {
      fatal('Can not parse link %s, please check', link);
      return callback(null, null);
    }

    let classStr = [];
    if (hostInfo && hostInfo.name) {
      classStr.push(`host-${hostInfo.name}`);
    }

    if (hostInfo && hostInfo.customClass && hostInfo.customClass.length > 0) {
      classStr = [...classStr, ...hostInfo.customClass];
    }

    classStr = classStr.join(' ');

    contentStr = `<div class="${classStr}">${contentStr}</div>`;

    if (NODE_ENV !== 'production') {
      debug('content= %s', contentStr);
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), contentStr);
    }

    let result = {
      rawHtml: contentStr,
      heroImage
    }

    debug('result= %o', result);

    return callback(null, result);
  })
}

let clean = (content) => {
  content = entities.decode(content);

  let $ = cheerio.load(content);

  // remove class and inline style
  $('*').each(function () {
    $(this).removeAttr('class');
    $(this).removeAttr('style');
    $(this).removeAttr('href');
    $(this).removeAttr('onclick');
    $(this).remove('script');
  });

  let contentStr = $.html();
  try {
    contentStr = contentStr.replace(/\n/g, ' ').replace(/\t/g, ' ');

    while (contentStr.indexOf('  ') > -1) {
      contentStr = contentStr.replace(/\s\s/g, ' ');
    }

    contentStr = contentStr.replace(/\>\s\</g, '><');
    contentStr = contentStr.trim();

    contentStr = minify(contentStr, {
      removeComments: true,
      removeCommentsFromCDATA: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeEmptyElements: true,

      decodeEntities: true,
      collapseInlineTagWhitespace: true,

      conservativeCollapse: true,
      html5: true,
      quoteCharacter: '\'',
      removeScriptTypeAttributes: true,
      useShortDoctype: true
    });
  } catch (ex) {
    fatal('minify err= %s', ex.toString());
  }

  debug('sanitize html ...');
  let optSanitize = Object.assign({}, defaultSanitizeHtml());
  contentStr = sanitizeHtml(contentStr, optSanitize);

  return contentStr;
}

base.userArticleParse = (link, callback) => {
  async.parallel({
    article_parse: (next) => {
      extract(link).then((article) => {
        /*
        {
          title:
           'TP.HCM thanh tra toàn diện quản lý đất đai, trật tự xây dựng ở H.Bình Chánh',
          alias:
           'tp-hcm-thanh-tra-toan-dien-quan-ly-dat-dai-trat-tu-xay-dung-o-h-binh-chanh-1575302537045-nHpiBYE16n',
          url:
           'https://thanhnien.vn/thoi-su/tphcm-thanh-tra-toan-dien-quan-ly-dat-dai-trat-tu-xay-dung-o-hbinh-chanh-1154790.html',
          canonicals:
           [ 'https://thanhnien.vn/thoi-su/tphcm-thanh-tra-toan-dien-quan-ly-dat-dai-trat-tu-xay-dung-o-hbinh-chanh-1154790.html',
             'https://thanhnien.vn/content/OTA1NTg1.html' ],
          description:
           'Thanh tra TP.HCM thanh tra toàn diện công tác quản lý đất đai, trật tự xây dựng ở H.Bình Chánh từ năm 2016 đến nay do địa phương này để xảy ra nhiều vi...',
          content:
           '<html><body><div><p>Thời kỳ thanh tra từ các năm 2016, 2017, 2018, 2019 và những vấn đề phát sinh có liên quan trước hoặc sau thời điểm thanh tra, xét thấy cần thiết vẫn làm rõ để có cơ sở kết luận.</p><p>Thời gian thanh tra trong vòng 45 ngày làm việc kể từ ngày công bố.</p><p>Việc Thanh tra TP.HCM lập đoàn thanh tra toàn diện nói trên xuất phát từ chỉ đạo của lãnh đạo UBND TP.HCM.  Nhiều năm qua, H.Bình Chánh là điểm nóng về vi phạm trật tự xây dựng ở TP.HCM khi tình trạng <a href="https://thanhnien.vn/tin-tuc/xay-dung-khong-phep.html">xây dựng không phép</a>, sai phép thường xuyên xảy ra.</p><p>Trước đó ngày 23.8, Ủy ban Kiểm tra Thành ủy TP.HCM thông báo kết quả kiểm tra khi có dấu hiệu vi phạm, kiểm điểm, xem xét thi hành kỷ luật đối với tổ chức đảng và đảng viên vi phạm tại H.Bình Chánh.</p><p>Theo đó, Ban Chấp hành Đảng bộ, Ban Thường vụ Huyện ủy Bình Chánh đã quyết định thi hành kỷ luật đảng bằng hình thức khiển trách đối với 2 tổ chức đảng: Đảng ủy xã Vĩnh Lộc A, nhiệm kỳ 2015 - 2020  và Đảng ủy Đội Thanh tra địa bàn huyện nhiệm kỳ 2015 - 2020 (giai đoạn từ tháng 9.2016 đến tháng 3.2019).</p><p>Nhiều cán bộ, <a href="https://thanhnien.vn/thoi-su/viec-lam/">công chức</a> và viên chức ở H.Bình Chánh liên quan đến vi phạm trật tự xây dựng ở H.Bình Chánh thời kỳ này bị kỷ luật từ khiến trách đến cảnh cáo.</p><p>Công an H.Bình Chánh đã khởi tố vụ án “Lợi dụng chức vụ, <a href="https://thanhnien.vn/thoi-su/quyen-duoc-biet/">quyền hạn</a> trong khi thi hành công vụ”và đang củng cố hồ sơ để khởi tố bị can đối với một số cán bộ có liên quan.</p><table><tbody><tr><td><div><div><div><p>Chủ tịch UBND H.Bình Chánh Trần Phú Lữ vừa có báo cáo UBND TP.HCM về kết quả xử lý tổ hợp công trình xây dựng vi phạm trật tự xây dựng tại “<a href="https://thanhnien.vn/tai-chinh-kinh-doanh/cuong-che-cong-trinh-tram-chim-resort-xay-dung-khong-phep-1144665.html">Gia Trang quán – Tràm Chim Resort”</a> ở xã Tân Quý Tây (Bình Chánh).</p><p>Liên quan đến vụ việc, UBND H.Bình Chánh đang thành lập đồng kỉ luật cán bộ, công chức UBND xã Tân Quý Tây, Phòng Quản lý đô thị H.Bình Chánh và họp hội đồng xử lý theo quy định.</p><p>Tuy nhiên do vụ việc kéo dài, phức tạp, nhiều cán bộ, công chức đã nghỉ việc, chuyển công tác, nhiều việc cần xác minh thêm nên UBND H.Bình Chánh kiến nghị UBND TP.HCM gia hạn thời gian xử lý kỉ luật cán bộ, công chức có liên quan.</p></div></div></div></td></tr></tbody></table><p></p></div></body></html>',
          image:
           'https://image.thanhnien.vn/1080/uploaded/trunghieu/2019_12_02/img_7067_onzy_heyy.jpg',
          author: '',
          source: 'Báo Thanh Niên',
          domain: 'thanhnien.vn',
          publishedTime: '2019-12-02T19:28:54+07:00',
          duration: 86
         }
        */

        let contentStr = clean(article.content)

        if (contentStr == null || contentStr == 'null' || contentStr.length == 0) {
          fatal('Can not parse link %s, please check', link);
        } else {
          article.content = entities.decode(contentStr);
        }

        article.content = `<div class="default-ap">${article.content}</div>`;

        debug('article= %o', article);

        return next(null, article);
      }).catch((err) => {
        debug('use article-parser err= %s', err);

        // return next(err);
        return next(null);
      });
    },

    article_extractor: (next) => {
      extractor.extractData(link, (err, article) => {
        if (err) return next(null);

        let contentStr = clean(article.content)

        if (contentStr == null || contentStr == 'null' || contentStr.length == 0) {
          fatal('Can not parse link %s, please check', link);
        } else {
          article.content = entities.decode(contentStr);
        }

        article.content = `<div class="default-ae">${article.content}</div>`;

        return next(null, article);
      });
    }
  }, (err, result) => {
    debug('result= %s', JSON.stringify(result));

    let article = result.article_parse || result.article_extractor;

    if (result.article_extractor
      && result.article_extractor.content
      && result.article_extractor.content.length > article.content.length) {
      article.content = result.article_extractor.content;
    }

    return callback(null, article);
  })
}