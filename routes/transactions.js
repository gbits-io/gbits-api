const express = require('express');

const router = express.Router();

const transactions_controller = require('../controllers/transactionsController');

router.get('/list/', transactions_controller.transactions_list);
router.get('/:id', transactions_controller.transaction_details);

module.exports = router;
