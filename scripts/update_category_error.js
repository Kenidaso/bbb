db.getCollection('feeds').update({
    "category" : []
}, {
    $set: {
        "category" : [
            ObjectId("5dadcf1874242108b47e46a5")
        ]
    }
}, {
    new: true,
    multi: true
})