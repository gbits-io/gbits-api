require('dotenv').config();

const mongoose = require('mongoose');
const crypto = require('crypto');

const UserService = require('../services/UserService');
const TransactionsService = require('../services/TransactionsService');
const SendEmailService = require('../services/SendEmailService');
const SolanaService = require('../services/SolanaService');
const TransfersService = require('../services/TransfersService');

const getDateCET = require('../functions/getDateCET');

exports.transferCryptoPayment = async function (req, res, next, recipientEmail, amount) {
  console.log('transferCryptoPayment start');

  let recipient;

  try {
    recipient = new UserService(recipientEmail, null);
    await recipient.init('regular');
  } catch (error) {
    console.error(error);
    return res.status(404).json(error.message);
  }

  const transferObj = {
    currency: 'GEE',
    sender: 'bridge@gbits.io',
    recipient: recipientEmail,
    amount,
    message: 'Gbits Solana Bridge payment',
  };

  let mongooseTypesObjectId;
  let timeStamp;
  let transactionHash;

  try {
    mongooseTypesObjectId = new mongoose.Types.ObjectId();
    timeStamp = await getDateCET();
    transactionHash = crypto
      .createHash('sha256')
      .update(`${timeStamp}${transferObj.sender}${transferObj.recipient}
    ${transferObj.amount}${transferObj.message}`)
      .digest('hex');
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  try {
    await recipient.userUpdateBalance(transferObj.amount, 'increase', next);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  try {
    await recipient.userAddTransactionToHistory(
      transferObj.sender,
      transferObj.amount,
      transferObj.message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'incoming',
      'wallet@gbits.io',
      next,
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  try {
    await TransactionsService.pushTransactionToHistory(
      transferObj.sender,
      transferObj.recipient,
      transferObj.amount,
      transferObj.message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'Gbits Solana Bridge',
      next,
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  try {
    SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: transferObj.recipient });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  return 'Success';
};

exports.amp_spl_withdrawal = async function (req, res) {
  console.log('AMPwithdrawal start', req.body);

  const senderEmail = req.body.sender;

  const {
    solanaWallet, memo,
  } = req.body;

  let {
    amount,
  } = req.body;

  const withdrawalObj = {
    currency: 'GEE',
    sender: solanaWallet,
    recipient: senderEmail,
    amount,

  };

  let sender;
  let signature;

  try {
    sender = new UserService(senderEmail, null);
    await sender.init('regular');
  } catch (error) {
    console.error(error);
    return res.status(404).json(error.message);
  }

  try {
    await sender.userCheckQuota();
  } catch (error) {
    console.error(error);
    return res.status(403).json(error.message);
  }

  try {
    amount = await TransfersService.parceAmount(amount);
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }

  try {
    await sender.userCheckBalance(amount, 'regular');
  } catch (error) {
    console.error(error);
    return res.status(403).json(error.message);
  }

  try {
    await sender.userUpdateBalance(amount, 'decrease');
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  try {
    signature = await SolanaService.withdrawalSPL(solanaWallet, amount, memo);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  const mongooseTypesObjectId = new mongoose.Types.ObjectId();
  const timeStamp = await getDateCET();
  const transactionHash = crypto
    .createHash('sha256')
    .update(`${timeStamp}${withdrawalObj.sender}${withdrawalObj.recipient}${amount}`)
    .digest('hex');

  try {
    await sender.userAddTransactionToHistory(
      withdrawalObj.sender,
      amount,
      `https://solscan.io/tx/${signature}`,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'outgoing',
      'wallet@gbits.io',
    );
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }

  try {
    await TransactionsService.pushTransactionToHistory(
      'wallet@gbits.io',
      withdrawalObj.sender,
      amount,
      `https://solscan.io/tx/${signature}`,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'gbits-email-app (AMP, dynamic email)',
    );
  } catch (error) {
    console.error(error);
    return res.status(409).json(error.message);
  }

  try {
    SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: senderEmail });
  } catch (error) {
    console.error('SendEmailService.sendGbitsEmail Error: ', error.message);
    throw new Error(error.message);
  }

  console.log('response', signature);

  return res.json({ url: `https://solscan.io/tx/${signature}` });
};
