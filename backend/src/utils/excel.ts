import ExcelJS from 'exceljs';
import { Response } from 'express';

export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  numFmt?: string;
}

export interface ExcelSheetOptions<T extends Record<string, unknown>> {
  sheetName: string;
  columns: ExcelColumn[];
  rows: T[];
  title?: string;
}

/**
 * Builds a styled worksheet (header row + optional title banner) inside the
 * given workbook from an array of plain objects.
 */
export function buildWorksheet<T extends Record<string, unknown>>(
  workbook: ExcelJS.Workbook,
  options: ExcelSheetOptions<T>
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(options.sheetName, {
    views: [{ state: 'frozen', ySplit: options.title ? 3 : 1 }],
  });

  let headerRowIndex = 1;

  if (options.title) {
    sheet.mergeCells(1, 1, 1, options.columns.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = options.title;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 26;
    headerRowIndex = 3;
  }

  sheet.columns = options.columns.map((col) => ({
    key: col.key,
    width: col.width ?? 18,
    style: col.numFmt ? { numFmt: col.numFmt } : undefined,
  }));

  const headerRow = sheet.getRow(headerRowIndex);
  options.columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.commit();

  options.rows.forEach((row) => {
    const values: Record<string, unknown> = {};
    options.columns.forEach((col) => {
      values[col.key] = row[col.key] ?? '';
    });
    const addedRow = sheet.addRow(values);
    addedRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
    });
  });

  return sheet;
}

export async function createExcelWorkbook<T extends Record<string, unknown>>(
  options: ExcelSheetOptions<T>
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manufacturing ERP';
  workbook.created = new Date();
  buildWorksheet(workbook, options);
  return workbook;
}

/** Streams a workbook as an .xlsx download response with correct headers. */
export async function streamExcelToResponse(workbook: ExcelJS.Workbook, res: Response, filename: string): Promise<void> {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

export async function parseExcelBuffer(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return workbook;
}

/** Converts a worksheet into an array of plain row objects keyed by header text. */
export function worksheetToJson(sheet: ExcelJS.Worksheet): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '').trim();
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const key = headers[colNumber];
      if (key) obj[key] = cell.value;
    });
    rows.push(obj);
  });

  return rows;
}

export default {
  buildWorksheet,
  createExcelWorkbook,
  streamExcelToResponse,
  parseExcelBuffer,
  worksheetToJson,
};
