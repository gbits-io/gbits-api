require('dotenv').config();

const { PRIVATE_KEY } = process.env;
const { CLIENT_EMAIL } = process.env;

const SCOPES = ['https://mail.google.com/'];

const { JWT } = require('google-auth-library');
const { google } = require('googleapis');

const gmail = google.gmail('v1');

const web3 = require('@solana/web3.js');

// const schedule = require('node-schedule');
const mongoose = require('mongoose');
const User = require('../bd/schemes/userSchema');
const SolSchema = require('../bd/schemes/solSchema');

mongoose.set('debug', true);

const cryptoController = require('../controllers/cryptoController');
const ErrorHandlerService = require('./ErrorHandlerService');

class SheduleService {
  static async updateQuota() {
    console.log('User updateQuota start');

    try {
      await User.updateMany({ quota: { $exists: true } }, { $set: { quota: 20 } });
    } catch (error) {
      console.log('error');
    }
  }

  static async updateRefQuota() {
    console.log('User updateRefQuota start');

    try {
      await User.updateMany({ quota: { $exists: true } }, { $set: { ref_quota: 5 } });
    } catch (error) {
      console.log('error');
    }
  }

  static async dailySetWatchGmail() {
    console.log('setWatchGmail start');
    const errorObj = {
      code: null, reqBody: null, stack: null, error: null, message: null,
    };

    try {
      const client = new JWT({
        email: CLIENT_EMAIL,
        key: PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: SCOPES,
        subject: 'romanix@gbits.io',
      });

      try {
        await client.authorize();
      } catch (error) {
        console.log('setWatchGmail client.authorize Error: ', error);
        errorObj.error = error;
        errorObj.message = 'setWatchGmail client.authorize Error';
        ErrorHandlerService.sendErrorEmail(errorObj);
        return new Error('setWatchGmail client.authorize Error');
      }

      google.options({ auth: client });

      await new Promise((resolve, reject) => {
        const resource = {
          topicName: 'projects/gbits2021/topics/gmail',
          labelFilterAction: 'INCLUDE',
          labelIds: ['UNREAD', 'INBOX'],
        };

        const options = {
          auth: client,
          resource,
          userId: 'me',
        };

        try {
          gmail.users.watch(options, (err, res) => {
            if (err) {
              console.log('error!');
              console.log(JSON.stringify(err));
              reject(err);
            }
            resolve(res);
          });
        } catch (error) {
          console.log('projects/geebits2021/topics/gmail Error');
          errorObj.error = error;
          errorObj.message = 'projects/geebits2021/topics/gmail Error';
          ErrorHandlerService.sendErrorEmail(errorObj);
        }

        console.log('dailySetWatchGmail success!');
      });
      return true;
    } catch (e) {
      console.log(e);
      return { status: 'error' };
    }
  }

  static async checkSolWallet(req, res, next) {
    let solSchemeData;

    try {
      solSchemeData = await SolSchema.findById('627fb97b7afa46513234d089');
    } catch (error) {
      console.error(error);
      throw new Error(' SolSchema.findById error!');
    }

    const { previousSignature } = solSchemeData;

    const mintPublicKey = new web3.PublicKey('igYvQesuheKUuvkGS5YnK6HX4udg86Dxbce6TZncqEx');
    const connection = new web3.Connection('https://rpc.helius.xyz/?api-key=8569f3c7-0525-4997-9dc8-437ddb91dff3');
    const signatures = await connection.getSignaturesForAddress(
      mintPublicKey,
      { until: previousSignature },
    );
    console.log('Signatures: ', signatures);

    let newPreviousSignature;

    for (let i = 0; i < signatures.length; i += 1) {
      if (signatures[i].memo && signatures[i].memo.includes('@')) {
        // eslint-disable-next-line no-await-in-loop
        const transaction = await connection.getTransaction(signatures[i].signature);
        console.log('Transaction : ', transaction);
        console.log('Transaction preTokenBalances: ', transaction.meta.preTokenBalances);
        console.log('Transaction postTokenBalances: ', transaction.meta.postTokenBalances);

        const amount = Math.round(transaction.meta.postTokenBalances[1].uiTokenAmount.uiAmount
          - transaction.meta.preTokenBalances[1].uiTokenAmount.uiAmount);
        console.log('Transaction amount: ', amount);

        const recipientEmail = signatures[i].memo.split(' ')[1];
        console.log('recipientEmail: ', recipientEmail);
        cryptoController.transferCryptoPayment(req, res, next, recipientEmail, amount);
      }

      newPreviousSignature = signatures[i].signature;
    }

    if (newPreviousSignature !== previousSignature) {
      return newPreviousSignature;
    }

    return null;
  }
}

module.exports = SheduleService;
