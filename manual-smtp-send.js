require('dotenv').config();

const fs = require('fs');

const { CLIENT_EMAIL } = process.env;
const { PRIVATE_KEY } = process.env;

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: 'noreply@gbits.io',
    serviceClient: CLIENT_EMAIL,
    privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

async function sendEmail(emailData) {
  console.log('sendGbitsEmail start');

  let response = {};
  const {
    accountEmail = 'alexandr.kazakov1@gmail.com',
    _id = '618da8b4989f54000ab5a639',
    type = null,
  } = emailData;

  let AMPversion = String(fs.readFileSync(`${__dirname}/public/templates/amp-email.html`))
    .replace(/\${_id}/g, _id)
    .replace(/alexandr.kazakov1@gmail.com/g, accountEmail);

  if (type === 'confirm') {
    AMPversion = AMPversion.replace(
      '"nav-tabs__item active clear-btn"',
      '"nav-tabs__item clear-btn"',
    );

    AMPversion = AMPversion.replace(
      'class="tabs-content__item active"',
      'class="tabs-content__item"',
    );
    AMPversion = AMPversion.replace(
      'class="nav-tabs__item clear-btn" id="threeTab"',
      'class="nav-tabs__item active clear-btn" id="threeTab"',
    );
    AMPversion = AMPversion.replace(
      'class="tabs-content__item" id="threePanel"',
      'class="tabs-content__item active" id="threePanel"',
    );
  }

  const HTMLversion = String(fs.readFileSync(`${__dirname}/public/templates/html-email.html`));

  const mailOptions = {
    from: 'noreply@gbits.io',
    text: 'Gbits Gmail wallet Update [testnet]',
    amp: AMPversion,
    html: HTMLversion,
  };

  async function sendSignupAmpEmail() {
    const signupOptions = mailOptions;

    signupOptions.to = 'uchusi123@gmail.com';
    // ampforemail.whitelisting@gmail.com

    switch (type) {
      case 'confirm':
        signupOptions.subject = 'Gbits.io [testnet] - wallet update - new transaction';
        break;
      default:
        // signupOptions.subject = 'Gbits Gmail wallet Update [testnet]';
        signupOptions.subject = 'Gbits Gmail wallet Update [testnet]';
        break;
    }

    return transporter.sendMail(signupOptions);
  }

  try {
    response = await sendSignupAmpEmail();
    response.message = 'Gbits successfully send.';
    response.code = 200;
    console.log('response ', response);
    return response;
  } catch (error) {
    response.message = error;
    response.code = 500;
    return response;
  }
}

sendEmail({});
