import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const storageEngine = multer.memoryStorage();

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

function fileFilterFactory(allowedMimeTypes: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400, 'UNSUPPORTED_FILE_TYPE'));
    }
  };
}

const maxFileSize = env.MAX_FILE_SIZE_MB * 1024 * 1024;
const marketingMaxFileSize = 100 * 1024 * 1024;

/** Accepts a single image file (avatars, logos, product photos, etc.). */
export const uploadImage = multer({
  storage: storageEngine,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilterFactory(IMAGE_MIME_TYPES),
});

/** Accepts a single document (PDF/Word/Excel/CSV) for attachments. */
export const uploadDocument = multer({
  storage: storageEngine,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilterFactory([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES]),
});

/** Accepts any file type up to the configured size limit (internal/admin use). */
export const uploadAny = multer({
  storage: storageEngine,
  limits: { fileSize: maxFileSize },
});

/** Accepts large marketing/engineering business documents up to 100 MB. */
export const uploadMarketingDocument = multer({
  storage: storageEngine,
  limits: { fileSize: marketingMaxFileSize },
});

/** Accepts an Excel/CSV file specifically, used for bulk-import endpoints. */
export const uploadSpreadsheet = multer({
  storage: storageEngine,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilterFactory([
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ]),
});

export default { uploadImage, uploadDocument, uploadAny, uploadMarketingDocument, uploadSpreadsheet };
