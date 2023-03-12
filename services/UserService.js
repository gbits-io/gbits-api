/* eslint-disable class-methods-use-this */
require('dotenv').config();

const crypto = require('crypto');

const mongoose = require('mongoose');

const { intervalToDuration, formatDuration, format } = require('date-fns');

const User = require('../bd/schemes/userSchema');

const config = require('../config.json');

module.exports = class UserService {
  constructor(email, id) {
    this.initEmail = email;
    this.initID = id;
  }

  /**
 * @param {string}  type - regular/smtp
 * @return {string} - success message
 */
  async init(type) {
    console.log('User Init start');
    let user;

    try {
      if (this.initID) {
        user = await User.findById(this.initID);
      } else {
        user = await User.findOne({
          email: this.initEmail,
        });
      }
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    if (!user && type === 'smtp') {
      console.error('User not found!');
      return null;
    } if (!user && type !== 'smtp') {
      console.error('User not found!');
      throw new Error('User not found!');
    }

    this.user = user;

    return this;
  }

  /**
 * @param {string} emailOpponent opponent's address
 * @param {number} amount
 * @param {string} message
 * @param {object} today Date object
 * @param {string} mongooseTypesObjectId
 * @param {string} method outgoing/incoming
 * @param {string} trigger smtp/amp/api
 * @return {string} - success message
 */

  async userAddTransactionToHistory(
    emailOpponent,
    amount,
    message,
    today,
    mongooseTypesObjectId,
    transactionHash,
    method,
    trigger,
  ) {
    console.log('userAddTransactionToHistory start');

    const timeStamp = today;
    const date = format(today, config.format_date);
    const time = format(today, config.format_time);

    const messageData = message.length > 200 ? `${message.substring(0, 200)}...` : message;

    const { user } = this;

    try {
      await user.update(
        {
          $push: {
            transactionHistory: {
              $each: [
                {
                  id: mongooseTypesObjectId,
                  hash: transactionHash,
                  timeStamp,
                  date,
                  time,
                  direction: method,
                  details: {
                    trigger,
                    amount,
                    sender: method === 'outgoing' ? user.email : emailOpponent,
                    recipient: method === 'outgoing' ? emailOpponent : user.email,
                    message: messageData,
                    url: `https://www.gbits.io/explorer/#${mongooseTypesObjectId}`,
                  },
                },
              ],
              $position: 0,
            },
          },
        },
        { new: true },
      );
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return 'Success! Transaction was added to User History.';
  }

  /**
 * @param {string} - email address
 * @param {string} - email address
 * @return {string} - success message
 */

  async userUpdateAMPRecipientsList(recipientEmail) {
    console.log('userUpdateAMPRecipientsList start');

    const { user } = this;
    const recipientsArray = this.user.recipients;

    if (recipientsArray.find((i) => i.email === recipientEmail)) {
      return 'Recipient email already exist in the AMPRecipientsList';
    }

    try {
      await user.updateOne({ $push: { recipients: { email: recipientEmail } } });
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return 'Success! Recipient email was added to AMPRecipientsList.';
  }

  /**
 * @param {string} userEmail - user email
 * @param {number} amount - transfer amount
 * @param {string}  method - increase/decrease
 * @return {string} - success message
 */

  async userUpdateBalance(amount, method) {
    console.log('userUpdateBalance start');

    const { user } = this;

    try {
      if (method === 'increase') {
        await user.updateOne({ $inc: { balance: +amount } }, { new: true });
      } else if (method === 'decrease') {
        await user.updateOne({ $inc: { balance: -amount } }, { new: true });
        await user.updateOne({ $inc: { quota: -1 } }, { new: true });
      }
    } catch (error) {
      console.error(error.message);
      throw new Error(error.message);
    }

    return 'Success! The balance is updated.';
  }

  /**
 * @param {string} userEmail - user email
 * @param {number} amount - transfer amount
 * @param {string}  type - regular/smtp
 * @return {string} - success message
 */

  async userCheckBalance(amount, type) {
    console.log('userCheckBalance start');

    const { balance } = this.user;

    if (+amount > balance) {
      if (type === 'smtp') {
        return null;
      }

      throw new Error('Transfer error! The balance is too low.');
    }

    return 'Success! The balance is enough';
  }

  /**
 * @param {string} type smtp/regular/null
 * @return {string} - success message
 */
  async userCheckQuota(type) {
    console.log('userCheckQuota start');

    const { quota } = this.user;

    const today = new Date();
    const tomorrow = today.setUTCHours(24, 0, 0, 0);

    if (quota <= 0) {
      const duration = intervalToDuration({
        start: new Date().getTime(),
        end: tomorrow,
      });
      const formattedDuration = formatDuration(duration, {
        delimiter: ', ',
        format: ['hours', 'minutes'],
      });

      if (type === 'smtp') return null;

      throw new Error(`You've reached your daily gbits transaction limit. Please try again in ${formattedDuration}. `);
    }

    return 'Success! Quota not reached';
  }

  async userCheckReferral() {
    console.log('userCheckReferral start');

    const { user } = this;

    const { referrer_payment, referrer } = user;

    if (!referrer) return false;

    let userReferrer;

    try {
      userReferrer = await this.getUserByID(referrer);
    } catch (error) {
      console.error(error);
      return false;
    }

    if (!referrer_payment && userReferrer.ref_quota <= 0) {
      try {
        await this.userChangeReferrerPayment();
      } catch (error) {
        console.error(error);
        return false;
      }

      return false;
    }

    if (!referrer_payment && referrer && user.transactionHistory.length > 2 && userReferrer.ref_quota > 0) {
      return {
        referral: user.email,
        referrer: userReferrer.email,
      };
    }

    return false;
  }

  async getUserByID(id) {
    console.log('User get');

    let user;

    try {
      user = await User.findById(id);
    } catch (error) {
      console.error(error);
      throw new Error('User ID incorrect!');
    }

    if (!user) {
      console.error('User not found!');
      throw new Error('User not found!');
    }

    user.transactionHistory.splice(20);
    return user;
  }

  async getUserbyEmail(userEmail) {
    console.log('getUserbyEmail start');

    let user;

    try {
      user = await User.findOne({
        email: userEmail,
      });
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    if (!user) {
      console.error('User not found!');
      return null;
    }

    return user;
  }

  async userChangeReferrerPayment() {
    console.log('userChangeReferrerPayment start');

    const { user } = this;

    try {
      await user.updateOne({ referrer_payment: true });
    } catch (error) {
      console.error(error.message);
      throw new Error(error.message);
    }

    return 'Succes!';
  }

  async reduceRefQuota() {
    console.log('User reduceRefQuota start');

    const { user } = this;

    try {
      await user.updateOne({ $inc: { ref_quota: -1 } });
    } catch (error) {
      console.error(error.message);
      throw new Error(error.message);
    }
  }

  async pushReferralArray(referral, timeStamp) {
    console.log('User pushReferralArray start');

    const { user } = this;

    try {
      await user.updateOne({
        $push: {
          referrals: { email: referral, timestamp: timeStamp },
        },
      });
    } catch (error) {
      console.error(error.message);
      throw new Error(error.message);
    }
  }

  async getUserID(email) {
    console.log('User get ID start');

    try {
      const { _id } = await User.findOne({ email }, { _id: 1 }).lean();
      console.log('_id', _id);
      return _id;
    } catch (error) {
      console.error('getUserID Error: ', error.message);
      throw new Error(error.message);
    }
  }

  async create(body) {
    console.log('User create');

    const {
      status, name, email, balance, currency_code, referrer,
    } = body;

    let newUser;

    // await User.deleteMany();

    try {
      newUser = await User.create({
        status,
        name,
        email,
        balance,
        currency_code,
        account_update_timestamp: new mongoose.Types.ObjectId().getTimestamp(),
        account_created_timestamp: new mongoose.Types.ObjectId().getTimestamp(),
        recipients: [],
        password: Buffer.from(crypto.randomBytes(64)).toString('base64'),
        transactionHistory: [],
        quota: 20,
        ref_quota: 5,
        referrer,
        referrer_payment: false,
        referrals: [],
      });
    } catch (error) {
      console.error('await User.create Error: ', error.message);
      throw new Error(error.message);
    }
    return newUser;
  }

  async sendBuyinfo(userID) {
    console.log('User sendBuyinfo');

    let user;

    try {
      user = await User.findById(userID);
    } catch (error) {
      console.error('Func sendBuyinfo error: ', error);
    }

    return user;
  }
};
