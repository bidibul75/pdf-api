// src/routes/pdf.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { buildClientsPdf } from '../services/buildClientsPdf.js';

const router = Router();

/**
 * GET /api/pdf
 * Auth requise (session web / Bearer).
 * Génère un PDF prérempli + token de submit à durée limitée.
 */
router.get('/pdf', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id; // posé par requireAuth

    const { rows } = await pool.query(
      `SELECT id, nom, age
       FROM clients
       ORDER BY id ASC
       LIMIT 50`
    );

    // ids autorisés pour CE pdf / CE submit
    const allowedIds = rows.map((r) => r.id);

    const token = jwt.sign(
      {
        sub: userId,
        purpose: 'pdf-submit',
        allowedIds,
        // optionnel: version / nonce anti-rejeu
        nonce: crypto.randomUUID(),
      },
      process.env.PDF_SUBMIT_SECRET, // secret DÉDIÉ, pas le même que le login si tu peux
      { expiresIn: '30m', issuer: 'pdf-poc' }
    );

    const submitUrl = `${process.env.PUBLIC_API_URL}/api/pdf/submit`;
    // ex: https://api.exemple.com/api/pdf/submit

    const pdfBytes = await buildClientsPdf({
      clients: rows,
      token,
      submitUrl,
    });

    const filename = `clients-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // pas de cache pour un PDF personnalisé + token
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'pdf_generation_failed' });
  }
});

export default router;