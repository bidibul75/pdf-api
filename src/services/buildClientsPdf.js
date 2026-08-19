// src/services/buildClientsPdf.js

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * @param {Array<{ id: number, nom: string, age: number }>} rows
 * @returns {Promise<Uint8Array>}
 */
async function buildClientsPdf(rows) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = page.getHeight() - margin;

  const draw = (text, opts = {}) => {
    const size = opts.size || 12;
    const f = opts.bold ? fontBold : font;
    page.drawText(String(text), {
      x: opts.x ?? margin,
      y,
      size,
      font: f,
      color: opts.color || rgb(0, 0, 0),
    });
    if (opts.line !== false) y -= opts.gap || size + 8;
  };

  draw('Liste des clients', { bold: true, size: 18, gap: 28 });
  draw(`Généré le ${new Date().toLocaleString('fr-FR')}`, {
    size: 10,
    color: rgb(0.4, 0.4, 0.4),
    gap: 24,
  });

  // En-têtes
  const colId = margin;
  const colNom = margin + 60;
  const colAge = margin + 320;

  page.drawText('ID', { x: colId, y, size: 12, font: fontBold });
  page.drawText('Nom', { x: colNom, y, size: 12, font: fontBold });
  page.drawText('Âge', { x: colAge, y, size: 12, font: fontBold });
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: page.getWidth() - margin, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 20;

  if (!rows.length) {
    draw('Aucun enregistrement.', { size: 12 });
  } else {
    for (const row of rows) {
      if (y < margin + 40) {
        // page suivante si besoin
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        // pour rester simple : on ne gère qu’une page ici ;
        // avec 3 lignes tu n’en auras pas besoin
        break;
      }
      page.drawText(String(row.id), { x: colId, y, size: 12, font });
      page.drawText(String(row.nom ?? ''), { x: colNom, y, size: 12, font });
      page.drawText(String(row.age ?? ''), { x: colAge, y, size: 12, font });
      y -= 22;
    }
  }

  return pdfDoc.save();
}

module.exports = { buildClientsPdf };