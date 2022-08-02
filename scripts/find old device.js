db.getCollection('devices').aggregate([
    {
        $match: {
            fingerprint: '48ca5b8b470d2729b3a8ff02c0cebb1e'
        }
    },
    
    {
      $graphLookup: {
         from: "devices",
         startWith: "$prevFingerprint",
         connectFromField: "prevFingerprint",
         connectToField: "fingerprint",
         as: "oldDevices"
      }
   }
])