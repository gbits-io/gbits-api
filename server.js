/* eslint-disable */
'use strict';
/* eslint-enable */

require('dotenv').config();

// const debug = require('debug')('gbit-test:server');

const http = require('http');

// const schedule = require('node-schedule');
const mongoose = require('mongoose');
const app = require('./index');
// const UserService = require('./services/UserService');
// const SheduleService = require('./services/SheduleService');
// const transfers_controller = require('./controllers/transfersController');

/**
 * Module dependencies.
 */

const server = http.createServer(app);

/**
 * Get port from environment and store in Express.
 */

const port = process.env.PORT || '4500';
app.set('port', port);

mongoose.set('debug', true);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  // console.log(111111, process.env.GAE_INSTANCE);
  // console.log(222222, process.env.NODE_APP_INSTANCE);

  // const addr = server.address();
  // const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  // debug(`Listening on ${bind}`);
}

/**
 * Create HTTP server.
 */

async function BDconnect() {
  try {
    await mongoose.connect(`${process.env.DB_URL}`, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
  } catch (e) {
    console.log(e);
  }
}

BDconnect();
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.log(`Listen on localhost:${port}`);

  //   schedule.scheduleJob('*/2 * * * *', async () => {
  //     console.log(77777777777);
  //     transfers_controller.smtp();
  //     console.log(88888888888);
  //   });

  //   schedule.scheduleJob({ hour: 0, minute: 0, tz: 'Etc/UTC' }, async () => {
  //     SheduleService.dailySetWatchGmail();
  //     UserService.updateQuota();
  //   });
});

server.on('error', onError);
server.on('listening', onListening);
