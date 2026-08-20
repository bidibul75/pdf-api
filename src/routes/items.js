// src/routes/items.js

import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM client ORDER BY id ASC LIMIT 100'
    );
    res.status(200).json({ ok: true, rows: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /items/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM client WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }
    res.json({ ok: true, row: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;