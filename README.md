# import

mongoimport -h localhost -d sk-news-backend -c feeds --file db_export/feeds.json && mongoimport -h localhost -d sk-news-backend -c hosts --file db_export/hosts.json && mongoimport -h localhost -d sk-news-backend -c ksusers --file db_export/ksusers.json && mongoimport -h localhost -d sk-news-backend -c rsses --file db_export/rsses.json && mongoimport -h localhost -d sk-news-backend -c usersearches --file db_export/usersearches.json

# export

mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c feeds -u admin -p 123456qwerty -o db_export/feeds.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c hosts -u admin -p 123456qwerty -o db_export/hosts.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c ksusers -u admin -p 123456qwerty -o db_export/ksusers.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c rsses -u admin -p 123456qwerty -o db_export/rsses.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c usersearches -u admin -p 123456qwerty -o db_export/usersearches.json

# run worker
NODE_ENV=production LIMIT_RSS=5 LIMIT_NEWS=5 node workers/from_rss && NODE_ENV=production node workers/from_topic_gg_news_v2 && NODE_ENV=production node workers/fix_originLink_article && NODE_ENV=production LIMIT_PAGE=10 LIMIT_NEWS=30 node workers/from_html

redis-cli -u redis://user:9nSpQH7B3aRjcTClWjOJqVOINX0AoDRH@redis-16930.c62.us-east-1-4.ec2.cloud.redislabs.com:16930 "monitor" | grep "set.*ggn:saved"

redis-cli -u redis://user:9nSpQH7B3aRjcTClWjOJqVOINX0AoDRH@redis-16930.c62.us-east-1-4.ec2.cloud.redislabs.com:16930 --raw keys *ggn:link* | xargs redis-cli -u redis://user:9nSpQH7B3aRjcTClWjOJqVOINX0AoDRH@redis-16930.c62.us-east-1-4.ec2.cloud.redislabs.com:16930 del

# cmd logs
heroku logs -t -a nw-b01 --dyno ggn
-- heroku logs -t -a nw-b01 --dyno rawhtml_all
heroku logs -t -a sk-news-backend --dyno baomoi_v2
heroku logs -t -a sk-news-backend --dyno rawhtml_all

ssh sgp-backend "pm2 logs rawhtml"
ssh sgp-backend "pm2 logs worker-rss"
ssh sgp-backend "pm2 logs news-backend"

ssh news-mongodb-sgp "pm2 logs rawhtml"

heroku logs -t -a sk-news-backend --dyno ggn

pm2 --name news-api start keystone.js
pm2 --name baomoi start "npm run baomoi"
pm2 --name rss start "npm run rss"
pm2 --name task_queue start "npm run task_queue"
pm2 --name news-web start "npm start"
