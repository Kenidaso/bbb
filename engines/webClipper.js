const cheerio = require('cheerio');
const _ = require('lodash');

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const sanitizeHtml = require('sanitize-html');
const minify = require('html-minifier').minify;
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const striptags = require('striptags');

const debug = require('debug')('WebClipper');

const { JSDOM } = require('jsdom');
const Readability = require('@web-clipper/readability');

const { extract } = require('article-parser');

let clipper = {};
module.exports = clipper;

const attributesToKeep = [
  'src',
  'href',
  'target'
];

const shareUrls = [
  'twitter.com/intent',
  'facebook.com/sharer'
];

const elementsToRemove = [
  'script',
  'header',
  'footer'
];

const blacklistRegex = /ads|social|comment/i;

const metatags = [
  'description',
  'twitter:description',
  'og:description'
];

const titleMetatags = [
  'og:title',
  'twitter:title'
];

const sitenameMetatags = [
  'og:site_name',
  'twitter:domain'
];

const bodyTags = 'p strong em ol ul h1 h2 h3 h4 h5 h6 code pre'.toUpperCase().split(' ');

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

/**
 * Removes all attributes from a given HTML string, except for the ones we're still interested in, such as img src,
 * anchor hrefs, ...
 *
 * @param rawHtml
 */
clipper.removeAttributes = (rawHtml) => {
	const $ = cheerio.load(rawHtml);

  $('*').each(function () {
    let element = this;
    let attributes = _.chain(element.attribs)
      .keys()
      .difference(attributesToKeep)
      .value();

    attributes.forEach(function (attribute) {
      $(element).removeAttr(attribute);
    });
  });

  return $.html();
}

/**
 * Removes all elements that contain any social keywords.
 *
 * @param rawHtml
 */
clipper.removeSocialElements = (rawHtml) => {
  const $ = cheerio.load(rawHtml);

  $('*').each(function () {
    let text = $(this).text().toLowerCase();
    let possibleSocialElement = text.indexOf('share on') > -1;

    if (possibleSocialElement) {
      let anchors = $(this).find('a');
      anchors.each(function () {
        let $anchor = $(this);
        let href = $anchor.attr('href');

        _.each(shareUrls, function (shareUrl) {
          if (href.indexOf(shareUrl) > -1) {
            $anchor.remove();
          }
        });
      });
    }
  });

  return $.html();
}

/**
 * Removes all elements that are used for navigation (such as 'to top' links, article tags, ...)
 *
 * @param rawHtml
 */
clipper.removeNavigationalElements = (rawHtml, host) => {
  const $ = cheerio.load(rawHtml);

  // Filter out 'back to top' links
  $('a').filter(function () {
    let hasTopInText = $(this).text().toLowerCase().indexOf('top') > -1;
    let hasHashInHref = $(this).attr('href').indexOf('#') > -1;
    return hasTopInText && hasHashInHref;
  }).remove();

  // Filter out any links that have the `rel="tag"` attribute, or link back to the same host with 'tag' in the URL.
  $('a').each(function () {
    let relTag = $(this).attr('rel');
    let href = $(this).attr('href');

    let isRelTag = relTag === 'tag';
    let isPartOfList = $(this).parents('ul').length > 0;
    let containsUrlWithTag = href.indexOf(host) > -1 && href.indexOf('tag') > -1;

    if (isRelTag || containsUrlWithTag) {
      if (isPartOfList) {
        $(this).parents('ul').remove();
      }
      else {
        $(this).remove();
      }
    }

    // Remove any other elements with a `tags` class.
    $('.tags').remove();
  });

  return $.html();
}

/**
 * Removes all empty elements.
 *
 * @param rawHtml
 */
clipper.removeEmptyElements = (rawHtml) => {
  const $ = cheerio.load(rawHtml);

  $('*').each(function () {
    let children = $(this).children().length;
    let content = $(this).text().replace(/\t|\s/g, '');
    let isImage = $(this)[0].tagName === 'img';

    if (!children && !content && !isImage) {
      $(this).remove();
    }
  });

  return $.html();
}

/**
 * Cleans up parsed HTML formatting by removing newlines.
 *
 * @param rawHtml
 * @returns {string}
 */
clipper.removeNewline = function (rawHtml) {
  rawHtml = rawHtml
    .replace(/\n/g, '')
    .trim();

  return rawHtml;
};

/**
 * Prepares a raw HTML string by removing any unnecessary items, like scripts, headers and footers. Also tries to remove
 * any elements that are most likely uninteresting (comments, ads, social stuff, ...).
 *
 * @param rawHtml
 */
clipper.prepareForParse = (rawHtml) => {
  const $ = cheerio.load(rawHtml);

  let $body = $('body');

  elementsToRemove.forEach(function (elementToRemove) {
    $body.find(elementToRemove).remove();
  });

  $body.find('*').filter(function () {
    let idAndClasses = $(this).attr('id') + $(this).attr('class');
    if (idAndClasses) {
      return idAndClasses.match(blacklistRegex);
    } else {
      return false;
    }
  }).remove();

  return $.html();
}

/**
 * Tries to get the author from three sources: the `<meta name="author">` tag, any anchors with the `rel="author"`
 * attribute or, as a last resort, the text value from a DOM element with an `author` class.
 *
 * @param html
 * @returns {string}
 */
clipper.getAuthor = (html) => {
  const $ = cheerio.load(html);

  const metatagAuthor = $('meta[name="author"]').attr('content');
  const semanticAuthor = $('*[rel="author"]').eq(0).text();
  const classAuthor = $('.author').eq(0).text();

  return metatagAuthor || semanticAuthor || classAuthor;
}

/**
 * Gets the summary based on social metatags that are found in most blogs for sharing purposes.
 *
 * @param rawHtml
 * @returns {string}
 */
function getSummaryFromMetatags (rawHtml) {
  const $ = cheerio.load(rawHtml);

  for (let i = 0; i < metatags.length; i++) {
    let metatag = metatags[i];
    let metaName = $('meta[name="' + metatag + '"]').attr('content');
    let metaProperty = $('meta[property="' + metatag + '"]').attr('content');

    if (metaName || metaProperty) {
      return metaName || metaProperty;
    }
  }
}

/**
 * Gets the summary by retrieving the article's content and returning the first interesting paragraph. Most definitely
 * not a silver bullet here, but at least it gets the job done in case there's no better option.
 *
 * @param rawHtml
 * @returns {string}
 */
function getSummaryFromContent (content) {
  const $ = cheerio.load(content);

  let interestingParagraphs = $('p').filter(function () {
    return $(this).text().length > 25;
  });

  return $(interestingParagraphs).eq(0).text();
}

clipper.getDescription = function (rawHtml, content) {
  let summaryFromMetags = getSummaryFromMetatags(rawHtml);

  if (summaryFromMetags) {
    return summaryFromMetags;
  } else {
    return getSummaryFromContent(content);
  }
}

/**
 * Removes the site's name from the article title, and keeps removing the last character in the title until it hits
 * an alphabetic character. This is done to remove any delimiters that are usually used to add the site's name to the
 * article title (for example: This Is An Article | WIRED).
 *
 * @param articleTitle
 * @param siteName
 * @returns {string}
 */
function removeSiteNameFromTitle(articleTitle, siteName) {
  articleTitle = articleTitle.replace(siteName, '');
  let lastChar = articleTitle.charAt(articleTitle.length - 1);

  while (!/[a-zA-Z|?|!|.]/.test(lastChar)) {
    articleTitle = articleTitle.substring(0, articleTitle.length - 1);
    lastChar = articleTitle.charAt(articleTitle.length - 1);
  }

  return articleTitle;
}

/**
 * Gets the site name based on metatags.
 *
 * @param rawHtml
 * @returns {string}
 */
function getSiteName(rawHtml) {
  let $ = cheerio.load(rawHtml);

  for (let i = 0; i < sitenameMetatags.length; i++) {
    let metatag = sitenameMetatags[i];
    let sitename = $('meta[property="' + metatag + '"]').attr('content');

    if (sitename) {
      return sitename;
    }
  }
}

/**
 * Gets the article's title from metatags used for social sharing.
 *
 * @param rawHtml
 * @returns {string}
 */
function getTitleFromMetaTags (rawHtml) {
  let $ = cheerio.load(rawHtml);
  let title;
  let siteName = getSiteName(rawHtml);

  for (let i = 0; i < titleMetatags.length; i++) {
    let metatag = titleMetatags[i];
    title = $('meta[property="' + metatag + '"]').attr('content');

    if (title) {
      break;
    }
  }

  if (siteName) {
    title = removeSiteNameFromTitle(title, siteName);
  }

  return title;
}

/**
 * Gets the article name from the window's title.
 *
 * @param rawHtml
 * @returns {string}
 */
function getTitleFromWindowTitle (rawHtml) {
  let $ = cheerio.load(rawHtml);
  let title = $('title').text();
  let siteName = getSiteName(rawHtml);

  if (siteName) {
    title = removeSiteNameFromTitle(title, siteName);
  }

  return title;
}

clipper.getTitle = (rawHtml) => {
  return getTitleFromMetaTags(rawHtml) || getTitleFromWindowTitle(rawHtml);
}

/**
 * Gets a likely candidate for the article's content based on a DOM's element 'article score' (based on Readability's
 * implementation at https://code.google.com/p/arc90labs-readability/source/browse/branches/haiti/js/readability.js).
 * This algorithm assumes that the article is written in `<p>` tags. If it's not, it will return `undefined`.
 *
 * TODO: add additional score parameters based on paragraph length, comma occurrences and so on (see Readability above)
 *
 * @param rawHtml
 * @returns {*}
 */
function getLikelyCandidate (rawHtml) {
  let $ = cheerio.load(rawHtml);
  let $body = $('body');
  let candidates = [];

  $body.find('p').each(function () {
    let paragraph = $(this);
    let parentNode = $(this).get(0).parentNode;

    if (!parentNode.extracted) {
      parentNode.extracted = {
        score: 0
      };
      candidates.push(parentNode);
    }

    let paragraphLength = paragraph.text().length;
    parentNode.extracted.score += paragraphLength;
  });

  if (candidates.length > 0) {
    let sortedByScore = _.sortBy(candidates, function (candidate) {
      return candidate.extracted.score;
    }).reverse();

    return $(sortedByScore[0]).html();
  }
}

/**
 * Loops over every node in the DOM and checks for its own text length. We try to pick the one with the longest length
 * in the hopes that this will actually be content. This is merely used as a fallback and probably doesn't work half the
 * time. This should probably be revisited some time in the future.
 *
 * This implementation was mostly tested on Paul Graham's essays, so I'm not sure if this would work reliably anywhere
 * else. Let's hope people actually use paragraph elements to write an article so we don't even need to use this
 * janky thing.
 *
 * @param rawHtml
 * @returns {string}
 */
function getContentByLongestLength(rawHtml) {
  debug('Getting longest length');

  let longestTextLength = 0;
  let $longest = null;
  let $ = cheerio.load(rawHtml);

  $('*').each(function () {
    let textLength = $(this).clone().children().remove().end().text().length;
    if (textLength > longestTextLength) {
      $longest = $(this);
      longestTextLength = textLength;
    }
  });

  let content = $longest.html();

  // Replace any existing newlines with a space
  content = content.replace(/\r?\n|\r/g, ' ');

  // Replace any multiple breaks with newlines
  content = content.replace(/(<br\s?\/?>)\1+/g, '\n');

  // Replace any single breaks with newlines
  content = content.replace(/(<br\s?\/?>)/g, '\n');

  // Replace all paragraphs divided by newlines with actual paragraphs
  let paragraphs = content.split('\n');

  let contentInParagraphs = paragraphs.map(function (paragraph) {
    return '<p>' + paragraph + '</p>';
  }).join('');

  return contentInParagraphs;
}

clipper.cleanAfterParsing = (rawHtml, host) => {
	rawHtml = clipper.removeAttributes(rawHtml);
  rawHtml = clipper.removeSocialElements(rawHtml);
  rawHtml = clipper.removeNavigationalElements(rawHtml, host);
  rawHtml = clipper.removeEmptyElements(rawHtml);
  rawHtml = clipper.cleanFormatting(rawHtml);

  return rawHtml;
}

clipper.getArticleContent = (rawHtml, host) => {
  let content = getLikelyCandidate(rawHtml) || getContentByLongestLength(rawHtml);
  content = cleanAfterParsing(content, host);
  return content;
}

clipper.readability = (link, html) => {
	let doc = new JSDOM(html, {
	  url: link,
	});
	let reader = new Readability(doc.window.document);
	let article = reader.parse();

	return article;
}

const walk = _ => {
  if (!_.childNodes) {
    return {
      count: 0,
      res: { '#text' : 0 }
    }
  }

  const res = Array
    .from(_.childNodes)
    .filter(_ => _.type !== 'comment')
    .map(_ => {
      // console.log(_.type, _.name);
      // return 'DIV'
      return _.type === 'text' ? '#text' : _.name.toUpperCase()
    })
    .reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc
    }, { '#text': 0 })

  const body = {
    count: _.childNodes.length,
    res,
  }

  return body;
}

const build = (parent, res = []) => {
  if (!parent || !parent.childNodes) {
    return res;
  }

  Array
    .from(parent.childNodes)
    .map(_ => {
      const result = {
        textLength: (_.innerText || '').length,
        parent,
        root: _,
        body: walk(_),
        text: 0,
      };

      result.text = result.body.res['#text'];
      result.value = value(result);

      // if (result.value) console.log(result.value);

      res.push(result)
      build(_, res);
    });

  return res;
};

const value = (item) => bodyTags.reduce((acc, curr) => {
  if (item.body.res[curr]) acc += item.body.res[curr];
  return acc;
}, 0);

/**/
clipper.parseArticle = (html) => {
  const $ = cheerio.load(html);

  const res = [];

  if ($('body').length === 0) {
    $.children().wrapAll('<body>');
  }

  build($('body')[0], res);

  const valueSorted = res.sort((a, b) => {
    return b.value - a.value;
  }).filter(_ => _.value);

  const title = $('title').text();

  const turndownService = new TurndownService();
  turndownService.use(turndownPluginGfm.tables);
  let markdown = turndownService.turndown($(valueSorted[0].root).html());

  if (!(/^#\s.*/.test(markdown))) {
    markdown = `# ${title}\n\n${markdown}`;
  }

  const content = striptags(
    markdown,
    [],
    ''
  ); //.replace(/\n{3,}/g, '\n\n');

  return {
    content,
    title,
  }
}

clipper.extract = async (html) => {
  let article = null;
  try {
    article = await extract(html);
  } catch {
  }

  return article;
}