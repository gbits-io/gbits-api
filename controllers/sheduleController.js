require('dotenv').config();

const SheduleService = require('../services/SheduleService');
const TransfersService = require('../services/TransfersService');

exports.everydayupdate = async function (req, res, next) {
  try {
    await SheduleService.dailySetWatchGmail();
    await SheduleService.updateQuota();
  } catch (error) {
    console.error(error);
    next(error);
  }

  return res.json('Success');
};

exports.everyweekupdate = async function (req, res, next) {
  try {
    await SheduleService.updateRefQuota();
  } catch (error) {
    console.error(error);
    next(error);
  }

  return res.json('Success');
};

exports.checkSolWallet = async function (req, res, next) {
  try {
    const previousSignature = await SheduleService.checkSolWallet(req, res, next);

    if (previousSignature) {
      try {
        await TransfersService.updatePreviousSignature(previousSignature);
      } catch (error) {
        console.error('smtp updatePreviousHistoryId Error: ', error.message);
        return JSON.stringify(`smtp updatePreviousHistoryId Error: ${error.message}`);
      }
    }

    return res.json('Success');
  } catch (error) {
    console.error(error);
    return next(error);
  }
};
