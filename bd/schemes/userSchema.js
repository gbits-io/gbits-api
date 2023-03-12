const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  status: { type: String, required: true },
  name: { type: String, required: true },
  email: {
    type: String,
    required: [true, 'User email required'],
    unique: 'The email already exists',
    validator: (value) => /^\S+@\S+\.\S+$/.test(value),
    message: (props) => `${props.value} is not a valid email!`,
  },
  balance: {
    type: Number,
    required: true,
    get: (v) => (v / 100).toFixed(2),
    set: (v) => v * 100,
  },
  password: { type: String, required: true },
  currency_code: { type: String, required: true },
  account_update_timestamp: { type: String },
  account_created_timestamp: { type: String },
  recipients: { type: Array },
  transactionHistory: { type: Array },
  quota: { type: Number },
  ref_quota: { type: Number },
  referrer: { type: String },
  referrer_payment: { type: Boolean },
  referrals: { type: Array },
}, {
  toJSON: { getters: true },
});

module.exports = mongoose.model('User', schema);
