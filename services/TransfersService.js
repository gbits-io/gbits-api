require('dotenv').config();

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const parseEmailAddress = require('../functions/parseEmailAddress');

const gmailSchema = require('../bd/schemes/gmailSchema');
const solSchema = require('../bd/schemes/solSchema');
const User = require('../bd/schemes/userSchema');

const { PRIVATE_KEY } = process.env;
const { CLIENT_EMAIL } = process.env;

const SCOPES = ['https://mail.google.com/'];

const gmail = google.gmail('v1');

class TransfersService {
  /**
   * @return {number} - previousHistoryId
   */

  static async getPreviousHistoryId() {
    console.log('getPreviousHistoryId start');

    let gmailMongoDocument;

    try {
      gmailMongoDocument = await gmailSchema.findOne({ _id: '615e365f620f8fa60be929f0' });
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    const { previousHistoryId } = gmailMongoDocument;

    if (!previousHistoryId) { throw new Error('GetPreviousHistoryId error!'); }
    return previousHistoryId;
  }

  /**
 * @param {number} previousHistoryId
 * @return {array} - previousHistoryId
 */

  static async pullgmailHistory(previousHistoryId) {
    console.log('pullgmailHistory start');

    let historyList;
    // let historyIdArray=[];

    const client = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: SCOPES,
      subject: 'romanix@gbits.io',
    });

    try {
      await client.authorize();
    } catch (error) {
      console.error('Admin authorize(pullgmailHistory) Error: ', error);
      throw new Error(error.message);
    }

    google.options({ auth: client });

    try {
      historyList = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: previousHistoryId,
        historyTypes: 'messageAdded',
        maxResults: 500,
        labelId: ['UNREAD', 'INBOX'],
      });
    } catch (error) {
      console.error('await gmail.users.history.list Error: ', error);
      throw new Error(error.message);
    }

    // test ####################
    // for (let i = 0; i < historyList.data.history.length; i++) {
    //   const test = await gmail.users.messages.get({
    //     userId: 'me',
    //     id: historyList.data.history[i].messagesAdded[0].message.id,
    //     format: 'metadata',
    //   });
    //
    // }
    // test ####################

    console.log(22222222, historyList.data.history);
    if (!historyList) { throw new Error('pullgmailHistory error!'); }

    return historyList.data.history;
  }

  static async updatePreviousHistoryId(historyId) {
    try {
      await gmailSchema.findOneAndUpdate({ _id: '615e365f620f8fa60be929f0' }, { previousHistoryId: historyId });
      return 'sucess';
    } catch (error) {
      console.log('updatePreviousHistoryId Error: ', error);
      throw new Error(error.message);
    }
  }

  static async updatePreviousSignature(signature) {
    try {
      await solSchema.findOneAndUpdate({ _id: '627fb97b7afa46513234d089' }, { previousSignature: signature });
      return 'sucess';
    } catch (error) {
      console.log('updatePreviousSignature Error: ', error);
      throw new Error(error.message);
    }
  }

  static async parceAmount(amount) {
    let response;
    let separator;
    let checkedAmount;

    if (!(amount.includes('.') || amount.includes(','))) {
      return amount;
    }

    if (amount.includes('.')) { separator = '.'; } else if (amount.includes(',')) { separator = ','; }

    try {
      checkedAmount = +parseFloat(amount.split(separator).join('.')).toFixed(2);
      response = checkedAmount;
    } catch (error) {
      console.log('parceAmount Error: ', error);
      throw new Error(error.message);
    }

    return response;
  }

  static async setProcessedLabel(messageID) {
    const client = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: SCOPES,
      subject: 'romanix@gbits.io',
    });

    try {
      await client.authorize();
    } catch (error) {
      console.error('client.authorize Error: ', error);
      return null;
    }

    google.options({ auth: client });

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageID,
        requestBody: {
          addLabelIds: 'Label_8104278760985250882',
          removeLabelIds: 'UNREAD',
        },
      });

      return 'Success setProcessedLabel';
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async setSuccessLabel(messageID) {
    const client = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: SCOPES,
      subject: 'romanix@gbits.io',
    });

    try {
      await client.authorize();
    } catch (error) {
      console.error('client.authorize Error: ', error);
      return null;
    }

    google.options({ auth: client });

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageID,
        requestBody: {
          addLabelIds: ['Label_7876412899380843790', 'Label_8104278760985250882'],
          removeLabelIds: 'UNREAD',
        },
      });

      return 'Success setSuccessLabel';
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async getGmailEmailData(message) {
    console.log('getGmailEmailData start');

    const messageID = message.messages[0].id;
    let messageData;

    const client = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: SCOPES,
      subject: 'romanix@gbits.io',
    });

    try {
      await client.authorize();
    } catch (error) {
      console.error('Admin authorize(getGmailEmailData) Error: ', error);
      throw new Error(error.message);
    }

    google.options({ auth: client });

    if (message.messagesAdded[0].message.labelIds.includes('SENT')
      || message.messagesAdded[0].message.labelIds.includes('DRAFT')) {
      return null;
    }

    try {
      messageData = await gmail.users.messages.get({
        userId: 'me',
        id: messageID,
        format: 'metadata',
      });
    } catch (error) {
      console.error('await gmail.users.messages.get Error: ', error);
      return null;
    }

    if (messageData.data.labelIds.includes('Label_8104278760985250882')) {
      return null;
    }

    const { headers } = messageData.data.payload;

    let sender;
    let recipient;
    let gbitsValue;
    const messageField = messageData.data.snippet;
    const { historyId } = messageData.data;

    for (let index = 0; index < headers.length; index += 1) {
      if (headers[index].name === 'Cc'
        && (headers[index].value === 'tx@gbits.io' || parseEmailAddress(headers[index].value) === 'tx@gbits.io')
      ) {
        try {
          for (let i = 0; i < headers.length; i += 1) {
            switch (headers[i].name) {
              case 'To':
                try {
                  recipient = parseEmailAddress(headers[i].value);
                } catch (error) {
                  console.error('Parse gmail email To Error: ', error);
                  return null;
                }
                break;
              case 'From':
                try {
                  sender = parseEmailAddress(headers[i].value);
                } catch (error) {
                  console.error('Parse gmail email From Error: ', error);
                  return null;
                }
                break;
              case 'Subject':
                try {
                  gbitsValue = headers[i].value;
                } catch (error) {
                  console.error('Parse gmail email Subject Error: ', error);
                  return null;
                }
                break;
              default:
            }
          }

          console.log('sender', sender);
          console.log('recipient', recipient);
          console.log('gbitsValue', gbitsValue);

          return {
            sender,
            recipient,
            amount: gbitsValue,
            message: messageField,
            id: messageID,
            historyId,
          };
        } catch (error) {
          console.error('parseTransferHeaders Error: ', error);
          return null;
        }
      }
    }

    return null;
  }

  static async userUpdateAMPRecipientsList(senderEmail, recipientEmail) {
    console.log('userUpdateAMPRecipientsList start');

    let recipientExist;

    try {
      recipientExist = await User.findOne({
        email: senderEmail,
        'recipients.email': recipientEmail,
      });

      if (recipientExist != null) {
        return 'Recipient email already exist in the AMPRecipientsList';
      }

      await User.findOneAndUpdate({ email: senderEmail }, { $push: { recipients: { email: recipientEmail } } });
    } catch (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return 'Success! Recipient email was added to AMPRecipientsList.';
  }
}

module.exports = TransfersService;
