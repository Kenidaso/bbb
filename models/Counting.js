const keystone = require('keystone');
const Types = keystone.Field.Types;

const Counting = new keystone.List('Counting', {
  map: { name: 'name' },
  track: {
    createdAt: true,
    updatedAt: true,
  },
  defaultSort: '-updatedAt'
});

Counting.add({
  name: { type: String, reqired: true, initial: true, index: true },
  description: { type: String, initial: true },
  sequenceValue: { type: Number, reqired: true, default: 0, noedit: true },
});

Counting.schema.static('sequence', function (name, callback) {
  Counting.model.findOneAndUpdate({ name}, {
    $inc: {
      sequenceValue: 1
    }
  }, {
    new: true
  }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count.sequenceValue);
  })
})

Counting.register();
