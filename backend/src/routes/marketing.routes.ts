import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermissions } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { marketingService } from '../services/MarketingService';
import { uploadMarketingDocument } from '../middleware/upload';
import { buildWorkbookBuffer, createPdfDoc, sendExcel, sendPdf } from '../utils/reportHelpers';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  requirePermissions('sales:read'),
  asyncHandler(async (_req, res) => {
    return ApiResponse.success(res, await marketingService.getDashboard());
  })
);

router.get(
  '/customers/:id/overview',
  requirePermissions('customers:read'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await marketingService.getCustomerOverview(req.params.id));
  })
);

router.get(
  '/customers/:id/timeline',
  requirePermissions('customers:read'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await marketingService.getCustomerTimeline(req.params.id));
  })
);

router.get(
  '/existing-parts',
  requirePermissions('sales:read'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(
      res,
      await marketingService.searchExistingParts({
        customer: req.query.customer as string | undefined,
        partNumber: req.query.partNumber as string | undefined,
        partName: req.query.partName as string | undefined,
        drawingNumber: req.query.drawingNumber as string | undefined,
        material: req.query.material as string | undefined,
        process: req.query.process as string | undefined,
      })
    );
  })
);

router.post(
  '/files/upload',
  requirePermissions(['sales:create', 'customers:update']),
  uploadMarketingDocument.single('file'),
  asyncHandler(async (req, res) => {
    const data = await marketingService.uploadDocument({
      entityType: String(req.body.entityType),
      entityId: String(req.body.entityId),
      category: req.body.category ? String(req.body.category) : undefined,
      description: req.body.description ? String(req.body.description) : undefined,
      file: req.file!,
      userId: req.user!.id,
    });
    return ApiResponse.created(res, data, 'Document uploaded');
  })
);

router.get(
  '/files',
  requirePermissions('sales:read'),
  asyncHandler(async (req, res) => {
    const data = await marketingService.listDocuments(String(req.query.entityType), String(req.query.entityId));
    return ApiResponse.success(res, data);
  })
);

router.patch(
  '/files/:id/replace',
  requirePermissions('sales:update'),
  uploadMarketingDocument.single('file'),
  asyncHandler(async (req, res) => {
    const data = await marketingService.replaceDocument(req.params.id, req.file!, req.user!.id);
    return ApiResponse.success(res, data, 'Document replaced');
  })
);

router.delete(
  '/files/:id',
  requirePermissions('sales:delete'),
  asyncHandler(async (req, res) => {
    const data = await marketingService.deleteDocument(req.params.id, req.user!.id);
    return ApiResponse.success(res, data, 'Document deleted');
  })
);

router.post(
  '/enquiries/:id/convert-to-rfq',
  requirePermissions('sales:create'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await marketingService.convertEnquiryToRfq(req.params.id, req.user!.id));
  })
);

router.post(
  '/quotations/:id/convert-to-sales-order',
  requirePermissions('sales:create'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await marketingService.convertQuotationToSalesOrder(req.params.id, req.user!.id));
  })
);

router.get(
  '/quotations/:id/pdf',
  requirePermissions('sales:read'),
  asyncHandler(async (req, res) => {
    const quotation = await marketingService.generateQuotationPdf(req.params.id);
    const doc = createPdfDoc(`Quotation ${quotation.quotationNumber}`);
    doc.fontSize(10).text(`Customer: ${String((quotation.customer as { name?: string })?.name ?? '')}`);
    doc.text(`Date: ${new Date(String(quotation.quotationDate)).toLocaleDateString()}`);
    doc.text(`Amount: ${quotation.totalAmount} ${quotation.currency}`);
    doc.moveDown();
    quotation.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.description} | Qty: ${item.qty} ${item.uom} | Price: ${item.unitPrice}`);
    });
    sendPdf(res, doc, `${quotation.quotationNumber}.pdf`);
  })
);

router.post(
  '/quotations/:id/email',
  requirePermissions('sales:update'),
  asyncHandler(async (req, res) => {
    const recipients = Array.isArray(req.body.recipients) ? req.body.recipients.map(String) : [];
    return ApiResponse.success(res, await marketingService.emailQuotation(req.params.id, recipients, req.user!.id), 'Quotation emailed');
  })
);

router.get(
  '/reports/:reportKey',
  requirePermissions('sales:read'),
  asyncHandler(async (req, res) => {
    const reportKey = req.params.reportKey;
    const format = String(req.query.format || 'json');
    const rows = await marketingService.getReport(reportKey);

    if (format === 'excel') {
      const buffer = await buildWorkbookBuffer(`marketing-${reportKey}`, rows as Record<string, unknown>[]);
      return sendExcel(res, buffer, `${reportKey}.xlsx`);
    }

    if (format === 'pdf') {
      const doc = createPdfDoc(`Marketing Report - ${reportKey}`);
      (rows as Record<string, unknown>[]).slice(0, 80).forEach((row) => {
        doc.fontSize(9).text(JSON.stringify(row));
      });
      return sendPdf(res, doc, `${reportKey}.pdf`);
    }

    return ApiResponse.success(res, rows);
  })
);

export default router;
