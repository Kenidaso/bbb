
module.exports = function (agenda) {
  agenda.define('notify feed', async job => {
    console.log('--> notify feed for user');
  });
};