require('dotenv').config();

const fs = require('fs');
const nodemailer = require('nodemailer');

const AuthService = require('./AuthService');
const User = require('../bd/schemes/userSchema');

const { CLIENT_EMAIL } = process.env;
const { PRIVATE_KEY } = process.env;

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

class SendEmailService {
  /**
 * @param {object} emailData
 * @return {object} - response
 */
  static async sendGbitsEmail(emailData) {
    console.log('sendGbitsEmail start');

    let user;
    let token;
    let response = {};
    const { accountEmail, type = null } = emailData;

    try {
      user = await User.findOne({
        email: accountEmail,
      });
    } catch (error) {
      console.error('sendGbitsEmail Error: ', error.message);
      throw new Error(error.message);
    }

    try {
      token = await AuthService.jwtCreateToken(user._id, user.password);
    } catch (error) {
      console.error('AuthService.jwtCreateToken Error: ', error.message);
      throw new Error('jwt.sign create token Error!');
    }

    const { _id } = user;

    let AMPversion = String(fs.readFileSync(`${__dirname}/../public/templates/amp-email.html`))
      .replace(/\${_id}/g, `${_id}?t=${token}`)
      .replace(/transfers\/send/g, `transfers/send?t=${token}`)
      .replace(/transfers\/amp-spl-withdrawal/g, `transfers/amp-spl-withdrawal?t=${token}`)
      .replace(/alexandr.kazakov1@gmail.com/g, accountEmail)
      .replace(/ref=618da8b4989f54000ab5a639/g, `ref=${_id}`);

    if (type === 'confirm') {
      AMPversion = AMPversion.replace('"nav-tabs__item active clear-btn"', '"nav-tabs__item clear-btn"');
      AMPversion = AMPversion.replace('class="tabs-content__item active"', 'class="tabs-content__item"');
      AMPversion = AMPversion.replace(
        'class="nav-tabs__item clear-btn" id="threeTab"',
        'class="nav-tabs__item active clear-btn" id="threeTab"',
      );
      AMPversion = AMPversion.replace(
        'class="tabs-content__item" id="threePanel"',
        'class="tabs-content__item active" id="threePanel"',
      );
    }

    const HTMLversion = String(fs.readFileSync(`${__dirname}/../public/templates/html-email.html`));

    const mailOptions = {
      from: 'noreply@gbits.io',
      text: 'Gbits Gmail wallet Update [testnet]',
      amp: AMPversion,
      html: HTMLversion,
    };

    async function sendSignupAmpEmail() {
      const signupOptions = mailOptions;
      signupOptions.to = `${accountEmail}`;

      switch (type) {
        case 'confirm':
          signupOptions.subject = 'Gbits.io [testnet] - wallet update - new transaction';
          break;
        default:
          signupOptions.subject = 'Gbits Gmail wallet Update [testnet]';
          break;
      }

      return transporter.sendMail(signupOptions);
    }

    try {
      response = await sendSignupAmpEmail();
      response.message = 'Gbits successfully send.';
      response.code = 200;

      return response;
    } catch (error) {
      response.message = error;
      response.code = 500;
      return response;
    }
  }

  static async sendBuyInfoEmail(emailData) {
    let response = {};
    const { accountEmail, _id } = emailData;

    const AMPversion = String(fs.readFileSync(`${__dirname}/../public/templates/amp-email-buyinfo.html`))
      .replace(/\${_id}/g, _id)
      .replace(/alexandr.kazakov1@gmail.com/g, accountEmail);

    const HTMLversion = String(fs.readFileSync(`${__dirname}/../public/templates/html-email.html`));

    const mailOptions = {
      from: 'noreply@gbits.io',
      text: 'Gbits Gmail wallet Update [testnet]',
      amp: AMPversion,
      html: HTMLversion,
    };

    async function sendSignupAmpEmail() {
      const signupOptions = mailOptions;
      signupOptions.to = `${accountEmail}`;
      signupOptions.subject = 'Gbits.io [testnet] - reveal info - example';

      return transporter.sendMail(signupOptions);
    }

    try {
      response = await sendSignupAmpEmail();
      response.message = 'Gbits successfully send.';
      response.code = 200;
      return response;
    } catch (error) {
      response.message = error;
      response.code = 500;
      return response;
    }
  }

  /**
   *
   * @param {string} email - User email address
   * @param {string} message - Error message
   * @return {number} response code
   */

  static async sendNotificationEmail(emailAddress, subject, message) {
    const mailOptions = {
      to: emailAddress,
      from: 'noreply@gbits.io',
      subject: `Gbits.io [testnet] - ${subject}`,
      text: message,
    };

    async function sendNoticeEmail() {
      return transporter.sendMail(mailOptions);
    }

    try {
      await sendNoticeEmail();
      return 'Success sendNotificationEmail';
    } catch (error) {
      console.log('sendNotificationEmaill Error: ', error.message);
      throw new Error(error.message);
    }
  }

  /**
   *
   * @param {string} email - User email address
   * @param {string} message - Error message
   * @return {number} response code
   */

  static async sendSMTPquotaNotice(email, message, next) {
    const mailOptions = {
      to: email,
      from: 'noreply@gbits.io',
      subject: 'Gbits.io [testnet] - transfer error, quota is over',
      text: message,
    };

    async function sendNoticeEmail() {
      return transporter.sendMail(mailOptions);
    }

    try {
      await sendNoticeEmail();
      return 'Success sendSMTPquotaNotice';
    } catch (error) {
      console.error('sendSMTPquotaNotice error: ', error);
      return next(error);
    }
  }

  /**
   *
   * @param {string} email - User email address
   * @return {number} response code
   */

  static async sendSMTPbalanceNotice(email, next) {
    const mailOptions = {
      to: email,
      from: 'noreply@gbits.io',
      subject: 'Gbits.io [testnet] - transfer error, the balance is too low',
      text: 'The balance is too low, the transfer is impossible.',
    };

    async function sendNoticeEmail() {
      return transporter.sendMail(mailOptions);
    }

    try {
      await sendNoticeEmail();
      return 'Success sendSMTPbalanceNotice';
    } catch (error) {
      console.error('sendSMTPbalanceNotice error: ', error);
      return next(error);
    }
  }

  /**
   *
   * @param {string} email - User email address
   * @return {number} response code
   */

  static async sendSMTPrecipientNotFoundNotice(email, next) {
    const mailOptions = {
      to: email,
      from: 'noreply@gbits.io',
      subject: 'Gbits.io [testnet] - transfer error, recipient not found.',
      text: 'Recipient not found, the transfer is impossible.',
    };

    async function sendNoticeEmail() {
      return transporter.sendMail(mailOptions);
    }

    try {
      await sendNoticeEmail();
    } catch (error) {
      console.error('sendSMTPrecipientNotFoundNotice Error: ', error.message);
      return next(error);
    }
    return 'Success sendSMTPrecipientNotFoundNotice';
  }
}

module.exports = SendEmailService;
