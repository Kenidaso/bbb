{
  "category": 1,
  "publishDate": -1
}

category_1_publishDate_-1

db.getCollection('feeds').createIndex({
  "category": 1,
  "publishDate": -1
}, {
	"name": "category_1_publishDate_-1",
	"background": true
})