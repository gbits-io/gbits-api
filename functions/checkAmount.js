require('dotenv').config();

async function checkAmount(string, type) {
  let str = String(string);
  console.log('Amount', str);
  if (str.includes(',')) {
    str = str.split(',').join('.');
  }

  if (typeof str !== 'string') {
    if (type === 'smtp') {
      return null;
    }

    console.error('Unexpected amount value!');
    throw new Error('Unexpected amount value!');
  }

  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(str) && !isNaN(parseFloat(str))) {
    if (str <= 0) {
      if (type === 'smtp') {
        return null;
      }

      console.error('Amount must be a number > 0');
      throw new Error('Amount must be a number > 0');
    }

    return 'Success!';
  }

  if (type === 'smtp') {
    return null;
  }

  console.error('Unexpected amount value!');
  throw new Error('Unexpected amount value!');
}

module.exports = checkAmount;
