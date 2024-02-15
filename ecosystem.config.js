module.exports = {
  apps : [{
    name: 'news-api',
    script: 'keystone.js',
    // out_file: '/root/.pm2/logs/api.log'
  },
  {
    name: 'rss',
    script: 'npm run rss',
    // out_file: '/root/.pm2/logs/worker_rss.log'
  }, 

  {
    name: 'rawhtml',
    script: 'npm run rawhtml',
    // out_file: '/root/.pm2/logs/worker_rawhtml.log'
  },

  {
    name: 'task_queue',
    script: 'npm run task_queue',
    // out_file: '/root/.pm2/logs/worker_task_queue.log'
  },
  // {
  //   name: 'task_queue',
  //   script: 'npm run task_queue',
    // out_file: '/root/.pm2/logs/worker_task.log'
  // }
  ]
};
