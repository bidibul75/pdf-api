require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // utile si la connexion reste ouverte trop longtemps sur mutualisé :
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

app.get('/', (req, res) => {
  res.status(200).send('Node OK - ' + process.version);
});

app.get('/db-test', async (req, res) => {
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

app.get('/items', async (req, res) => {
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

app.get('/items/:id', async (req, res) => {
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

app.get('/whoami', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT current_user, session_user, current_database()'
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});