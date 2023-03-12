const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
require('dotenv').config();

class ErrorHandlerService {
  static sendErrorEmail(emailData) {
    const {
      code, reqBody, stack, error, message,
    } = emailData;

    const senderMsg = {
      to: ['alexandr.kazakov1@gmail.com'],
      from: 'support@alexkazakov.info',
      subject: 'Error Handler',
      text: 'Error Handler',
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
      "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head> <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
      <style>
  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }

  td, th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }

  tr:nth-child(even) {
    background-color: #dddddd;
  }
  </style>
      </head><body>
      <p>Some Error here! </p>
      <table>
  <tr>
    <th>Code</th>
    <th>Req Body</th>
    <th>Error</th>
    <th>Error Stack</th>
    <th>Error Message</th>
  </tr>
  <tr>
  <td>${code}</td>
  <td>${reqBody}</td>
  <td>${error}</td>
  <td>${stack}</td>
  <td>${message}</td>
  </tr>
  </table>
  </body> </html>`,
    };

    try {
      sgMail.send(senderMsg);
      return 'success!';
    } catch (e) {
      console.error(e);

      if (e.response) {
        console.error(e.response.body);
      }

      return new Error('Error!');
    }
  }
}

module.exports = ErrorHandlerService;
