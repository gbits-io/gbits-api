require('dotenv').config();
const { utcToZonedTime } = require('date-fns-tz');

async function getDateCET() {
  return utcToZonedTime(new Date(), 'Europe/Rome');
}

module.exports = getDateCET;
