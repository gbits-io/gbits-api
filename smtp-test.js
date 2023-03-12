const config = {
  counter: 6,
  recipients: [
    'gixoweb@gmail.com',
  ],
};

require('dotenv').config();

const sgMail = require('@sendgrid/mail');

let msg;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendGbitsEmail(emailData) {
  msg = {
    to: `${emailData}`,
    cc: 'tx@gbits.io',
    from: 'alexandr.kazakov1@gmail.com',
    subject: '1,5 GEE',
    trackingSettings: {
      clickTracking: {
        enable: false,
      },
      openTracking: {
        enable: false,
      },
      subscriptionTracking: {
        enable: false,
      },
    },
    content: [
      {
        type: 'text/plain',
        value: 'smtp test. plain text',
      },
      {
        type: 'text/html',
        value: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml"><head>
          <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta http-equiv="X-UA-Compatible" content="IE=Edge" /> <title></title></head>
          <body>
          exist recipient   ${config.counter} emails test

          </body> </html>`,
      },
    ],
  };

  function sgMailSend() {
    try {
      sgMail.send(msg);
      console.log('Woohoo! You just sent your mailing!');
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  }

  sgMailSend();
}

let timer;

let { counter } = config;

function checkTimer() {
  if (counter <= 0) clearInterval(timer);
}

timer = setInterval(() => {
  counter -= 1;
  sendGbitsEmail(config.recipients);
  console.log('tick', counter);

  checkTimer();
}, 400);
