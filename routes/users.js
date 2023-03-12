const express = require('express');

const router = express.Router();

const user_controller = require('../controllers/usersController');
const jwtVerify = require('../middlewares/jwtVerify');

router.get('/:id', [jwtVerify], user_controller.user_detail);

module.exports = router;
