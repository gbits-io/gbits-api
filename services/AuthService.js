require('dotenv').config();

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const { JWT_SECRET_USERS } = process.env;
const { CLIENT_ID } = process.env;

class AuthService {
  static async googleVerify(body) {
    const client = new OAuth2Client(CLIENT_ID);

    const { token } = body;
    let ticket;
    let payload;

    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });

      payload = ticket.getPayload();
    } catch (error) {
      console.error('googlew await client.verifyIdToken Error: ', error.message);
      throw new Error(error.message);
    }

    return payload;
  }

  static async jwtCreateToken(userID, userPassword) {
    let token;

    try {
      token = jwt.sign({ id: userID, password: userPassword }, JWT_SECRET_USERS);
    } catch (error) {
      console.error('jwt.sign create token Error: ', error.message);
      throw new Error('jwt.sign create token Error!');
    }

    return token;
  }
}

module.exports = AuthService;
