// src/routes/pdf.js

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import buildClientsPdf from '../services/buildClientsPdf.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const html = (ok, message) => `<!doctype html><html lang="fr"><meta charset="utf-8"><title>${ok ? 'Enregistré' : 'Erreur'}</title><body><h1>${ok ? 'Enregistrement réussi' : 'Erreur'}</h1><p>${message}</p></body></html>`;

router.get('/pdf', async (req, res) => {
  try {
    if (!JWT_SECRET) return res.status(500).json({ ok: false, message: 'JWT_SECRET is not configured' });
    const { rows } = await pool.query('SELECT id, nom, age FROM client ORDER BY id ASC');
    const token = jwt.sign(
      { purpose: 'pdf-submit', allowedIds: rows.map((row) => row.id) },
      JWT_SECRET,
      { expiresIn: '24h', issuer: 'pdf-api' },
    );
    const submitUrl = process.env.PDF_SUBMIT_URL || `${req.protocol}://${req.get('host')}/pdf/submit`;
    const pdfBytes = await buildClientsPdf({ clients: rows, token, submitUrl });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="clients.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ ok: false, message: 'pdf_generation_failed' });
  }
});

router.post('/pdf/submit', async (req, res) => {
  if (!JWT_SECRET) return res.status(500).type('html').send(html(false, 'JWT_SECRET non configuré.'));
  const body = req.body || {};
  const clientId = body.clientId ?? body.id;
  const { nom, age, token } = body;
  try {
    if (!token || !clientId || typeof nom !== 'string' || !nom.trim() || nom.length > 200) {
      return res.status(400).type('html').send(html(false, 'Données invalides.'));
    }
    const parsedAge = typeof age === 'number' ? age : Number(String(age).trim());
    if (!Number.isInteger(parsedAge)) {
      return res.status(400).type('html').send(html(false, 'L’âge doit être un nombre entier.'));
    }
    const claims = jwt.verify(token, JWT_SECRET, { issuer: 'pdf-api' });
    const allowedIds = Array.isArray(claims.allowedIds) ? claims.allowedIds.map(String) : [];
    if (!allowedIds.includes(String(clientId))) {
      return res.status(403).type('html').send(html(false, 'Client non autorisé.'));
    }
    const result = await pool.query(
      'UPDATE client SET nom = $1, age = $2 WHERE id = $3',
      [nom.trim(), parsedAge, clientId],
    );
    if (result.rowCount !== 1) return res.status(404).type('html').send(html(false, 'Client introuvable.'));
    return res.status(200).type('html').send(html(true, 'Le client a été mis à jour.'));
  } catch (err) {
    console.error('PDF submit error:', err);
    const status = err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError' ? 401 : 500;
    return res.status(status).type('html').send(html(false, status === 401 ? 'Jeton invalide ou expiré.' : 'Échec de la mise à jour.'));
  }
});

export default router;