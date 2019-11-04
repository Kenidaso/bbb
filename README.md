# import

mongoimport -h localhost -d sk-news-backend -c feeds --file db_export/feeds.json && mongoimport -h localhost -d sk-news-backend -c hosts --file db_export/hosts.json && mongoimport -h localhost -d sk-news-backend -c ksusers --file db_export/ksusers.json && mongoimport -h localhost -d sk-news-backend -c rsses --file db_export/rsses.json && mongoimport -h localhost -d sk-news-backend -c usersearches --file db_export/usersearches.json

# export

mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c feeds -u admin -p 123456qwerty -o db_export/feeds.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c hosts -u admin -p 123456qwerty -o db_export/hosts.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c ksusers -u admin -p 123456qwerty -o db_export/ksusers.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c rsses -u admin -p 123456qwerty -o db_export/rsses.json
mongoexport -h ds259245.mlab.com:59245 -d sk-news-backend -c usersearches -u admin -p 123456qwerty -o db_export/usersearches.json