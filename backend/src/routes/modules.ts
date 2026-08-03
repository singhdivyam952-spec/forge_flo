import {
  Customer,
  Supplier,
  Material,
  Warehouse,
  BOM,
  Routing,
  CustomerEnquiry,
  RFQ,
  NPD,
  EngineeringChange,
  Drawing,
  CostEstimation,
  Quotation,
  SalesOrder,
  MarketingNpd,
  MarketingPpc,
  MarketingQualityAssurance,
  MarketingPackingDispatch,
  ProductionPlan,
  ProductionOrder,
  MaterialRequisition,
  MaterialIssue,
  MaterialReturn,
  MaterialConsumption,
  Scrap,
  Machine,
  MachineAllocation,
  MachineDowntime,
  WorkCenter,
  EmployeeAllocation,
  Shift,
  ShopFloorEntry,
  Rework,
  QualityInspection,
  NCR,
  CAPA,
  HeatTreatment,
  Outsourcing,
  Packing,
  Dispatch,
  PurchaseOrder,
  GoodsReceipt,
  StockTransfer,
  StockBalance,
  StockLedger,
  FileAsset,
  Approval,
  User,
  Role,
  AuditLog,
  Notification,
  Settings,
} from '../models';
import { createCrudModule } from '../utils/crudFactory';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermissions } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { materialTrackingService } from '../services/MaterialTrackingService';
import { scrapService } from '../services/ScrapService';
import { productionOrderService } from '../services/ProductionOrderService';
import { stockService } from '../services/StockService';
import { parsePagination } from '../utils/pagination';
import { AppError } from '../utils/AppError';
import { generateDocumentNumber } from '../utils/documentNumber';
import { BaseRepository } from '../repositories/BaseRepository';
import { hashPassword } from '../utils/password';

type AnyDoc = import('mongoose').Document;

function master(path: string, model: import('mongoose').Model<AnyDoc>, name: string, perm: string, search: string[], extra?: Partial<Parameters<typeof createCrudModule>[0]>) {
  return createCrudModule({
    model,
    resourceName: name,
    routePath: path,
    permissions: {
      create: `${perm}:create`,
      read: `${perm}:read`,
      update: `${perm}:update`,
      delete: `${perm}:delete`,
    },
    searchFields: search,
    ...extra,
  });
}

export function buildModuleRouters(): { path: string; router: Router }[] {
  const modules: ReturnType<typeof createCrudModule>[] = [];

  // ---- Masters ----
  modules.push(
    master('/users', User as never, 'User', 'users', ['firstName', 'lastName', 'email', 'employeeCode'], {
      populate: ['reportingManager'],
      filterKeys: ['role', 'isActive', 'department'],
      beforeCreate: async (data) => {
        if (data.password && typeof data.password === 'string') {
          data.password = await hashPassword(data.password);
        }
        if (typeof data.email === 'string') data.email = data.email.toLowerCase().trim();
        return data;
      },
      beforeUpdate: async (_id, data) => {
        if (data.password && typeof data.password === 'string') {
          data.password = await hashPassword(data.password);
        }
        delete data.refreshTokens;
        return data;
      },
    })
  );
  modules.push(master('/roles', Role as never, 'Role', 'roles', ['name', 'description']));
  modules.push(
    master('/customers', Customer as never, 'Customer', 'customers', ['code', 'name', 'gstNumber'], {
      filterKeys: ['customerType', 'isActive', 'category'],
    })
  );
  modules.push(
    master('/suppliers', Supplier as never, 'Supplier', 'suppliers', ['code', 'name', 'gstNumber'], {
      filterKeys: ['isActive'],
    })
  );
  modules.push(
    master('/materials', Material as never, 'Material', 'materials', ['code', 'name', 'drawingNumber', 'barcode', 'grade'], {
      filterKeys: ['type', 'isActive', 'category', 'valuationMethod'],
      populate: ['defaultWarehouse', 'defaultSupplier'],
    })
  );
  modules.push(
    master('/warehouses', Warehouse as never, 'Warehouse', 'inventory', ['code', 'name'], {
      filterKeys: ['type', 'isActive'],
    })
  );
  modules.push(
    master('/machines', Machine as never, 'Machine', 'maintenance', ['code', 'name'], {
      filterKeys: ['status', 'isActive', 'workCenter'],
      populate: ['workCenter'],
    })
  );
  modules.push(master('/work-centers', WorkCenter as never, 'WorkCenter', 'production', ['code', 'name']));
  modules.push(master('/shifts', Shift as never, 'Shift', 'production', ['code', 'name']));

  // ---- Engineering ----
  modules.push(
    master('/boms', BOM as never, 'BOM', 'engineering', ['version'], {
      populate: ['finishedMaterial', 'items.material'],
      filterKeys: ['status', 'finishedMaterial'],
    })
  );
  modules.push(
    master('/routings', Routing as never, 'Routing', 'engineering', ['version'], {
      populate: ['finishedMaterial', 'operations.workCenter'],
      filterKeys: ['status', 'finishedMaterial'],
    })
  );
  modules.push(
    master('/drawings', Drawing as never, 'Drawing', 'engineering', ['partNumber', 'drawingNumber', 'title'], {
      documentNumber: { field: 'drawingNumber', prefix: 'DWG' },
      filterKeys: ['status', 'partNumber'],
    })
  );
  modules.push(
    master('/npd', NPD as never, 'NPD', 'engineering', ['npdNumber', 'title'], {
      documentNumber: { field: 'npdNumber', prefix: 'NPD' },
      filterKeys: ['status'],
      populate: ['customer'],
    })
  );
  modules.push(
    master('/engineering-changes', EngineeringChange as never, 'Engineering Change', 'engineering', ['ecnNumber', 'reason'], {
      documentNumber: { field: 'ecnNumber', prefix: 'ECN' },
      filterKeys: ['status'],
    })
  );

  // ---- Sales ----
  modules.push(
    master('/enquiries', CustomerEnquiry as never, 'Enquiry', 'sales', ['enquiryNumber', 'customerId', 'customerName', 'partName', 'partNumber'], {
      documentNumber: { field: 'enquiryNumber', prefix: 'ENQ' },
      populate: ['customer', 'drawingDocument', 'cadDocument', 'materialSpecDocument'],
      filterKeys: ['status', 'priority', 'processType', 'workflowStage'],
      beforeCreate: async (data) => {
        if (!data.customerId) {
          data.customerId = await generateDocumentNumber({ prefix: 'CUST' });
        } else if (typeof data.customerId === 'string') {
          data.customerId = data.customerId.trim().toUpperCase();
        }
        if (typeof data.processType === 'string' && data.processType) {
          data.selectedProcesses = [data.processType];
        } else if (typeof data.selectedProcesses === 'string') {
          data.selectedProcesses = [data.selectedProcesses].filter(Boolean);
        }
        if (!data.workflowStage) data.workflowStage = 'EnquiryCreated';
        data.statusTimeline = [
          {
            status: 'EnquiryCreated',
            changedAt: new Date(),
          },
        ];
        return data;
      },
      beforeUpdate: async (_id, data) => {
        if (typeof data.customerId === 'string') {
          data.customerId = data.customerId.trim().toUpperCase();
        }
        if (typeof data.processType === 'string' && data.processType) {
          data.selectedProcesses = [data.processType];
        } else if (typeof data.selectedProcesses === 'string') {
          data.selectedProcesses = [data.selectedProcesses].filter(Boolean);
        }
        if (data.customerId === '') delete data.customerId;
        return data;
      },
    })
  );
  modules.push(
    master('/rfqs', RFQ as never, 'RFQ', 'sales', ['rfqNumber'], {
      documentNumber: { field: 'rfqNumber', prefix: 'RFQ' },
      populate: ['customer', 'enquiry'],
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/cost-estimations', CostEstimation as never, 'Cost Estimation', 'sales', ['estimationNumber'], {
      documentNumber: { field: 'estimationNumber', prefix: 'CE' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/quotations', Quotation as never, 'Quotation', 'sales', ['quotationNumber'], {
      documentNumber: { field: 'quotationNumber', prefix: 'QT' },
      populate: ['customer'],
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/sales-orders', SalesOrder as never, 'Sales Order', 'sales', ['soNumber', 'poReferenceNumber', 'customerId', 'customerName'], {
      documentNumber: { field: 'soNumber', prefix: 'SO' },
      populate: ['customer', 'items.material'],
      filterKeys: ['status'],
      beforeCreate: async (data) => {
        if (typeof data.customerId === 'string') data.customerId = data.customerId.trim().toUpperCase();
        return data;
      },
      beforeUpdate: async (_id, data) => {
        if (typeof data.customerId === 'string') data.customerId = data.customerId.trim().toUpperCase();
        return data;
      },
    })
  );
  modules.push(
    master('/marketing-npds', MarketingNpd as never, 'Marketing NPD', 'sales', ['npdNumber', 'customerName', 'partName', 'partNumber'], {
      documentNumber: { field: 'npdNumber', prefix: 'MNPD' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/marketing-ppc', MarketingPpc as never, 'Marketing PPC', 'sales', ['ppcNumber', 'customerName', 'partName', 'partNumber'], {
      documentNumber: { field: 'ppcNumber', prefix: 'MPPC' },
      filterKeys: ['status', 'planningType'],
    })
  );
  modules.push(
    master('/marketing-qa', MarketingQualityAssurance as never, 'Marketing QA', 'sales', ['qaNumber', 'customerName', 'partName', 'partNumber'], {
      documentNumber: { field: 'qaNumber', prefix: 'MQA' },
      filterKeys: ['status', 'jobType', 'inspectionStage'],
    })
  );
  modules.push(
    master(
      '/marketing-packing-dispatch',
      MarketingPackingDispatch as never,
      'Marketing Packing Dispatch',
      'sales',
      ['packingNumber', 'customerName', 'partName', 'partNumber'],
      {
        documentNumber: { field: 'packingNumber', prefix: 'MPD' },
        filterKeys: ['status', 'jobType'],
      }
    )
  );

  // ---- Production ----
  modules.push(
    master('/production-plans', ProductionPlan as never, 'Production Plan', 'production', ['planNumber'], {
      documentNumber: { field: 'planNumber', prefix: 'PP' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/material-requisitions', MaterialRequisition as never, 'Material Requisition', 'inventory', ['requisitionNumber'], {
      documentNumber: { field: 'requisitionNumber', prefix: 'MRQ' },
      populate: ['productionOrder', 'items.material'],
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/machine-allocations', MachineAllocation as never, 'Machine Allocation', 'production', [], {
      populate: ['machine', 'productionOrder'],
      filterKeys: ['status'],
      searchFields: [],
    })
  );
  modules.push(
    master('/machine-downtimes', MachineDowntime as never, 'Machine Downtime', 'maintenance', [], {
      populate: ['machine'],
      searchFields: ['reason'],
    })
  );
  modules.push(
    master('/employee-allocations', EmployeeAllocation as never, 'Employee Allocation', 'production', [], {
      populate: ['employee', 'productionOrder', 'machine'],
      searchFields: [],
    })
  );
  modules.push(
    master('/shop-floor', ShopFloorEntry as never, 'Shop Floor Entry', 'production', [], {
      populate: ['productionOrder', 'machine', 'operator', 'shift'],
      searchFields: [],
    })
  );

  // ---- Quality ----
  modules.push(
    master('/inspections', QualityInspection as never, 'Quality Inspection', 'quality', ['inspectionNumber'], {
      documentNumber: { field: 'inspectionNumber', prefix: 'QI' },
      filterKeys: ['status', 'inspectionType'],
    })
  );
  modules.push(
    master('/ncrs', NCR as never, 'NCR', 'quality', ['ncrNumber'], {
      documentNumber: { field: 'ncrNumber', prefix: 'NCR' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/capas', CAPA as never, 'CAPA', 'quality', ['capaNumber'], {
      documentNumber: { field: 'capaNumber', prefix: 'CAPA' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/reworks', Rework as never, 'Rework', 'quality', ['reworkNumber'], {
      documentNumber: { field: 'reworkNumber', prefix: 'RWK' },
      filterKeys: ['status'],
    })
  );

  // ---- Special ----
  modules.push(
    master('/heat-treatments', HeatTreatment as never, 'Heat Treatment', 'production', ['processNumber'], {
      documentNumber: { field: 'processNumber', prefix: 'HT' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/outsourcing', Outsourcing as never, 'Outsourcing', 'purchase', ['outsourceNumber'], {
      documentNumber: { field: 'outsourceNumber', prefix: 'OS' },
      filterKeys: ['status'],
      populate: ['supplier'],
    })
  );
  modules.push(
    master('/packing', Packing as never, 'Packing', 'sales', ['packingNumber'], {
      documentNumber: { field: 'packingNumber', prefix: 'PKG' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/dispatches', Dispatch as never, 'Dispatch', 'sales', ['dispatchNumber'], {
      documentNumber: { field: 'dispatchNumber', prefix: 'DSP' },
      filterKeys: ['status'],
      populate: ['customer', 'salesOrder'],
    })
  );

  // ---- Purchase ----
  modules.push(
    master('/purchase-orders', PurchaseOrder as never, 'Purchase Order', 'purchase', ['poNumber'], {
      documentNumber: { field: 'poNumber', prefix: 'PO' },
      populate: ['supplier', 'items.material'],
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/stock-transfers', StockTransfer as never, 'Stock Transfer', 'inventory', ['transferNumber'], {
      documentNumber: { field: 'transferNumber', prefix: 'ST' },
      filterKeys: ['status'],
    })
  );
  modules.push(
    master('/files', FileAsset as never, 'File', 'settings', ['originalName', 'filename'], {
      filterKeys: ['entityType', 'entityId'],
    })
  );
  modules.push(
    master('/approvals', Approval as never, 'Approval', 'settings', [], {
      filterKeys: ['status', 'entityType'],
      searchFields: [],
    })
  );
  modules.push(
    master('/notifications', Notification as never, 'Notification', 'notifications', ['title', 'message'], {
      filterKeys: ['isRead', 'type'],
    })
  );
  modules.push(
    master('/audit-logs', AuditLog as never, 'Audit Log', 'auditLogs', ['action', 'entityType'], {
      filterKeys: ['action', 'entityType', 'user'],
    })
  );

  return modules.map((m) => ({ path: m.routePath, router: m.router }));
}

/** Specialized routers with real business logic */
export function buildSpecialRouters(): { path: string; router: Router }[] {
  const routers: { path: string; router: Router }[] = [];

  // Production Orders
  {
    const router = Router();
    router.use(authenticate);
    const repo = new BaseRepository(ProductionOrder);

    router.get(
      '/',
      requirePermissions('production:read'),
      asyncHandler(async (req, res) => {
        const { page, limit, sort, search, filters } = parsePagination(req);
        const filter: Record<string, unknown> = {};
        if (filters.status) filter.status = filters.status;
        const result = await repo.findAll({
          filter,
          page,
          limit,
          sort,
          search,
          searchFields: ['orderNumber'],
          populate: ['material', 'salesOrder', 'bom', 'routing'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    router.get(
      '/:id',
      requirePermissions('production:read'),
      asyncHandler(async (req, res) => {
        const doc = await repo.findById(req.params.id, {
          populate: ['material', 'salesOrder', 'bom', 'routing', 'operations.machine', 'operations.operators'],
        });
        if (!doc) throw AppError.notFound('Production order not found');
        return ApiResponse.success(res, doc);
      })
    );

    router.get(
      '/:id/traceability',
      requirePermissions('production:read'),
      asyncHandler(async (req, res) => {
        const data = await productionOrderService.getTraceability(req.params.id);
        return ApiResponse.success(res, data);
      })
    );

    router.post(
      '/',
      requirePermissions('production:create'),
      asyncHandler(async (req, res) => {
        const doc = await productionOrderService.create({ ...req.body, userId: req.user!.id });
        return ApiResponse.created(res, doc);
      })
    );

    router.post(
      '/:id/release',
      requirePermissions('production:approve'),
      asyncHandler(async (req, res) => {
        const doc = await productionOrderService.release(req.params.id, req.user!.id);
        return ApiResponse.success(res, doc, 'Production order released');
      })
    );

    router.post(
      '/:id/start',
      requirePermissions('production:update'),
      asyncHandler(async (req, res) => {
        const doc = await productionOrderService.start(req.params.id, req.user!.id);
        return ApiResponse.success(res, doc, 'Production started');
      })
    );

    router.post(
      '/:id/shop-floor',
      requirePermissions('production:update'),
      asyncHandler(async (req, res) => {
        const data = await productionOrderService.logShopFloor({
          ...req.body,
          productionOrder: req.params.id,
          userId: req.user!.id,
        });
        return ApiResponse.created(res, data);
      })
    );

    router.post(
      '/:id/operations/:seq/complete',
      requirePermissions('production:update'),
      asyncHandler(async (req, res) => {
        const doc = await productionOrderService.completeOperation(req.params.id, Number(req.params.seq), req.user!.id);
        return ApiResponse.success(res, doc);
      })
    );

    router.post(
      '/:id/complete',
      requirePermissions('production:approve'),
      asyncHandler(async (req, res) => {
        const doc = await productionOrderService.completeOrder(req.params.id, req.user!.id);
        return ApiResponse.success(res, doc, 'Production order completed and FG received');
      })
    );

    router.put(
      '/:id',
      requirePermissions('production:update'),
      asyncHandler(async (req, res) => {
        const doc = await repo.updateById(req.params.id, { ...req.body, updatedBy: req.user!.id });
        if (!doc) throw AppError.notFound('Production order not found');
        return ApiResponse.success(res, doc);
      })
    );

    routers.push({ path: '/production-orders', router });
  }

  // Material Issues
  {
    const router = Router();
    router.use(authenticate);
    const repo = new BaseRepository(MaterialIssue);

    router.get(
      '/',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const { page, limit, sort, search } = parsePagination(req);
        const result = await repo.findAll({
          page,
          limit,
          sort,
          search,
          searchFields: ['issueNumber'],
          populate: ['warehouse', 'productionOrder', 'lines.material'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    router.get(
      '/:id',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const doc = await repo.findById(req.params.id, {
          populate: ['warehouse', 'productionOrder', 'lines.material', 'issuedBy'],
        });
        if (!doc) throw AppError.notFound('Material issue not found');
        return ApiResponse.success(res, doc);
      })
    );

    router.post(
      '/',
      requirePermissions('inventory:create'),
      asyncHandler(async (req, res) => {
        const doc = await materialTrackingService.createIssue({ ...req.body, userId: req.user!.id });
        return ApiResponse.created(res, doc);
      })
    );

    router.post(
      '/:id/post',
      requirePermissions('inventory:approve'),
      asyncHandler(async (req, res) => {
        const doc = await materialTrackingService.postIssue(req.params.id, req.user!.id);
        return ApiResponse.success(res, doc, 'Material issued and stock updated');
      })
    );

    routers.push({ path: '/material-issues', router });
  }

  // Material Returns
  {
    const router = Router();
    router.use(authenticate);

    router.post(
      '/',
      requirePermissions('inventory:create'),
      asyncHandler(async (req, res) => {
        const doc = await materialTrackingService.createAndPostReturn({ ...req.body, userId: req.user!.id });
        return ApiResponse.created(res, doc, 'Material returned to store');
      })
    );

    router.get(
      '/',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const repo = new BaseRepository(MaterialReturn);
        const { page, limit, sort, search } = parsePagination(req);
        const result = await repo.findAll({
          page,
          limit,
          sort,
          search,
          searchFields: ['returnNumber'],
          populate: ['warehouse', 'productionOrder', 'lines.material'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    routers.push({ path: '/material-returns', router });
  }

  // Material Consumption
  {
    const router = Router();
    router.use(authenticate);

    router.get(
      '/',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const repo = new BaseRepository(MaterialConsumption);
        const { page, limit, sort, filters } = parsePagination(req);
        const filter: Record<string, unknown> = {};
        if (filters.productionOrder) filter.productionOrder = filters.productionOrder;
        if (filters.material) filter.material = filters.material;
        const result = await repo.findAll({
          filter,
          page,
          limit,
          sort,
          populate: ['material', 'productionOrder', 'machine', 'operator'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    router.post(
      '/',
      requirePermissions('production:update'),
      asyncHandler(async (req, res) => {
        const doc = await materialTrackingService.recordConsumption({ ...req.body, userId: req.user!.id });
        return ApiResponse.created(res, doc, 'Consumption recorded');
      })
    );

    routers.push({ path: '/material-consumptions', router });
  }

  // Scrap
  {
    const router = Router();
    router.use(authenticate);
    const repo = new BaseRepository(Scrap);

    router.get(
      '/dashboard',
      requirePermissions('production:read'),
      asyncHandler(async (req, res) => {
        const from = req.query.from ? new Date(String(req.query.from)) : undefined;
        const to = req.query.to ? new Date(String(req.query.to)) : undefined;
        const data = await scrapService.getDashboard(from, to);
        return ApiResponse.success(res, data);
      })
    );

    router.get(
      '/',
      requirePermissions('production:read'),
      asyncHandler(async (req, res) => {
        const { page, limit, sort, search, filters } = parsePagination(req);
        const filter: Record<string, unknown> = {};
        if (filters.status) filter.status = filters.status;
        if (filters.scrapType) filter.scrapType = filters.scrapType;
        if (filters.productionOrder) filter.productionOrder = filters.productionOrder;
        const result = await repo.findAll({
          filter,
          page,
          limit,
          sort,
          search,
          searchFields: ['scrapNumber', 'reason'],
          populate: ['material', 'productionOrder', 'machine', 'operator', 'recoveredMaterial'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    router.post(
      '/',
      requirePermissions('production:create'),
      asyncHandler(async (req, res) => {
        const doc = await scrapService.create({ ...req.body, userId: req.user!.id });
        return ApiResponse.created(res, doc);
      })
    );

    router.post(
      '/:id/dispose',
      requirePermissions('production:update'),
      asyncHandler(async (req, res) => {
        const doc = await scrapService.dispose(req.params.id, { ...req.body, userId: req.user!.id });
        return ApiResponse.success(res, doc);
      })
    );

    routers.push({ path: '/scraps', router });
  }

  // Inventory / Stock
  {
    const router = Router();
    router.use(authenticate);

    router.get(
      '/balances',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const repo = new BaseRepository(StockBalance);
        const { page, limit, sort, filters } = parsePagination(req);
        const filter: Record<string, unknown> = {};
        if (filters.material) filter.material = filters.material;
        if (filters.warehouse) filter.warehouse = filters.warehouse;
        const result = await repo.findAll({
          filter,
          page,
          limit,
          sort,
          populate: ['material', 'warehouse'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    router.get(
      '/ledger',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const data = await stockService.getStockLedger({
          material: req.query.material as string | undefined,
          warehouse: req.query.warehouse as string | undefined,
          productionOrder: req.query.productionOrder as string | undefined,
          from: req.query.from ? new Date(String(req.query.from)) : undefined,
          to: req.query.to ? new Date(String(req.query.to)) : undefined,
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 50,
        });
        return ApiResponse.paginated(res, data.data, data.meta);
      })
    );

    router.get(
      '/available/:materialId',
      requirePermissions('inventory:read'),
      asyncHandler(async (req, res) => {
        const qty = await stockService.getAvailableQty(req.params.materialId, req.query.warehouse as string | undefined);
        return ApiResponse.success(res, { materialId: req.params.materialId, availableQty: qty });
      })
    );

    routers.push({ path: '/inventory', router });
  }

  // Goods Receipt with stock posting
  {
    const router = Router();
    router.use(authenticate);
    const repo = new BaseRepository(GoodsReceipt);

    router.get(
      '/',
      requirePermissions('purchase:read'),
      asyncHandler(async (req, res) => {
        const { page, limit, sort, search } = parsePagination(req);
        const result = await repo.findAll({
          page,
          limit,
          sort,
          search,
          searchFields: ['grnNumber', 'invoiceNumber'],
          populate: ['supplier', 'warehouse', 'purchaseOrder', 'items.material'],
        });
        return ApiResponse.paginated(res, result.data, result.meta);
      })
    );

    router.post(
      '/',
      requirePermissions('purchase:create'),
      asyncHandler(async (req, res) => {
        const grnNumber = await generateDocumentNumber({ prefix: 'GRN' });
        const doc = await GoodsReceipt.create({
          ...req.body,
          grnNumber,
          status: 'Draft',
          createdBy: req.user!.id,
        });
        return ApiResponse.created(res, doc);
      })
    );

    router.post(
      '/:id/post',
      requirePermissions('purchase:approve'),
      asyncHandler(async (req, res) => {
        const grn = await stockService.withTransaction(async (session) => {
          const doc = await GoodsReceipt.findById(req.params.id).session(session);
          if (!doc) throw AppError.notFound('GRN not found');
          if (doc.status !== 'Draft' && doc.status !== 'Received') {
            throw AppError.conflict(`Cannot post GRN in status ${doc.status}`);
          }

          for (const item of doc.items) {
            const qty = item.acceptedQty > 0 ? item.acceptedQty : item.receivedQty;
            if (qty <= 0) continue;
            await stockService.postIn(
              {
                material: item.material,
                warehouse: doc.warehouse,
                batchNumber: item.batchNumber,
                heatNumber: item.heatNumber,
                lotNumber: item.lotNumber,
                qty,
                uom: item.uom,
                unitCost: item.unitCost,
                voucherType: 'GoodsReceipt',
                voucherNumber: doc.grnNumber,
                voucherId: doc._id,
                createdBy: req.user!.id,
                remarks: `GRN ${doc.grnNumber}`,
              },
              session
            );
            item.totalValue = qty * item.unitCost;
          }

          doc.status = 'Accepted';
          doc.inspectionStatus = 'Passed';
          doc.receivedBy = req.user!.id as never;
          doc.updatedBy = req.user!.id as never;
          await doc.save({ session });
          return doc;
        });
        return ApiResponse.success(res, grn, 'GRN posted — stock updated');
      })
    );

    router.get(
      '/:id',
      requirePermissions('purchase:read'),
      asyncHandler(async (req, res) => {
        const doc = await repo.findById(req.params.id, {
          populate: ['supplier', 'warehouse', 'purchaseOrder', 'items.material'],
        });
        if (!doc) throw AppError.notFound('GRN not found');
        return ApiResponse.success(res, doc);
      })
    );

    routers.push({ path: '/goods-receipts', router });
  }

  return routers;
}
