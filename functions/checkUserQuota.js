require('dotenv').config();

const { intervalToDuration, formatDuration } = require('date-fns');
const mongoose = require('mongoose');

mongoose.set('debug', true);

const findUser = require('../bd/schemes/userSchema');

/**
 * @param {string} user - User email
 * @return {string} - success message
 */

async function checkUserQuota(user) {
  const today = new Date();
  const tomorrow = today.setUTCHours(24, 0, 0, 0);

  let response = {};

  const { quota } = await findUser.findOne(
    {
      email: user,
    },
    { quota: 1 },
  );

  console.log('quota', quota);

  if (quota <= 0) {
    const duration = intervalToDuration({
      start: new Date().getTime(),
      end: tomorrow,
    });
    const formattedDuration = formatDuration(duration, {
      delimiter: ', ',
      format: ['hours', 'minutes'],
    });

    throw new Error(`You've reached your daily gbits transaction limit. Please try again in ${formattedDuration}. `);
  }

  response = 'Quota not reached';
  return response;
}

module.exports = checkUserQuota;
