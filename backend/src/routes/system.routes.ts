import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermissions } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { dashboardService } from '../services/DashboardService';
import { Settings } from '../models/Settings';
import { Material, Customer, Supplier, ProductionOrder, Drawing, SalesOrder } from '../models';
import { AppError } from '../utils/AppError';
import { buildWorkbookBuffer, sendExcel, createPdfDoc, sendPdf } from '../utils/reportHelpers';
import { Scrap } from '../models/Scrap';
import { StockLedger } from '../models/StockLedger';
import { MaterialConsumption } from '../models/MaterialConsumption';
import { Machine } from '../models/Machine';
import { ShopFloorEntry } from '../models/ShopFloorEntry';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  requirePermissions('reports:read'),
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getOverview();
    return ApiResponse.success(res, data);
  })
);

router.get(
  '/settings',
  authenticate,
  requirePermissions('settings:read'),
  asyncHandler(async (_req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return ApiResponse.success(res, settings);
  })
);

router.put(
  '/settings',
  authenticate,
  requirePermissions('settings:update'),
  asyncHandler(async (req, res) => {
    const settings = await Settings.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });
    return ApiResponse.success(res, settings, 'Settings updated');
  })
);

router.get(
  '/search',
  authenticate,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) throw AppError.badRequest('Search query is required');
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [materials, customers, suppliers, orders, drawings, salesOrders] = await Promise.all([
      Material.find({
        $or: [{ code: regex }, { name: regex }, { barcode: regex }, { drawingNumber: regex }, { partNumber: regex } as never],
      })
        .limit(10)
        .select('code name type barcode drawingNumber')
        .lean(),
      Customer.find({ $or: [{ code: regex }, { name: regex }] })
        .limit(8)
        .select('code name')
        .lean(),
      Supplier.find({ $or: [{ code: regex }, { name: regex }] })
        .limit(8)
        .select('code name')
        .lean(),
      ProductionOrder.find({ orderNumber: regex })
        .limit(8)
        .select('orderNumber status qty qtyCompleted')
        .populate('material', 'code name')
        .lean(),
      Drawing.find({ $or: [{ drawingNumber: regex }, { partNumber: regex }, { title: regex }] })
        .limit(8)
        .select('drawingNumber partNumber title revision')
        .lean(),
      SalesOrder.find({ $or: [{ soNumber: regex }, { poReferenceNumber: regex }] })
        .limit(8)
        .select('soNumber status totalAmount poReferenceNumber')
        .lean(),
    ]);

    return ApiResponse.success(res, {
      materials,
      customers,
      suppliers,
      productionOrders: orders,
      drawings,
      salesOrders,
    });
  })
);

router.get(
  '/reports/material-consumption',
  authenticate,
  requirePermissions('reports:export'),
  asyncHandler(async (req, res) => {
    const format = String(req.query.format || 'json');
    const rows = await MaterialConsumption.find()
      .populate('material', 'code name')
      .populate('productionOrder', 'orderNumber')
      .limit(5000)
      .lean();

    const flat = rows.map((r) => ({
      productionOrder: (r.productionOrder as { orderNumber?: string })?.orderNumber || '',
      material: (r.material as { code?: string })?.code || '',
      qtyIssued: r.qtyIssued,
      qtyConsumed: r.qtyConsumed,
      qtyReturned: r.qtyReturned,
      qtyScrap: r.qtyScrap,
      qtyBalance: r.qtyBalance,
      uom: r.uom,
      date: r.consumptionDate,
    }));

    if (format === 'excel') {
      const buf = await buildWorkbookBuffer('Material Consumption', flat);
      return sendExcel(res, buf, 'material-consumption.xlsx');
    }
    if (format === 'csv') {
      const header = Object.keys(flat[0] || { a: 1 }).join(',');
      const body = flat.map((r) => Object.values(r).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=material-consumption.csv');
      return res.send(`${header}\n${body}`);
    }
    if (format === 'pdf') {
      const doc = createPdfDoc('Material Consumption Report');
      flat.slice(0, 40).forEach((r) => {
        doc.fontSize(9).text(
          `${r.productionOrder} | ${r.material} | Issued:${r.qtyIssued} Cons:${r.qtyConsumed} Scrap:${r.qtyScrap} Bal:${r.qtyBalance}`
        );
      });
      return sendPdf(res, doc, 'material-consumption.pdf');
    }
    return ApiResponse.success(res, flat);
  })
);

router.get(
  '/reports/scrap-analysis',
  authenticate,
  requirePermissions('reports:export'),
  asyncHandler(async (req, res) => {
    const format = String(req.query.format || 'json');
    const rows = await Scrap.find().populate('material', 'code name').populate('productionOrder', 'orderNumber').limit(5000).lean();
    const flat = rows.map((r) => ({
      scrapNumber: r.scrapNumber,
      type: r.scrapType,
      material: (r.material as { code?: string })?.code || '',
      productionOrder: (r.productionOrder as { orderNumber?: string })?.orderNumber || '',
      weight: r.weight,
      recoveredQty: r.recoveredQty,
      saleValue: r.saleValue,
      status: r.status,
      date: r.scrapDate,
    }));
    if (format === 'excel') {
      const buf = await buildWorkbookBuffer('Scrap Analysis', flat);
      return sendExcel(res, buf, 'scrap-analysis.xlsx');
    }
    return ApiResponse.success(res, flat);
  })
);

router.get(
  '/reports/traceability/:productionOrderId',
  authenticate,
  requirePermissions('reports:read'),
  asyncHandler(async (req, res) => {
    const { productionOrderService } = await import('../services/ProductionOrderService');
    const data = await productionOrderService.getTraceability(req.params.productionOrderId);
    const format = String(req.query.format || 'json');
    if (format === 'pdf') {
      const doc = createPdfDoc(`Traceability - ${(data.productionOrder as { orderNumber?: string }).orderNumber}`);
      doc.fontSize(11).text(`Yield: ${data.materialFlow.yieldPercent}%`);
      doc.text(`Scrap: ${data.materialFlow.scrapPercent}%`);
      doc.text(`Recovery: ${data.materialFlow.recoveryPercent}%`);
      doc.moveDown();
      doc.text('Stock Ledger:');
      (data.stockLedger as Array<{ voucherType: string; qtyIn: number; qtyOut: number }>).slice(0, 50).forEach((l) => {
        doc.fontSize(9).text(`${l.voucherType} IN:${l.qtyIn} OUT:${l.qtyOut}`);
      });
      return sendPdf(res, doc, 'traceability.pdf');
    }
    return ApiResponse.success(res, data);
  })
);

router.get(
  '/reports/machine-utilization',
  authenticate,
  requirePermissions('reports:read'),
  asyncHandler(async (_req, res) => {
    const machines = await Machine.find({ isActive: true }).select('code name status').lean();
    const entries = await ShopFloorEntry.aggregate([
      {
        $group: {
          _id: '$machine',
          qty: { $sum: '$qtyCompleted' },
          hours: {
            $sum: {
              $divide: [{ $subtract: [{ $ifNull: ['$endTime', new Date()] }, '$startTime'] }, 3600000],
            },
          },
        },
      },
    ]);
    const map = new Map(entries.map((e) => [String(e._id), e]));
    const data = machines.map((m) => ({
      ...m,
      qtyCompleted: map.get(String(m._id))?.qty || 0,
      hours: Number((map.get(String(m._id))?.hours || 0).toFixed(2)),
    }));
    return ApiResponse.success(res, data);
  })
);

router.get(
  '/reports/inventory',
  authenticate,
  requirePermissions('reports:read'),
  asyncHandler(async (req, res) => {
    const format = String(req.query.format || 'json');
    const { StockBalance } = await import('../models/StockBalance');
    const rows = await StockBalance.find()
      .populate('material', 'code name type uom')
      .populate('warehouse', 'code name type')
      .lean();
    const flat = rows.map((r) => ({
      material: (r.material as { code?: string })?.code,
      materialName: (r.material as { name?: string })?.name,
      warehouse: (r.warehouse as { code?: string })?.code,
      batch: r.batchNumber,
      heat: r.heatNumber,
      lot: r.lotNumber,
      rack: r.rack,
      qty: r.qty,
      reserved: r.reservedQty,
      unitCost: r.unitCost,
      totalValue: r.totalValue,
      uom: r.uom,
    }));
    if (format === 'excel') {
      const buf = await buildWorkbookBuffer('Inventory', flat);
      return sendExcel(res, buf, 'inventory.xlsx');
    }
    return ApiResponse.success(res, flat);
  })
);

router.get(
  '/reports/stock-ledger',
  authenticate,
  requirePermissions('reports:read'),
  asyncHandler(async (req, res) => {
    const rows = await StockLedger.find()
      .sort({ transactionDate: -1 })
      .limit(2000)
      .populate('material', 'code name')
      .populate('warehouse', 'code name')
      .lean();
    return ApiResponse.success(res, rows);
  })
);

export default router;
