require('dotenv').config();

function corsOptions(reqType) {
  const type = reqType || 'all';
  let whitelist;

  if (process.env.NODE_ENV !== 'production') {
    whitelist = ['http://localhost:3020', 'http://localhost:1313'];
  } else {
    switch (type) {
      case 'website':
        whitelist = ['https://www.gbits.io'];
        break;
      case 'gmail':
        whitelist = ['https://mail.google.com'];
        break;
      default:
        whitelist = ['https://mail.google.com', 'https://www.gbits.io'];
        break;
    }
  }

  const options = {
    origin: (origin, callback) => {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        const error = new Error('CORS headers Error! Auth failed.');
        error.status = 401;

        callback(error);
      }
    },
    optionsSuccessStatus: 200,
  };

  return options;
}

module.exports = corsOptions;
