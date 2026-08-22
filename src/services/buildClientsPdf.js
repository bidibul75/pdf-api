// src/services/buildClientsPdf.js

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4 = [595.28, 841.89];
const MARGIN = 50;

function safeText(font, value) {
  const text = String(value ?? '');
  try {
    font.encodeText(text);
    return text;
  } catch {
    return [...text]
      .map((ch) => {
        try {
          font.encodeText(ch);
          return ch;
        } catch {
          return '?';
        }
      })
      .join('');
  }
}

/**
 * @param {{ clients: Array<{id:number,nom:string,age:number}>, token: string, submitUrl: string }} input
 */
export default async function buildClientsPdf(input) {
  const clients = Array.isArray(input) ? input : input?.clients ?? [];
  const token = input?.token ?? '';
  const submitUrl = input?.submitUrl ?? '';

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();
  const t = (v) => safeText(font, v);

  const formPage = pdfDoc.addPage(A4);
  const { width, height } = formPage.getSize();
  let y = height - MARGIN;

  formPage.drawText(t('Modifier un client'), {
    x: MARGIN,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 28;
  formPage.drawText(t(`Genere le ${new Date().toLocaleString('fr-FR')}`), {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 36;

  formPage.drawText(t('1. Choisir un client'), {
    x: MARGIN,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 22;

  const dropdown = form.createDropdown('clientSelect');
  dropdown.addOptions(
    clients.length
      ? clients.map((c) => t(`${c.id} - ${c.nom ?? ''}`))
      : ['(aucun client)']
  );
  dropdown.select(
    clients.length
      ? t(`${clients[0].id} - ${clients[0].nom ?? ''}`)
      : '(aucun client)'
  );
  dropdown.addToPage(formPage, {
    x: MARGIN,
    y: y - 8,
    width: width - MARGIN * 2,
    height: 22,
    font,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.6, 0.6),
  });
  dropdown.setFontSize(11);
  y -= 50;

  formPage.drawText(t('2. Modifier les champs'), {
    x: MARGIN,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 28;

  formPage.drawText(t('Nom'), { x: MARGIN, y: y + 4, size: 11, font });
  const nomField = form.createTextField('nom');
  nomField.setText(t(clients[0]?.nom ?? ''));
  nomField.setMaxLength(200);
  nomField.addToPage(formPage, {
    x: MARGIN + 70,
    y: y - 4,
    width: 320,
    height: 22,
    font,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.6, 0.6),
  });
  nomField.setFontSize(11);
  y -= 36;

  formPage.drawText(t('Age'), { x: MARGIN, y: y + 4, size: 11, font });
  const ageField = form.createTextField('age');
  ageField.setText(clients[0] != null ? String(clients[0].age ?? '') : '');
  ageField.addToPage(formPage, {
    x: MARGIN + 70,
    y: y - 4,
    width: 80,
    height: 22,
    font,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.6, 0.6),
  });
  ageField.setFontSize(11);
  y -= 50;

  const clientIdField = form.createTextField('clientId');
  clientIdField.setText(clients[0] != null ? String(clients[0].id) : '');
  clientIdField.enableReadOnly();
  clientIdField.addToPage(formPage, {
    x: MARGIN,
    y: 8,
    width: 40,
    height: 1,
    font,
    borderWidth: 0,
    textColor: rgb(1, 1, 1),
  });

  const tokenField = form.createTextField('token');
  tokenField.setText(token);
  tokenField.enableReadOnly();
  tokenField.addToPage(formPage, {
    x: MARGIN + 50,
    y: 8,
    width: 40,
    height: 1,
    font,
    borderWidth: 0,
    textColor: rgb(1, 1, 1),
  });

  const loadBtn = form.createButton('loadBtn');
  loadBtn.addToPage(t('Charger'), formPage, {
    x: MARGIN,
    y,
    width: 120,
    height: 24,
    font: fontBold,
    textColor: rgb(1, 1, 1),
    backgroundColor: rgb(0.25, 0.45, 0.75),
    borderWidth: 0,
  });

  const saveBtn = form.createButton('saveBtn');
  saveBtn.addToPage(t('Enregistrer'), formPage, {
    x: MARGIN + 140,
    y,
    width: 140,
    height: 24,
    font: fontBold,
    textColor: rgb(1, 1, 1),
    backgroundColor: rgb(0.15, 0.55, 0.3),
    borderWidth: 0,
  });

  let listPage = pdfDoc.addPage(A4);
  let ly = listPage.getHeight() - MARGIN;

  const drawHeader = (page) => {
    page.drawText(t('Liste des clients'), {
      x: MARGIN,
      y: ly,
      size: 16,
      font: fontBold,
    });
    ly -= 28;
    page.drawText('ID', { x: MARGIN, y: ly, size: 11, font: fontBold });
    page.drawText('Nom', { x: MARGIN + 60, y: ly, size: 11, font: fontBold });
    page.drawText('Age', { x: MARGIN + 360, y: ly, size: 11, font: fontBold });
    ly -= 8;
    page.drawLine({
      start: { x: MARGIN, y: ly },
      end: { x: page.getWidth() - MARGIN, y: ly },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    ly -= 18;
  };

  drawHeader(listPage);

  if (!clients.length) {
    listPage.drawText(t('Aucun enregistrement.'), {
      x: MARGIN,
      y: ly,
      size: 12,
      font,
    });
  } else {
    for (const row of clients) {
      if (ly < MARGIN + 24) {
        listPage = pdfDoc.addPage(A4);
        ly = listPage.getHeight() - MARGIN;
        drawHeader(listPage);
      }
      listPage.drawText(t(row.id), { x: MARGIN, y: ly, size: 11, font });
      listPage.drawText(t(row.nom), { x: MARGIN + 60, y: ly, size: 11, font });
      listPage.drawText(t(row.age), { x: MARGIN + 360, y: ly, size: 11, font });
      ly -= 18;
    }
  }

  const clientsMap = {};
  for (const c of clients) {
    clientsMap[String(c.id)] = { nom: String(c.nom ?? ''), age: c.age ?? '' };
  }

  const script = `
var CLIENTS = ${JSON.stringify(clientsMap)};
function loadClient() {
  var sel = String(this.getField("clientSelect").value);
  var id = sel.split(" - ")[0];
  var c = CLIENTS[id];
  if (!c) return;
  this.getField("clientId").value = id;
  this.getField("nom").value = c.nom;
  this.getField("age").value = String(c.age);
}
function saveClient() {
  loadClient();
  this.submitForm({
    cURL: ${JSON.stringify(submitUrl)},
    cSubmitAs: "HTML",
    bEmpty: true
  });
}
try {
  this.getField("clientSelect").setAction("Keystroke", "if (event.willCommit) loadClient();");
  this.getField("loadBtn").setAction("MouseUp", "loadClient();");
  this.getField("saveBtn").setAction("MouseUp", "saveClient();");
  loadClient();
} catch (e) {}
`;

  pdfDoc.addJavaScript('bootstrap', script);
  form.updateFieldAppearances(font);

  return pdfDoc.save();
}