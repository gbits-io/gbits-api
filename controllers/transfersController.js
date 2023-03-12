/* eslint-disable no-unreachable */
require('dotenv').config();

const crypto = require('crypto');
const mongoose = require('mongoose');
const referralController = require('./referralController');
const withdrawalController = require('./withdrawalController');
const TransfersService = require('../services/TransfersService');
const TransactionsService = require('../services/TransactionsService');
const UserService = require('../services/UserService');
const SendEmailService = require('../services/SendEmailService');

const getDateCET = require('../functions/getDateCET');
const checkAmount = require('../functions/checkAmount');

exports.send = async function (req, res, next) {
  console.log('send start');

  const recipientEmail = req.body.recipient;
  const senderEmail = req.body.sender;
  const {
    message, email_type = null, withdrawal,
  } = req.body;
  let {
    amount,
  } = req.body;

  if (withdrawal) {
    return withdrawalController.AMPwithdrawal(req, res, next);
  }

  let recipient;
  let sender;

  try {
    recipient = new UserService(recipientEmail, null);
    sender = new UserService(senderEmail, null);
    await recipient.init('regular');
    await sender.init('regular');
  } catch (error) {
    console.error(error);
    return res.status(404).json(error.message);
  }

  try {
    await checkAmount(amount, 'wallet', next);
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
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
    await recipient.userUpdateBalance(amount, 'increase');
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }

  try {
    await sender.userUpdateAMPRecipientsList(recipientEmail);
  } catch (error) {
    console.error(error);
  }

  const mongooseTypesObjectId = new mongoose.Types.ObjectId();
  const timeStamp = await getDateCET();
  const transactionHash = crypto
    .createHash('sha256')
    .update(`${timeStamp}${sender}${recipient}${amount}${message}`)
    .digest('hex');

  try {
    await sender.userAddTransactionToHistory(
      recipientEmail,
      amount,
      message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'outgoing',
      'gbits-email-app (AMP, dynamic email)',
      next,
    );
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }

  try {
    await recipient.userAddTransactionToHistory(
      senderEmail,
      amount,
      message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'incoming',
      'gbits-email-app (AMP, dynamic email)',
      next,
    );
  } catch (error) {
    console.error(error);
    return res.status(400).json(error.message);
  }

  try {
    await TransactionsService.pushTransactionToHistory(
      senderEmail,
      recipientEmail,
      amount,
      message,
      timeStamp,
      mongooseTypesObjectId,
      transactionHash,
      'gbits-email-app (AMP, dynamic email)',
      next,
    );
  } catch (error) {
    console.error(error);
    return res.status(409).json(error.message);
  }

  try {
    if (email_type === 'userCreate') {
      SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: recipientEmail });
    } else {
      SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: senderEmail });
      SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: recipientEmail });
    }
  } catch (error) {
    console.error('SendEmailService.sendGbitsEmail Error: ', error.message);
    throw new Error(error.message);
  }

  let userCheckReferral;

  try {
    userCheckReferral = await sender.userCheckReferral();
  } catch (error) {
    console.error(error);
  }

  if (userCheckReferral) {
    const { referral, referrer } = userCheckReferral;

    try {
      await referralController.transferReferralPayment(req, res, next, referral, referrer);
    } catch (error) {
      console.error(error);
    }
  }

  if (email_type === 'buyinfo') {
    const buyinfoData = {
      name: 'ARWEAVE',
      ticker_symbol: 'AR',
      coinmarketcap_url: 'https://coinmarketcap.com/currencies/arweave/',
      messari_url: 'https://messari.io/asset/arweave',
      thesis_array: ['description'],
      youtube_url: 'url',
    };

    if (email_type === 'userCreate') {
      return 'Success!';
    }

    return res.json({ info: buyinfoData });
  }

  return res.json('The transfer has been sent successfully!');
};

exports.smtp = async function (req, res) {
  console.log('smtp start');

  let historyId;
  let previousHistoryId;
  let gmailHistory;

  try {
    previousHistoryId = await TransfersService.getPreviousHistoryId();
  } catch (error) {
    console.error('Can\'t get previousHistoryId. Error: ', error);
    return JSON.stringify(`Can't get previousHistoryId. Error: ${error.message}`);
  }

  try {
    gmailHistory = await TransfersService.pullgmailHistory(previousHistoryId);

    if (!gmailHistory) {
      console.log('SMTP All transfers have been processed');
      return JSON.stringify('SMTP All transfers have been processed');
    }
  } catch (error) {
    console.error('Can\'t pull gmail history. Error: ', error);
    return JSON.stringify(`Can't pull gmail history. Error: ${error.message}`);
  }

  console.log('Step-1 smtp start: Get Gmail Emails Data');

  const gmailEmailDataPromises = [];
  let gmailEmailDataArray;

  try {
    for (let i = 0; i < gmailHistory.length; i += 1) {
      gmailEmailDataPromises.push(TransfersService.getGmailEmailData(gmailHistory[i]));
    }

    gmailEmailDataArray = await Promise.all(gmailEmailDataPromises).catch((error) => {
      console.error(error.message);
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('await TransfersService.getGmailEmailData Error: ', error);
    return JSON.stringify(`await TransfersService.getGmailEmailData Error: ${error.message}`);
  }

  console.log('Step-2 smtp start: Send transfer');

  const mongooseTypesObjectId = new mongoose.Types.ObjectId();
  const timeStamp = await getDateCET();

  console.log('Step-2-0 smtp start: check Amount');

  const checkAmountPromises = [];
  let checkAmountArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i]) {
        checkAmountPromises.push(checkAmount(gmailEmailDataArray[i].amount, 'smtp'));
      } else {
        checkAmountPromises.push(null);
      }
    }

    checkAmountArray = await Promise.all(checkAmountPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp check Amount Error: ', error);
    return JSON.stringify(`smtp check Amount Error: ${error.message}`);
  }
  console.log(20, 'check Amount complete');

  console.log('Step-2-1 smtp start: Check Sender');

  const checkSenderPromises = [];
  let sendersArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i]) {
        historyId = gmailEmailDataArray[i].historyId;
        checkSenderPromises.push(new UserService(gmailEmailDataArray[i].sender, null).init('smtp'));
      } else {
        checkSenderPromises.push(null);
      }
    }

    sendersArray = await Promise.all(checkSenderPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp checkSenderArray Error: ', error);
    return JSON.stringify(`smtp checkSenderArray Error: ${error.message}`);
  }
  console.log(21, sendersArray.length);

  console.log('Step-2-2 smtp start: Check Recipient');

  const checkRecipientPromises = [];
  let recipientsArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i]) {
        checkRecipientPromises.push(new UserService(gmailEmailDataArray[i].recipient, null).init('smtp'));
      } else {
        checkRecipientPromises.push(null);
      }
    }

    recipientsArray = await Promise.all(checkRecipientPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp checkRecipientArray Error: ', error);
    return JSON.stringify(`smtp checkRecipientArray Error: ${error.message}`);
  }

  console.log(22, recipientsArray.length);

  console.log('Step-2-3 smtp start: Check sender Quota');

  const checkQuotaPromises = [];
  let quotasArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]) {
        checkQuotaPromises.push(sendersArray[i].userCheckQuota('smtp'));
      } else {
        checkQuotaPromises.push(null);
      }
    }

    quotasArray = await Promise.all(checkQuotaPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp quotasArray Error: ', error.message);
    return JSON.stringify(`smtp quotasArray Error: ${error.message}`);
  }

  console.log(23, quotasArray.length);

  console.log('Step-2-3-1 smtp start: parceAmount');

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i]) {
        // eslint-disable-next-line no-await-in-loop
        gmailEmailDataArray[i].amount = await TransfersService.parceAmount(gmailEmailDataArray[i].amount);
      }
    }
  } catch (error) {
    console.error('smtp parceAmount Error: ', error.message);
    return JSON.stringify(`smtp parceAmount Error: ${error.message}`);
  }

  console.log(231, quotasArray.length);

  console.log('Step-2-4 smtp start: Check sender Balance');

  const checkBalancePromises = [];
  let balanceArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i] && quotasArray[i]) {
        checkBalancePromises.push(sendersArray[i].userCheckBalance(
          gmailEmailDataArray[i].amount,
          'smtp',
        ));
      } else {
        checkBalancePromises.push(null);
      }
    }

    balanceArray = await Promise.all(checkBalancePromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp balanceArray Error: ', error.message);
    return JSON.stringify(`smtp balanceArray Error: ${error.message}`);
  }

  console.log(24, quotasArray.length);

  console.log('Step-2-5 smtp start: Decrease sender Balance');

  const senderBalancePromises = [];
  let senderBalanceArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i]
        && sendersArray[i] && recipientsArray[i] && quotasArray[i] && balanceArray[i]) {
        senderBalancePromises.push(sendersArray[i].userUpdateBalance(
          gmailEmailDataArray[i].amount,
          'decrease',
        ));
      } else {
        senderBalancePromises.push(null);
      }
    }

    senderBalanceArray = await Promise.all(senderBalancePromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp Decrease sender Balance Error: ', error.message);
    return JSON.stringify(`smtp Decrease sender Balance Error: ${error.message}`);
  }

  console.log(25, senderBalanceArray.length);

  console.log('Step-2-6 smtp start: Increase Recipient Balance');

  const recipientBalancePromises = [];
  let recipientBalanceArray;

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray) {
        recipientBalancePromises.push(recipientsArray[i].userUpdateBalance(
          gmailEmailDataArray[i].amount,
          'increase',
        ));
      } else {
        recipientBalancePromises.push(null);
      }
    }

    recipientBalanceArray = await Promise.all(recipientBalancePromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp Increase Recipient Balance Error: ', error.message);
    return JSON.stringify(`smtp Increase Recipient Balance Error: ${error.message}`);
  }

  console.log(26, recipientBalanceArray.length);

  console.log('Step-2-7 smtp start: Sender UpdateAMPRecipientsList');

  const senderUpdateAMPRecipientsListPromises = [];
  let senderUpdateAMPRecipientsListArray;

  const senderAMPRecipientsListTempArray = [];

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        if (!senderAMPRecipientsListTempArray.includes(gmailEmailDataArray[i].recipient)) {
          senderAMPRecipientsListTempArray.push(gmailEmailDataArray[i].recipient);
          senderUpdateAMPRecipientsListPromises.push(sendersArray[i].userUpdateAMPRecipientsList(
            gmailEmailDataArray[i].recipient,
          ));
        }
      } else {
        senderUpdateAMPRecipientsListPromises.push(null);
      }
    }

    senderUpdateAMPRecipientsListArray = await Promise.all(recipientBalancePromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp Sender UpdateAMPRecipientsList Error: ', error.message);
    return JSON.stringify(`smtp Sender UpdateAMPRecipientsList Error: ${error.message}`);
  }

  console.log(27, senderUpdateAMPRecipientsListArray.length);

  console.log('Step-2-8 smtp start: Sender AddTransactionToHistory');

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        const transactionHash = crypto
          .createHash('sha256')
          .update(`${gmailEmailDataArray[i].timeStamp}${gmailEmailDataArray[i].sender}
          ${gmailEmailDataArray[i].recipient}${gmailEmailDataArray[i].amount}${gmailEmailDataArray[i].message}`)
          .digest('hex');

        // eslint-disable-next-line no-await-in-loop
        await sendersArray[i].userAddTransactionToHistory(
          recipientsArray[i].user.email,
          gmailEmailDataArray[i].amount,
          gmailEmailDataArray[i].message,
          timeStamp,
          mongooseTypesObjectId,
          transactionHash,
          'outgoing',
          'smtp email',
        );
      }
    }
  } catch (error) {
    console.error('smtp Sender AddTransactionToHistory Error: ', error.message);
    return JSON.stringify(`smtp Sender AddTransactionToHistory Error: ${error.message}`);
  }

  console.log(28, 'Complete');

  console.log('Step-2-9 smtp start: Recipient AddTransactionToHistory');

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        const transactionHash = crypto
          .createHash('sha256')
          .update(`${gmailEmailDataArray[i].timeStamp}${gmailEmailDataArray[i].sender}
          ${gmailEmailDataArray[i].recipient}${gmailEmailDataArray[i].amount}${gmailEmailDataArray[i].message}`)
          .digest('hex');

        // eslint-disable-next-line no-await-in-loop
        await recipientsArray[i].userAddTransactionToHistory(
          sendersArray[i].user.email,
          gmailEmailDataArray[i].amount,
          gmailEmailDataArray[i].message,
          timeStamp,
          mongooseTypesObjectId,
          transactionHash,
          'incoming',
          'smtp email',
        );
      }
    }
  } catch (error) {
    console.error('smtp Recipient AddTransactionToHistory Error: ', error.message);
    return JSON.stringify(`smtp Recipient AddTransactionToHistory Error: ${error.message}`);
  }

  console.log(29, 'Complete');

  console.log('Step-3-0 smtp start: pushTransactionToHistory');

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        const transactionHash = crypto
          .createHash('sha256')
          .update(`${gmailEmailDataArray[i].timeStamp}${gmailEmailDataArray[i].sender}
          ${gmailEmailDataArray[i].recipient}${gmailEmailDataArray[i].amount}${gmailEmailDataArray[i].message}`)
          .digest('hex');

        // eslint-disable-next-line no-await-in-loop
        await TransactionsService.pushTransactionToHistory(
          gmailEmailDataArray[i].sender,
          gmailEmailDataArray[i].recipient,
          gmailEmailDataArray[i].amount,
          gmailEmailDataArray[i].message,
          timeStamp,
          mongooseTypesObjectId,
          transactionHash,
          'smtp email',
        );
      }
    }
  } catch (error) {
    console.error('smtp pushTransactionToHistory Error: ', error.message);
    return JSON.stringify(`smtp pushTransactionToHistory Error: ${error.message}`);
  }

  console.log(30, 'Complete');

  console.log('Step-3-1 smtp start: setProcessedLabelsPromises');

  const setProcessedLabelsPromises = [];

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        setProcessedLabelsPromises.push(TransfersService.setSuccessLabel(gmailEmailDataArray[i].id));
      } else if (gmailEmailDataArray[i]) {
        setProcessedLabelsPromises.push(TransfersService.setProcessedLabel(gmailEmailDataArray[i].id));
      } else {
        recipientBalancePromises.push(null);
      }
    }

    await Promise.all(setProcessedLabelsPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp setProcessedLabelsPromises Error: ', error.message);
    return JSON.stringify(`smtp setProcessedLabelsPromises Error: ${error.message}`);
  }

  console.log(31, 'Complete');

  console.log('Step-3-2 smtp start: updatePreviousHistoryId');

  if (historyId) {
    try {
      await TransfersService.updatePreviousHistoryId(historyId - 500);
    } catch (error) {
      console.error('smtp updatePreviousHistoryId Error: ', error.message);
      return JSON.stringify(`smtp updatePreviousHistoryId Error: ${error.message}`);
    }
  }

  console.log(32, 'Complete');

  console.log('Step-3-3 smtp start: sendGbitsEmail confirm transaction');

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: gmailEmailDataArray[i].sender });
        SendEmailService.sendGbitsEmail({ type: 'confirm', accountEmail: gmailEmailDataArray[i].recipient });
      }
    }
  } catch (error) {
    console.error('SendEmailService.sendGbitsEmail Error: ', error.message);
    throw new Error(error.message);
  }

  console.log(33, 'Complete');

  console.log('Step-3-4 smtp start: sendNotificationEmails');

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && !checkAmountArray[i]) {
        SendEmailService.sendNotificationEmail(
          gmailEmailDataArray[i].sender,
          'the transfer failed, unexpected amount value!',
          'Error: Unexpected amount value. Enter the correct value.',
        );
      } else if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && !recipientsArray[i]) {
        SendEmailService.sendNotificationEmail(
          gmailEmailDataArray[i].sender,
          'the transfer failed, invalid recipient address!',
          'Error: Invalid recipient address, recipient not found Enter the correct address.',
        );
      } else if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && !quotasArray[i]) {
        SendEmailService.sendNotificationEmail(
          gmailEmailDataArray[i].sender,
          'the transfer failed, quota is over!',
          'Error: Quota is over. Try again later.',
        );
      } else if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && !balanceArray[i]) {
        SendEmailService.sendNotificationEmail(
          gmailEmailDataArray[i].sender,
          'the transfer failed, the balance is too low!',
          'Error: the balance is too low, the transfer is impossible.',
        );
      }
    }
  } catch (error) {
    console.error('smtp sendNotificationEmail Error: ', error.message);
  }

  console.log(34, 'smtp sendNotificationEmail complete');

  console.log('Step-3-5 smtp start: transferReferralPayment');

  const userCheckReferralPromises = [];
  let userCheckReferralArray;

  const userReferralPromises = [];

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray) {
        userCheckReferralPromises.push(sendersArray[i].userCheckReferral());
      } else {
        userCheckReferralPromises.push(null);
      }
    }

    userCheckReferralArray = await Promise.all(userCheckReferralPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp transferReferralPayment 1 Error: ', error.message);
  }

  try {
    for (let i = 0; i < gmailEmailDataArray.length; i += 1) {
      if (gmailEmailDataArray[i] && checkAmountArray[i] && sendersArray[i] && recipientsArray[i]
        && quotasArray[i] && balanceArray[i] && senderBalanceArray && recipientBalanceArray
        && userCheckReferralArray[i]) {
        userReferralPromises.push(referralController.transferReferralPayment(
          req,
          res,
          'next',
          userCheckReferralArray[i].referral,
          userCheckReferralArray[i].referrer,
        ));
      }
    }

    Promise.all(userReferralPromises).catch((error) => {
      throw new Error(error.message);
    });
  } catch (error) {
    console.error('smtp transferReferralPayment 2 Error: ', error.message);
  }

  console.log(35, 'smtp transferReferralPayment complete');

  console.log(100, 'SMTP All transfers have been processed');
  return res.json('SMTP All transfers have been processed');
};
