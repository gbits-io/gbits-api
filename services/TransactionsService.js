require('dotenv').config();

const mongoose = require('mongoose');
const { format } = require('date-fns');

const transactionsSchema = require('../bd/schemes/transactionsSchema');

const config = require('../config.json');

mongoose.set('debug', true);

class TransactionsService {
  /**
   *
   * @param {number} page
   * @param {number} limit
   * @return {Object} response
   */

  static async getTransactionsList(page, limit) {
    const response = {};
    const pageNumber = parseInt(page, 10);

    let nPerPage = parseInt(limit, 10) || 30;
    if (nPerPage > 30) {
      nPerPage = 30;
    }

    let transactions;
    let totalCount;

    try {
      transactions = await transactionsSchema.find({}).sort({ _id: -1 })
        .skip(pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0)
        .limit(nPerPage);

      totalCount = await transactionsSchema.count();
    } catch (error) {
      console.error('getTransactionsList Error: ', error);
      throw new Error(error.message);
    }

    response.transactions = transactions;
    response.totalCount = totalCount;

    return response;
  }

  /**
   *
   * @param {String} transactionID
   * @param {Function} next
   * @return {Array} array with 1 transaction
   */

  static async getTransactionDetails(transactionID, next) {
    let response;

    try {
      response = transactionsSchema.findById(transactionID);
    } catch (error) {
      console.error('getTransactionDetails Error: ', error);
      return next(error);
    }

    return response;
  }

  /**
 * @param {string} sender email address
 * @param {string} recipient email address
 * @param {number} amount
 * @param {string} message
 * @param {object} today Date object
 * @param {string} mongooseTypesObjectId
 * @param {string} trigger smtp/amp/api
 * @param {functions} next
 * @return {string} - success message
 */

  static async pushTransactionToHistory(
    sender,
    recipient,
    amount,
    message,
    today,
    mongooseTypesObjectId,
    transactionHash,
    trigger,

  ) {
    console.log('pushTransactionToHistory start');

    const timeStamp = today;
    const date = format(today, config.format_date);
    const time = format(today, config.format_time);

    const messageData = message.length > 200 ? `${message.substring(0, 200)}...` : message;

    // let transactions;

    try {
      await transactionsSchema.create({
        _id: mongooseTypesObjectId,
        hash: transactionHash,
        timeStamp,
        date,
        time,
        from: sender,
        to: recipient,
        details: {
          trigger,
          amount,
          sender,
          recipient,
          message: messageData,
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return 'Success';
  }
}

module.exports = TransactionsService;
