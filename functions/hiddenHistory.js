require('dotenv').config();

/**
   *
   * @param {Array} historyTransactions
   * @return {Array} Modified historyTransactions
   */

async function hiddenHistory(historyArray) {
  const response = historyArray.map((item) => {
    let senderEmailName = item.details.sender.split('@')[0];
    const senderEmailDomain = item.details.sender.split('@')[1];

    senderEmailName = `${senderEmailName.charAt(0)}•••${senderEmailName.charAt(senderEmailName.length - 1)}`;

    let recipientEmailName = item.details.recipient.split('@')[0];
    const recipientEmailDomain = item.details.recipient.split('@')[1];

    recipientEmailName = `${recipientEmailName.charAt(0)}•••${recipientEmailName.charAt(
      recipientEmailName.length - 1,
    )}`;

    const newMessage = `${item.details.message.charAt(0)}•••${
      item.details.message.charAt(item.details.message.length - 1)}`;

    const newItem = item;

    if (item.details.sender === 'wallet@gbits.io') {
      newItem.details.sender = item.details.sender;
      newItem.from = item.details.sender;
      newItem.details.message = item.details.message;
    } else {
      newItem.details.sender = `${senderEmailName}@${senderEmailDomain}`;
      newItem.from = `${senderEmailName}@${senderEmailDomain}`;
      newItem.details.message = newMessage;
    }

    newItem.details.recipient = `${recipientEmailName}@${recipientEmailDomain}`;
    newItem.to = `${recipientEmailName}@${recipientEmailDomain}`;

    return newItem;
  });

  return response;
}

module.exports = hiddenHistory;
