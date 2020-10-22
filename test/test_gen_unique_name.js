const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey

const shortName = uniqueNamesGenerator({
  dictionaries: [colors, animals], // colors can be omitted here as not used
  length: 2
});

console.log('-->', randomName);
console.log('-->', shortName);