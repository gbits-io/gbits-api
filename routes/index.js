const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('No one\'s home...');
});

module.exports = router;
