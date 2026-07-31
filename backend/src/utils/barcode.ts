import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique, human-traceable code for labeling materials, batches,
 * pallets, work orders, etc. Format: `<prefix>-<yymmdd>-<random6>`.
 */
export function generateTraceCode(prefix: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `${prefix.toUpperCase()}-${yy}${mm}${dd}-${random}`;
}

/** Generates a QR code image as a base64 data URL for the given payload. */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 300,
  });
}

/** Generates a QR code image as a PNG Buffer for the given payload. */
export async function generateQrCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 300,
    type: 'png',
  });
}

export type BarcodeSymbology = 'code128' | 'ean13' | 'qrcode' | 'datamatrix';

export interface BarcodeOptions {
  symbology?: BarcodeSymbology;
  scale?: number;
  height?: number;
  includeText?: boolean;
}

/** Generates a 1D/2D barcode image as a PNG Buffer for the given text. */
export async function generateBarcodeBuffer(text: string, options: BarcodeOptions = {}): Promise<Buffer> {
  const { symbology = 'code128', scale = 3, height = 10, includeText = true } = options;

  return bwipjs.toBuffer({
    bcid: symbology,
    text,
    scale,
    height,
    includetext: includeText,
    textxalign: 'center',
  });
}

/** Generates a barcode image as a base64 data URL. */
export async function generateBarcodeDataUrl(text: string, options: BarcodeOptions = {}): Promise<string> {
  const buffer = await generateBarcodeBuffer(text, options);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export default {
  generateTraceCode,
  generateQrCodeDataUrl,
  generateQrCodeBuffer,
  generateBarcodeBuffer,
  generateBarcodeDataUrl,
};
