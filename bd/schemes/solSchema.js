const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  previousSignature: { type: String },
});

module.exports = mongoose.model('Sol', schema, 'sol');
