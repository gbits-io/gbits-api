require('dotenv').config();

function parseEmailAddress(emailAddress) {
  if (emailAddress.search('<') !== -1) {
    return emailAddress.split('<')[1].replace('>', '');
  }
  return emailAddress;
}

module.exports = parseEmailAddress;
