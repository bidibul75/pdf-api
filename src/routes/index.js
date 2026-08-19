// src/routes/index.js

const express = require('express');
const healthRouter = require('./health');
const itemsRouter = require('./items');

const router = express.Router();

router.use(healthRouter);
router.use('/items', itemsRouter);

module.exports = router;