require('dotenv').config();

const jwt = require('jsonwebtoken');

const { JWT_SECRET_USERS } = process.env;

const UserService = require('../services/UserService');

async function jwtVerify(req, res, next) {
  console.log('jwt.verify start');

  let userService;
  let user;
  const userID = req.params.id;
  const { sender } = req.body;

  try {
    if (req.get('Authorization') || req.query.t) {
      const decodeData = await jwt.verify(
        (req.get('Authorization') ? req.get('Authorization').split(' ')[1] : req.query.t),
        JWT_SECRET_USERS,
        (error, decode) => {
          if (error) {
            console.error('jwt.verify Error: ', error);
            return res.status(401).json('Authorization failed! Token error.');
          }
          return decode;
        },
      );

      if (userID) {
        userService = new UserService(null, userID);
        await userService.init();

        user = userService.user;

        if (user.password === decodeData.password && user.id === decodeData.id) {
          return next();
        }
      } else if (sender) {
        userService = new UserService(sender, null);
        await userService.init();

        user = userService.user;

        if (user.password === decodeData.password && user.id === decodeData.id) {
          return next();
        }
      }

      return res.status(403).json('Authorization failed! Credentials error.');
    }

    return res.status(400).json('Authorization failed! No Authorization token.');
  } catch (error) {
    console.error('static async jwtVerify(token) Error:', error);
    return res.status(403).json('Authorization Error! Something went wrong.');
  }
}

module.exports = jwtVerify;
