const UserService = require('../services/UserService');
const SendEmailService = require('../services/SendEmailService');

exports.user_detail = async function (req, res) {
  console.log('user_detail start');

  let userService;

  try {
    userService = new UserService(null, req.params.id);
    await userService.init();
  } catch (error) {
    console.error('Get user_detail Error:', error);
    res.status(403).json(error.message);
  }

  const { user } = userService;
  user.transactionHistory.splice(20);

  const responseObj = { data: {} };
  responseObj.data = user;

  res.json(responseObj);
};

exports.user_create = async function (req, res) {
  let userService;

  try {
    userService = new UserService(null, null);

    const response = await userService.create(req.body);
    console.log(response._id.toString());
    res.json(response);
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      res.status(400).json('The email already exists');
    } else {
      res.status(500).json('Internal server error');
    }
  }
};

exports.user_send_wallet = async function (req, res, next) {
  const gbitsEmailData = {};

  try {
    const user = await UserService.getUserByID(req.body.user_id);

    gbitsEmailData.accountEmail = user.email;
    gbitsEmailData._id = user._id;

    await SendEmailService.sendGbitsEmail(gbitsEmailData);

    res.status(200).json('Success');
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.user_send_buyinfo = async function (req, res, next) {
  const gbitsEmailData = {};

  try {
    const user = await UserService.getUserByID(req.body.user_id);

    gbitsEmailData.accountEmail = user.email;
    gbitsEmailData._id = user._id;

    await SendEmailService.sendBuyInfoEmail(gbitsEmailData);

    res.status(200).json('Success');
  } catch (e) {
    console.error(e);
    next(e);
  }
};
