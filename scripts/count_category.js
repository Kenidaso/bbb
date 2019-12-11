db.getCollection('feeds').aggregate([
    {
        $project: {
            category: "$category"
        }
    },
    {
        $unwind: "$category"
    },
    {
        $group: {
            _id: '$category',
            count: { $sum: 1 }
        }
    },
    {
        $sort: {
            count: -1
        }
    }
])