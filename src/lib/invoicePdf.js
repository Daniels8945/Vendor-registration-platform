import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a formatted invoice PDF.
 * Works in both vendor portal and admin portal.
 *
 * @param {object} invoice  - The invoice object (camelCase fields from API)
 * @param {object} settings - { companyName, companyEmail, companyPhone, companyAddress, currency }
 */
export function downloadInvoicePdf(invoice, settings = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const companyName    = settings.companyName    || 'Vendor Platform';
  const companyEmail   = settings.companyEmail   || '';
  const companyPhone   = settings.companyPhone   || '';
  const companyAddress = settings.companyAddress || '';
  const currency       = settings.currency       || 'NGN';

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const col2 = pageW / 2 + 4;
  let y = margin;

  // ── Helper functions ────────────────────────────────────────────────────────

  const fmt = (amt) => {
    try {
      const localeMap = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE' };
      return new Intl.NumberFormat(localeMap[currency] || 'en-US', { style: 'currency', currency }).format(Number(amt) || 0);
    } catch {
      return `${currency} ${Number(amt).toFixed(2)}`;
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const line = (x1, y1, x2, y2, color = [200, 200, 200]) => {
    doc.setDrawColor(...color);
    doc.line(x1, y1, x2, y2);
  };

  const text = (str, x, yPos, opts = {}) => {
    doc.text(String(str ?? '—'), x, yPos, opts);
  };

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  text('INVOICE', margin, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  text(companyName, margin, 22);
  if (companyEmail)   text(companyEmail,   margin, 27);
  if (companyPhone)   text(companyPhone,   margin, 32);
  if (companyAddress) text(companyAddress, col2,   22);

  y = 46;

  // ── Invoice meta block ──────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  text('Invoice Details', margin, y);
  line(margin, y + 1.5, pageW - margin, y + 1.5, [37, 99, 235]);
  y += 7;

  const meta = [
    ['Invoice #',   invoice.invoiceNumber || invoice.id],
    ['Status',      invoice.status        || '—'],
    ['Date Issued', fmtDate(invoice.submittedAt || invoice.createdAt)],
    ['Due Date',    fmtDate(invoice.dueDate)],
  ];
  if (invoice.serviceName) meta.push(['Service', invoice.serviceName]);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  meta.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    text(value, margin + 30, y);
    y += 6;
  });

  y += 4;

  // ── Vendor / Bill to ────────────────────────────────────────────────────────
  const leftX  = margin;
  const rightX = col2;
  const blockY = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  text('From (Vendor)', leftX, blockY);
  text('Description', rightX, blockY);
  line(leftX,  blockY + 1.5, leftX  + 72, blockY + 1.5, [37, 99, 235]);
  line(rightX, blockY + 1.5, pageW - margin, blockY + 1.5, [37, 99, 235]);

  y = blockY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const vendorLines = [
    invoice.vendorName || invoice.companyName || invoice.vendorCode || '—',
    invoice.vendorCode || '',
  ].filter(Boolean);

  vendorLines.forEach(l => { text(l, leftX, y); y += 5.5; });

  // Description on right side (reset y to blockY + 7)
  let descY = blockY + 7;
  if (invoice.description) {
    const wrapped = doc.splitTextToSize(invoice.description, pageW - rightX - margin);
    doc.text(wrapped, rightX, descY);
    descY += wrapped.length * 5.5;
  }
  if (invoice.notes) {
    doc.setTextColor(100, 100, 100);
    const noteLines = doc.splitTextToSize(`Notes: ${invoice.notes}`, pageW - rightX - margin);
    doc.text(noteLines, rightX, descY);
    doc.setTextColor(30, 30, 30);
  }

  y = Math.max(y, descY) + 6;

  // ── Line items table ─────────────────────────────────────────────────────────
  const lineItems = invoice.lineItems || invoice.line_items || [];
  const hasItems = lineItems.length > 0;

  if (hasItems) {
    // Table header
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(margin, y, pageW - 2 * margin, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    const col = {
      desc:  margin + 2,
      qty:   pageW - margin - 62,
      price: pageW - margin - 38,
      amt:   pageW - margin - 2,
    };
    text('Description', col.desc,  y + 5.5);
    text('Qty',         col.qty,   y + 5.5);
    text('Unit Price',  col.price, y + 5.5, { align: 'right' });
    text('Amount',      col.amt,   y + 5.5, { align: 'right' });

    y += 10;
    doc.setTextColor(30, 30, 30);

    lineItems.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 1, pageW - 2 * margin, 7.5, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const qty      = Number(item.quantity  || item.qty || 1);
      const price    = Number(item.unitPrice || item.unit_price || item.unitprice || 0);
      const rowAmt   = Number(item.amount    || qty * price);
      const descWrap = doc.splitTextToSize(item.description || '—', col.qty - col.desc - 4);
      doc.text(descWrap, col.desc, y + 4);
      text(qty,       col.qty,   y + 4);
      text(fmt(price),col.price, y + 4, { align: 'right' });
      text(fmt(rowAmt),col.amt,  y + 4, { align: 'right' });
      y += Math.max(descWrap.length, 1) * 6 + 2;
    });

    // Divider
    line(margin, y, pageW - margin, y, [37, 99, 235]);
    y += 5;
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalAmt = Number(invoice.amount || invoice.totalAmount || 0);

  const totalsX = pageW - margin - 60;
  const amtX    = pageW - margin;

  if (hasItems) {
    const subtotal = lineItems.reduce((s, it) => {
      const q = Number(it.quantity || it.qty || 1);
      const p = Number(it.unitPrice || it.unit_price || 0);
      return s + Number(it.amount || q * p);
    }, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text('Subtotal:', totalsX, y);
    text(fmt(subtotal), amtX, y, { align: 'right' });
    y += 6;
  }

  // Total row (highlighted)
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(totalsX - 4, y - 5, pageW - margin - totalsX + 4, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  text('Total:', totalsX, y + 1.5);
  text(fmt(totalAmt), amtX, y + 1.5, { align: 'right' });
  doc.setTextColor(30, 30, 30);

  y += 14;

  // ── Payment info ────────────────────────────────────────────────────────────
  if (invoice.status === 'Paid' && invoice.paymentDate) {
    doc.setFillColor(240, 253, 244); // green-50
    doc.roundedRect(margin, y, pageW - 2 * margin, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52); // green-800
    text('Payment Recorded', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    text(`Date: ${fmtDate(invoice.paymentDate)}`, margin + 4, y + 13);
    if (invoice.paymentMethod)    text(`Method: ${invoice.paymentMethod}`,       margin + 4, y + 18);
    if (invoice.paymentReference) text(`Reference: ${invoice.paymentReference}`, col2,       y + 13);
    if (invoice.paymentNotes)     text(`Notes: ${invoice.paymentNotes}`,         col2,       y + 18);
    doc.setTextColor(30, 30, 30);
    y += 26;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  line(margin, pageH - 16, pageW - margin, pageH - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin, pageH - 10);
  text(companyName, pageW - margin, pageH - 10, { align: 'right' });

  // ── Save ─────────────────────────────────────────────────────────────────────
  const filename = `Invoice_${invoice.invoiceNumber || invoice.id || 'export'}.pdf`;
  doc.save(filename);
}
