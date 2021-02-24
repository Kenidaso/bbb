const async = require('async');
const cheerio = require('cheerio');
const _ = require('lodash');
const request = require('request').defaults({
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'
  }
});

const pageListPokemon = 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number';

let normalize = (str) => str.replace(/\n/g, '').trim()

let GENS = {};
let MOVE = [];

async.series({
  listPkm: (next) => {
    request({
      url: pageListPokemon,
      method: 'GET'
    }, (err, response, body) => {
      let $ = cheerio.load(body);

      let gens = $('#outercontentbox table[align="center"]');

      let result = {};

      _.forEach(gens, (gen, index) => {
        let genName = `Generation_${index + 1}`;

        result[genName] = result[genName] || {}

        let pokemons = $('tr', gen);
        let pkmLength = pokemons.length - 1;

        for (let i = 1; i < pkmLength; i++) {
          let tds = $('td', pokemons[i]);

          let kdex = $(tds[0]).text();
          kdex = normalize(kdex);

          let ndex = $(tds[1]).text();
          ndex = normalize(ndex);

          let name = $(tds[2]).text();
          name = normalize(name);

          let urlBulbapedia = $('a', tds[2]).attr('href');
          urlBulbapedia = `https://bulbapedia.bulbagarden.net${urlBulbapedia}`;

          let urlImage = $('img', pokemons[i]).attr('src');
          urlImage = `https:${urlImage}`;

          let type = [normalize($(tds[3]).text())];
          if (tds[4]) type.push(normalize($(tds[4]).text()));

          let pkm = {
            kdex,
            ndex,
            name,
            urlBulbapedia,
            urlImage,
            type
          }

          result[genName][name.toLowerCase()] = pkm;
        }
      })

      GENS = result;

      return next(null, result);
    })
  },

  listMove: (next) => {

  }
}, (err, result) => {
  console.log('result=', JSON.stringify(result, null, 2));
})
