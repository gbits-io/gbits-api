const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const transfersRouter = require('./routes/transfers');
const transactionsRouter = require('./routes/transactions');
const sheduleRouter = require('./routes/shedule');
// const amp = require('./routes/amp');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  const { origin } = req.headers;

  // console.log('origin', origin);
  // console.log('host', req.headers.host);
  // console.log('headers', JSON.stringify(req.headers));

  if (req.headers.origin === 'http://localhost:1313' || req.headers.origin === 'https://www.gbits.io') {
    // res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-control-allow-credentials:', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept, authorization');
    // res.setHeader('Content-Type', 'application/json');
  } else {
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', `${origin}`);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
    res.header('AMP-Access-Control-Allow-Source-Origin', 'noreply@gbits.io');
  }

  next();
});

app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/shedule', sheduleRouter);
// app.use('/amp', amp);
app.use('/api/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  console.log('Error message: ', err.message);
  res.status(err.status || 500);
  res.json(err.message);
});

module.exports = app;
