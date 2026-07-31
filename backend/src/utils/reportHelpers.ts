import { createExcelWorkbook, streamExcelToResponse } from './excel';
import { createPdfDocument, streamPdfToResponse } from './pdf';
import { Response } from 'express';

export async function buildWorkbookBuffer(
  sheetName: string,
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const columns =
    rows.length > 0
      ? Object.keys(rows[0]).map((key) => ({ key, header: key, width: 18 }))
      : [{ key: 'message', header: 'Message', width: 40 }];

  const workbook = await createExcelWorkbook({
    sheetName,
    columns,
    rows: rows.length ? rows : [{ message: 'No data' }],
    title: sheetName,
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendExcel(res: Response, buffer: Buffer, filename: string): Promise<void> {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

export function sendPdf(
  res: Response,
  doc: PDFKit.PDFDocument,
  filename: string
): void {
  streamPdfToResponse(doc, res, filename);
}

export function createPdfDoc(titleOrOptions: string | import('./pdf').PdfDocumentOptions): PDFKit.PDFDocument {
  if (typeof titleOrOptions === 'string') {
    return createPdfDocument({ title: titleOrOptions });
  }
  return createPdfDocument(titleOrOptions);
}

export { createExcelWorkbook, streamExcelToResponse, streamPdfToResponse, createPdfDocument };
