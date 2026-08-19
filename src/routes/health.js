// src/routes/health.js

const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).send('Node OK - ' + process.version);
});

router.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.status(200).json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({
      ok: false,
      message: err.message,
      code: err.code || null,
    });
  }
});

router.get('/whoami', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT current_user, session_user, current_database()'
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;