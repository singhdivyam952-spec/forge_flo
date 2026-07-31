import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface PdfTableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface PdfDocumentOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  companyAddress?: string;
  orientation?: 'portrait' | 'landscape';
}

const PAGE_MARGIN = 40;

/**
 * Creates a PDFKit document pre-configured with a standard header
 * (company name + report title) ready for streaming to the client or disk.
 */
export function createPdfDocument(options: PdfDocumentOptions): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    layout: options.orientation ?? 'portrait',
    margin: PAGE_MARGIN,
    bufferPages: true,
  });

  doc.fontSize(18).font('Helvetica-Bold').text(options.companyName ?? 'Manufacturing ERP', { align: 'left' });
  if (options.companyAddress) {
    doc.fontSize(9).font('Helvetica').fillColor('#555').text(options.companyAddress);
  }
  doc.moveDown(0.5);
  doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(options.title, { align: 'left' });
  if (options.subtitle) {
    doc.fontSize(10).font('Helvetica').fillColor('#555').text(options.subtitle);
  }
  doc.fillColor('#000');
  doc.moveDown(0.5);
  drawHorizontalLine(doc);
  doc.moveDown(0.5);

  return doc;
}

export function drawHorizontalLine(doc: PDFKit.PDFDocument): void {
  const { left, right } = doc.page.margins;
  const y = doc.y;
  doc
    .moveTo(left, y)
    .lineTo(doc.page.width - right, y)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .stroke()
    .strokeColor('#000');
}

/**
 * Renders a simple tabular section into the document. Handles page breaks
 * and repeats the header row on each new page.
 */
export function drawTable<T extends Record<string, unknown>>(
  doc: PDFKit.PDFDocument,
  columns: PdfTableColumn[],
  rows: T[],
  options: { rowHeight?: number; headerFillColor?: string } = {}
): void {
  const rowHeight = options.rowHeight ?? 22;
  const headerFillColor = options.headerFillColor ?? '#f0f0f0';
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const totalDefinedWidth = columns.reduce((sum, col) => sum + (col.width ?? 0), 0);
  const flexColumns = columns.filter((c) => !c.width).length;
  const remainingWidth = Math.max(usableWidth - totalDefinedWidth, 0);
  const flexWidth = flexColumns > 0 ? remainingWidth / flexColumns : 0;

  const colWidths = columns.map((c) => c.width ?? flexWidth);

  function drawHeader(): void {
    let x = startX;
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.rect(startX, y, usableWidth, rowHeight).fill(headerFillColor).fillColor('#000');
    columns.forEach((col, i) => {
      doc.text(col.header, x + 4, y + 6, { width: colWidths[i] - 8, align: col.align ?? 'left' });
      x += colWidths[i];
    });
    doc.y = y + rowHeight;
  }

  drawHeader();

  doc.font('Helvetica').fontSize(9);
  rows.forEach((row) => {
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeader();
      doc.font('Helvetica').fontSize(9);
    }

    let x = startX;
    const y = doc.y;
    columns.forEach((col, i) => {
      const value = row[col.key];
      doc.fillColor('#000').text(value === undefined || value === null ? '' : String(value), x + 4, y + 6, {
        width: colWidths[i] - 8,
        align: col.align ?? 'left',
      });
      x += colWidths[i];
    });
    doc.y = y + rowHeight;
    doc
      .moveTo(startX, doc.y)
      .lineTo(startX + usableWidth, doc.y)
      .strokeColor('#eeeeee')
      .stroke()
      .strokeColor('#000');
  });
}

export function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const bottom = doc.page.height - doc.page.margins.bottom + 10;
    doc
      .fontSize(8)
      .fillColor('#888')
      .text(`Page ${i + 1} of ${range.count}`, doc.page.margins.left, bottom, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'center',
      });
  }
}

/** Streams a finished PDF document as an HTTP response with correct headers. */
export function streamPdfToResponse(doc: PDFKit.PDFDocument, res: Response, filename: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.end();
}

export default {
  createPdfDocument,
  drawHorizontalLine,
  drawTable,
  addPageNumbers,
  streamPdfToResponse,
};
