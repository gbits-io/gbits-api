const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({});

const transfers_controller = require('../controllers/transfersController');
const crypto_controller = require('../controllers/cryptoController');
const jwtVerify = require('../middlewares/jwtVerify');

router.post('/send', [upload.none(), jwtVerify], transfers_controller.send);

router.get('/send/smtp', transfers_controller.smtp);

router.post('/amp-spl-withdrawal', [upload.none(), jwtVerify], crypto_controller.amp_spl_withdrawal);

module.exports = router;
