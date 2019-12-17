const assert = require('assert');

const cheerio = require('cheerio');
const log = require('debug')('Test-WebClipper');

const clipper = require('./engines/webClipper');

const markupTest = `
  <ul id="fruits">
    <li class="apple">Apple</li>
    <li class="orange">Orange</li>
    <li class="pear">Pear</li>
  </ul>
`;


let indexOf = () => {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
}

let wrap = () => {
  describe('#wrap()', function() {
    it('should wraped with div have special classes', function() {
      let specialClasses = ['default', 'default-1'];

      let rawHtml = clipper.wrapWithSpecialClasses(markupTest, specialClasses);

      log('rawHtml= %s', rawHtml);

      const $ = cheerio.load(rawHtml);
      let rootClass = $('#fruits').parent().attr('class');

      assert.equal(rootClass, specialClasses.join(' '));
    });
  });
}


describe('Web Clipper', function () {
  wrap();
});