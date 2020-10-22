module.exports = {
  apps : [{
    name: 'news-api',
    script: 'keystone.js'
  }, {
    name: 'rss',
    script: 'npm run rss'
  }, {
    name: 'task_queue',
    script: 'npm run task_queue'
  }]
};
