const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  hash: { type: String, required: true },
  timeStamp: { type: Date, default: Date.now, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  details: { type: Object, required: true },
});

module.exports = mongoose.model('Transactions', schema, 'transactions');
