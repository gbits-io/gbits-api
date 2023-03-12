const express = require('express');

const router = express.Router();

const auth_controller = require('../controllers/authController');

router.post('/user', auth_controller.user_login);

module.exports = router;
