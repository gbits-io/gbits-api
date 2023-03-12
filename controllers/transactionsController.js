require('dotenv').config();

const TransactionsService = require('../services/TransactionsService');

const hiddenHistory = require('../functions/hiddenHistory');
// req.params.id, req.params.limit,
exports.transactions_list = async function (req, res, next) {
  try {
    const {
      transactions, totalCount,
    } = await TransactionsService.getTransactionsList(
      req.query.page ? req.query.page : null,
      req.query.counter ? req.query.counter : null,
      next,
    );

    const modifiedЕransactions = await hiddenHistory(transactions);

    const response = {
      transactions: modifiedЕransactions,
      totalCount,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.transaction_details = async function (req, res, next) {
  try {
    const transactionData = await TransactionsService.getTransactionDetails(req.params.id, next);
    const response = await hiddenHistory([transactionData]);

    res.json(response[0]);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
