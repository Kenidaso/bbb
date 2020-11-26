db.getCollection('feeds').aggregate([
    {
        $project: {
            link: {
                $split: [ "$link", "/" ]
            }
        }
    },
    {
        $project: {
            link: {
                $arrayElemAt: [ '$link', 2 ]
            }
        }
    },
    {
        $group: {
            _id: '$link',
            count: { $sum: 1 }
        }
    },
    {
        $sort: {
            count: -1
        }
    },
    {
        $out: 'aggregate_results'
    }
]).forEach(function (doc) {
    print(doc._id, doc.count)
})