require('dotenv').config();

const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const SendEmailService = require('../services/SendEmailService');
const transfersController = require('./transfersController');

// eslint-disable-next-line consistent-return
exports.user_login = async function (req, res) {
  console.log('user_login start');

  let userAuthData;

  let token;

  const response = {
    user: {
      quota: null,
      id: null,
      token: null,
    },
    message: null,
  };

  try {
    userAuthData = await AuthService.googleVerify(req.body);
  } catch (error) {
    console.error('await AuthService.googleVerify Error: ', error.message);
    res.status(400).json('Verify Error!');
  }

  if (userAuthData) {
    let userData;
    let userService;

    try {
      userService = new UserService(null, null);

      userData = await userService.getUserbyEmail(userAuthData.email);
    } catch (error) {
      console.error('await UserService.getUserbyEmail Error: ', error.message);
      return res.status(400).json('Auth fail! Find user Error.');
    }

    if (userData) {
      if (req.body.email_type === 'buyinfo') {
        SendEmailService.sendBuyInfoEmail({ accountEmail: userAuthData.email, _id: userData.id });
      } else {
        SendEmailService.sendGbitsEmail({ accountEmail: userAuthData.email, _id: userData.id });
      }

      try {
        token = await AuthService.jwtCreateToken(userData._id, userData.password);
      } catch (error) {
        console.error('jwt.sign create token Error: ', error.message);
        return res.status(400).json(error.message);
      }

      response.user.id = userData.id;
      response.user.token = token;
      response.user.quota = userData.quota;
      response.message = 'Login successful!';
      res.json(response);
    } else {
      const newUserObj = {
        status: 'active',
        name: userAuthData.name,
        email: userAuthData.email,
        balance: 0,
        currency_code: 'GEE',
        referrer: req.body.referrer ? req.body.referrer : '',
      };

      let newUser;

      try {
        newUser = await userService.create(newUserObj);
      } catch (error) {
        console.error(' await UserService.create Error: ', error.message);
        return res.status(400).json('User register Error!');
      }

      if (req.body.email_type === 'buyinfo') {
        SendEmailService.sendBuyInfoEmail({ accountEmail: newUser.email, _id: newUser._id });
      } else {
        SendEmailService.sendGbitsEmail({ accountEmail: newUser.email, _id: newUser._id });
      }

      try {
        await transfersController.send({
          body: {
            currency: 'GEE',
            sender: 'wallet@gbits.io',
            recipient: newUser.email,
            amount: '100',
            message: 'Free 100 GEE',
            email_type: 'userCreate',
          },
        });
      } catch (error) {
        console.error('newUser = await transfersController.send Error: ', error.message);
      }

      try {
        token = await AuthService.jwtCreateToken(newUser._id, newUser.password);
      } catch (error) {
        console.error('jwt.sign create token Error: ', error.message);
        return res.status(400).json('jwt.sign create token Error!');
      }

      response.user.id = newUser._id;
      response.user.token = token;
      response.user.quota = newUser.quota;
      response.message = 'Register successful!';
      res.json(response);
    }
  } else {
    res.status(400).json('Auth failed!');
  }
};
