const express = require('express');
const router = express.Router();
const { getData } = require('../controllers/dataController');

router.post('/view-dashboard', getData);

module.exports = router;
