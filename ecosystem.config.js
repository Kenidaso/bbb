module.exports = {
  apps : [{
    name: 'news-api',
    script: 'keystone.js',
    out_file: '/logs/api'
  }, {
    name: 'rss',
    script: 'npm run rss',
    out_file: '/logs/worker_rss'
  }, {
    name: 'task_queue',
    script: 'npm run task_queue',
    out_file: '/logs/worker_task'
  }]
};
