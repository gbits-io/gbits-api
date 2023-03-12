const express = require('express');

const router = express.Router();

const shedule_controller = require('../controllers/sheduleController');

router.get('/everydayupdate', shedule_controller.everydayupdate);
router.get('/everyweekupdate', shedule_controller.everyweekupdate);
router.get('/checksolwallet', shedule_controller.checkSolWallet);

module.exports = router;
