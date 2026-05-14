const express = require('express');
const router = express.Router();
const { getMyBalance } = require('../controllers/balanceController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/my', getMyBalance);

module.exports = router;
