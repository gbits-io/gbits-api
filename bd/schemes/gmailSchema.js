const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  previousHistoryId: { type: Number },
});

module.exports = mongoose.model('Gmail', schema, 'gmail');
