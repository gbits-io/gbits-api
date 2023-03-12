require('dotenv').config();

const mongoose = require('mongoose');
const crypto = require('crypto');

const UserService = require('../services/UserService');
const TransactionsService = require('../services/TransactionsService');
const SendEmailService = require('../services/SendEmailService');

const getDateCET = require('../functions/getDateCET');

exports.transferReferralPayment = async function (req, res, next, referralUser, referrerUser) {
  console.log('referralController start');

  let referral;
  let referrer;

  try {
    referral = new UserService(referralUser, null);
    referrer = new UserService(referrerUser, null);
    await referral.init();
    await referrer.init();
  } catch (error) {
    console.error(error);
    return res.status(404).json(error.message);
  }

  const refTransferObj = {
    currency: 'GEE',
    sender: 'wallet@gbits.io',
    recipient: referrerUser,
    amount: '100',
    message: 'Referral free 100 GEE',
    email_type: 'userCreate',
  };

  let mongooseTypesObjectId;
  let timeStamp;
  let transactionHash;

  try {
    mongooseTypesObjectId = new mongoose.Types.ObjectId();
    timeStamp = await getDateCET();
    transactionHash = crypto
      .createHash('sha256')
      .update(`${timeStamp}${refTransferObj.sender}${refTransferObj.recipient}
    ${refTransferObj.amount}${refTransferObj.message}`)
      .digest('hex');
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  try {
    await referrer.userUpdateBalance(refTransferObj.amount, 'increase', next);
  } catch (error) {
    console.error(error);
    return res.status(202).json(error.message);
  }

  try {
    await referrer.userAddTransactionToHistory(
      refTransferObj.sender,
      refTransferObj.amount,
      refTransferObj.message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'incoming',
      'wallet@gbits.io',
      next,
    );
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  try {
    await TransactionsService.pushTransactionToHistory(
      refTransferObj.sender,
      refTransferObj.recipient,
      refTransferObj.amount,
      refTransferObj.message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'wallet@gbits.io',
      next,
    );
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  try {
    await referral.userChangeReferrerPayment(referralUser);
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  try {
    await referrer.reduceRefQuota();
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  try {
    await referrer.pushReferralArray(referralUser, timeStamp);
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  try {
    SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: refTransferObj.recipient });
  } catch (error) {
    console.error(error);
    return JSON.stringify(error.message);
  }

  return 'Success';
};
