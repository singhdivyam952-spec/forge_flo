import mongoose, { Types } from 'mongoose';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';
import { Customer } from '../models/Customer';
import { CustomerEnquiry } from '../models/CustomerEnquiry';
import { RFQ } from '../models/RFQ';
import { CostEstimation } from '../models/CostEstimation';
import { Quotation } from '../models/Quotation';
import { SalesOrder } from '../models/SalesOrder';
import { ProductionOrder } from '../models/ProductionOrder';
import { Dispatch } from '../models/Dispatch';
import { Packing } from '../models/Packing';
import { FileAsset } from '../models/FileAsset';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { generateDocumentNumber } from '../utils/documentNumber';
import { env } from '../config/env';

function toObjectId(id?: string): Types.ObjectId | undefined {
  return id ? new Types.ObjectId(id) : undefined;
}

export class MarketingService {
  async getDashboard() {
    const startOfMonth = dayjs().startOf('month').toDate();
    const startOfYear = dayjs().startOf('year').toDate();

    const [
      totalCustomers,
      activeCustomers,
      newEnquiries,
      pendingRfqs,
      pendingQuotations,
      approvedQuotations,
      salesOrdersCreated,
      monthlyEnquiries,
      quotationStatus,
      salesOrderTrend,
      topCustomers,
      recentActivities,
      notifications,
    ] = await Promise.all([
      Customer.countDocuments({ isDeleted: { $ne: true } }),
      Customer.countDocuments({ isDeleted: { $ne: true }, isActive: true }),
      CustomerEnquiry.countDocuments({ status: { $in: ['Open', 'UnderReview'] }, isDeleted: { $ne: true } }),
      RFQ.countDocuments({ status: { $in: ['Draft', 'Sent', 'Received', 'UnderEvaluation'] }, isDeleted: { $ne: true } }),
      Quotation.countDocuments({ status: { $in: ['Draft', 'Sent', 'Revised'] }, isDeleted: { $ne: true } }),
      Quotation.countDocuments({ status: { $in: ['Accepted'] }, isDeleted: { $ne: true } }),
      SalesOrder.countDocuments({ createdAt: { $gte: startOfMonth }, isDeleted: { $ne: true } }),
      CustomerEnquiry.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$enquiryDate' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Quotation.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),
      SalesOrder.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
            count: { $sum: 1 },
            value: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SalesOrder.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$customer', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      ]),
      this.getRecentActivities(),
      Notification.find({ module: 'marketing' }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const convertedCount = await SalesOrder.countDocuments({ createdAt: { $gte: startOfMonth }, isDeleted: { $ne: true } });
    const enquiryMonthCount = await CustomerEnquiry.countDocuments({ enquiryDate: { $gte: startOfMonth }, isDeleted: { $ne: true } });

    return {
      cards: {
        totalCustomers,
        activeCustomers,
        newEnquiries,
        pendingRfqs,
        pendingQuotations,
        approvedQuotations,
        salesOrdersCreated,
        monthlyConversionRate: enquiryMonthCount > 0 ? Number(((convertedCount / enquiryMonthCount) * 100).toFixed(2)) : 0,
        todaysEnquiries: await CustomerEnquiry.countDocuments({ enquiryDate: { $gte: dayjs().startOf('day').toDate() } }),
        pendingEngineering: await RFQ.countDocuments({ currentStatus: { $in: ['AwaitingEngineering', 'FeasibilityPending'] } }),
      },
      charts: {
        monthlyEnquiries,
        quotationStatus,
        salesOrderTrend,
      },
      quickActions: [
        { key: 'customer', label: 'New Customer', path: '/sales/customers' },
        { key: 'enquiry', label: 'New Enquiry', path: '/sales/enquiries' },
        { key: 'rfq', label: 'Create RFQ', path: '/sales/rfqs' },
        { key: 'quotation', label: 'Create Quotation', path: '/sales/quotations' },
      ],
      widgets: {
        topCustomers,
        recentActivities,
        notifications,
      },
    };
  }

  private async getRecentActivities() {
    const [enquiries, quotations, orders] = await Promise.all([
      CustomerEnquiry.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'code name').lean(),
      Quotation.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'code name').lean(),
      SalesOrder.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'code name').lean(),
    ]);

    return [
      ...enquiries.map((e) => ({ type: 'Enquiry', number: e.enquiryNumber, status: e.status, date: e.createdAt, customer: e.customer })),
      ...quotations.map((q) => ({ type: 'Quotation', number: q.quotationNumber, status: q.status, date: q.createdAt, customer: q.customer })),
      ...orders.map((o) => ({ type: 'SalesOrder', number: o.soNumber, status: o.status, date: o.createdAt, customer: o.customer })),
    ]
      .sort((a, b) => +new Date(String(b.date)) - +new Date(String(a.date)))
      .slice(0, 10);
  }

  async getCustomerOverview(customerId: string) {
    const customer = await Customer.findById(customerId)
      .populate('documents')
      .populate('salesPerson', 'firstName lastName email')
      .lean();
    if (!customer) throw AppError.notFound('Customer not found');

    const [enquiries, quotations, salesOrders] = await Promise.all([
      CustomerEnquiry.find({ customer: customerId }).sort({ enquiryDate: -1 }).limit(50).lean(),
      Quotation.find({ customer: customerId }).sort({ quotationDate: -1 }).limit(50).lean(),
      SalesOrder.find({ customer: customerId }).sort({ orderDate: -1 }).limit(50).lean(),
    ]);

    return {
      customer,
      salesHistory: salesOrders,
      quotationHistory: quotations,
      orderHistory: salesOrders,
      enquiryHistory: enquiries,
    };
  }

  async getCustomerTimeline(customerId: string) {
    const [customer, enquiries, rfqs, quotations, salesOrders, productionOrders, dispatches] = await Promise.all([
      Customer.findById(customerId).lean(),
      CustomerEnquiry.find({ customer: customerId }).lean(),
      RFQ.find({ customer: customerId }).lean(),
      Quotation.find({ customer: customerId }).lean(),
      SalesOrder.find({ customer: customerId }).lean(),
      SalesOrder.find({ customer: customerId }).select('_id soNumber').lean(),
      Dispatch.find({ customer: customerId }).lean(),
    ]);
    if (!customer) throw AppError.notFound('Customer not found');

    const salesOrderIds = salesOrders.map((s) => s._id);
    const production = await ProductionOrder.find({ salesOrder: { $in: salesOrderIds } }).lean();
    const packings = await Packing.find({ salesOrder: { $in: salesOrderIds } }).lean();

    const events = [
      { type: 'CustomerCreated', label: customer.name, date: customer.createdAt, entityType: 'Customer', entityId: customer._id },
      ...enquiries.map((e) => ({ type: 'Enquiry', label: e.enquiryNumber, date: e.enquiryDate, entityType: 'CustomerEnquiry', entityId: e._id })),
      ...rfqs.map((r) => ({ type: 'RFQ', label: r.rfqNumber, date: r.rfqDate, entityType: 'RFQ', entityId: r._id })),
      ...quotations.map((q) => ({ type: 'Quotation', label: q.quotationNumber, date: q.quotationDate, entityType: 'Quotation', entityId: q._id })),
      ...salesOrders.map((s) => ({ type: 'SalesOrder', label: s.soNumber, date: s.orderDate, entityType: 'SalesOrder', entityId: s._id })),
      ...production.map((p) => ({ type: 'ProductionOrder', label: p.orderNumber, date: p.createdAt, entityType: 'ProductionOrder', entityId: p._id })),
      ...packings.map((p) => ({ type: 'Packing', label: p.packingNumber, date: p.packingDate, entityType: 'Packing', entityId: p._id })),
      ...dispatches.map((d) => ({ type: 'Dispatch', label: d.dispatchNumber, date: d.dispatchDate, entityType: 'Dispatch', entityId: d._id })),
    ]
      .sort((a, b) => +new Date(String(a.date)) - +new Date(String(b.date)));

    return { customer, events };
  }

  async searchExistingParts(filters: {
    customer?: string;
    partNumber?: string;
    partName?: string;
    drawingNumber?: string;
    material?: string;
    process?: string;
  }) {
    const regexFrom = (value?: string) => (value ? new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined);
    const partRegex = regexFrom(filters.partNumber || filters.partName);
    const drawingRegex = regexFrom(filters.drawingNumber);
    const materialRegex = regexFrom(filters.material);
    const processRegex = regexFrom(filters.process);

    const quotationMatch: Record<string, unknown> = {};
    if (filters.customer) quotationMatch.customer = toObjectId(filters.customer);
    if (partRegex) quotationMatch.$or = [{ 'items.description': partRegex }];

    const quotations = await Quotation.find(quotationMatch)
      .populate('customer', 'code name')
      .populate('costEstimation')
      .limit(30)
      .lean();

    const salesOrders = await SalesOrder.find(filters.customer ? { customer: filters.customer } : {})
      .populate('customer', 'code name')
      .populate('quotation')
      .limit(30)
      .lean();

    const productionHistory = await ProductionOrder.find()
      .populate('material', 'code name drawingNumber')
      .limit(30)
      .lean();

    const results = quotations
      .map((quotation) => ({
        quotation,
        previousCost: (quotation.costEstimation as { totalCost?: number; unitCost?: number } | undefined) ?? null,
        previousSalesOrders: salesOrders.filter((order) => String(order.quotation) === String(quotation._id)),
        productionHistory: productionHistory.filter((row) => {
          const mat = row.material as { code?: string; name?: string; drawingNumber?: string } | null;
          if (!mat) return false;
          if (partRegex && !partRegex.test(`${mat.code ?? ''} ${mat.name ?? ''}`)) return false;
          if (drawingRegex && !drawingRegex.test(mat.drawingNumber ?? '')) return false;
          if (materialRegex && !materialRegex.test(`${mat.code ?? ''} ${mat.name ?? ''}`)) return false;
          if (processRegex && !row.operations.some((op) => processRegex.test(op.processType || op.operationName || ''))) return false;
          return true;
        }),
      }))
      .filter((row) => row.productionHistory.length > 0 || row.previousSalesOrders.length > 0 || row.previousCost);

    return { results, createNewNpdSuggested: results.length === 0 };
  }

  async uploadDocument(input: {
    entityType: string;
    entityId: string;
    category?: string;
    description?: string;
    file: Express.Multer.File;
    userId: string;
  }) {
    const { storage } = await import('../config/storage');
    const upload = await storage.upload({
      buffer: input.file.buffer,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      folder: `marketing/${input.entityType.toLowerCase()}`,
    });

    const currentVersion =
      (await FileAsset.findOne({
        entityType: input.entityType,
        entityId: input.entityId,
        category: input.category,
        isDeleted: { $ne: true },
      })
        .sort({ version: -1 })
        .lean())?.version ?? 0;

    const fileAsset = await FileAsset.create({
      filename: upload.key.split('/').pop(),
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      size: input.file.size,
      path: upload.url,
      key: upload.key,
      storageType: env.STORAGE_TYPE,
      entityType: input.entityType,
      entityId: input.entityId,
      category: input.category,
      description: input.description,
      version: currentVersion + 1,
      previewUrl: upload.url,
      uploadedBy: input.userId,
      createdBy: input.userId,
      updatedBy: input.userId,
      isActive: true,
    });

    await this.linkAttachment(input.entityType, input.entityId, String(fileAsset._id));
    return fileAsset;
  }

  async listDocuments(entityType: string, entityId: string) {
    return FileAsset.find({ entityType, entityId, isDeleted: { $ne: true } }).sort({ category: 1, version: -1 }).lean();
  }

  async replaceDocument(fileId: string, file: Express.Multer.File, userId: string) {
    const current = await FileAsset.findById(fileId);
    if (!current) throw AppError.notFound('File not found');
    current.isDeleted = true;
    current.deletedAt = new Date();
    current.deletedBy = new Types.ObjectId(userId);
    await current.save();

    return this.uploadDocument({
      entityType: current.entityType || 'General',
      entityId: String(current.entityId),
      category: current.category,
      description: current.description,
      file,
      userId,
    });
  }

  async deleteDocument(fileId: string, userId: string) {
    const current = await FileAsset.findById(fileId);
    if (!current) throw AppError.notFound('File not found');
    current.isDeleted = true;
    current.deletedAt = new Date();
    current.deletedBy = new Types.ObjectId(userId);
    await current.save();
    return current;
  }

  async getEnquiryByCustomerId(customerId: string) {
    const code = customerId.trim().toUpperCase();
    if (!code) throw AppError.badRequest('Customer ID is required');

    const enquiry = await CustomerEnquiry.findOne({
      customerId: code,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!enquiry) throw AppError.notFound(`No enquiry found for customer ID ${code}`);

    return {
      customerId: enquiry.customerId,
      customerName: enquiry.customerName,
      partName: enquiry.partName ?? '',
      partNumber: enquiry.partNumber ?? '',
      customerDrawingNo: enquiry.customerDrawingNo ?? '',
      contactPerson: enquiry.contactPerson ?? '',
      enquiryNumber: enquiry.enquiryNumber,
      enquiryDate: enquiry.enquiryDate,
      rfqDate: enquiry.rfqDate,
      priority: enquiry.priority,
      processType: enquiry.processType,
      selectedProcesses: enquiry.selectedProcesses,
      quantity: enquiry.quantity,
      deliverySchedule: enquiry.deliverySchedule,
      materialSpecification: enquiry.materialSpecification,
      marketingHead: enquiry.marketingHead,
      workflowStage: enquiry.workflowStage,
      existingPartMatched: enquiry.existingPartMatched,
      remarks: enquiry.remarks,
      enquiryMongoId: enquiry._id,
      customer: enquiry.customer,
    };
  }

  async setExistingPartDecision(
    enquiryId: string,
    payload: { existingPartMatched: boolean; existingPartReference?: string },
    userId: string
  ) {
    const enquiry = await CustomerEnquiry.findById(enquiryId);
    if (!enquiry) throw AppError.notFound('Enquiry not found');

    enquiry.existingPartChecked = true;
    enquiry.existingPartMatched = payload.existingPartMatched;
    enquiry.existingPartReference = payload.existingPartReference;
    enquiry.workflowStage = payload.existingPartMatched ? 'Feasibility' : 'NPD';
    enquiry.statusTimeline.push({
      status: payload.existingPartMatched ? 'ExistingPartMatched' : 'NewPartNPD',
      changedAt: new Date(),
      changedBy: new Types.ObjectId(userId),
      remarks: payload.existingPartReference,
    } as never);
    enquiry.updatedBy = new Types.ObjectId(userId) as never;
    await enquiry.save();
    return enquiry;
  }

  async createNpdFromEnquiry(enquiryId: string, userId: string) {
    const { MarketingNpd } = await import('../models/MarketingNpd');
    const enquiry = await CustomerEnquiry.findById(enquiryId);
    if (!enquiry) throw AppError.notFound('Enquiry not found');

    if (enquiry.linkedNpd) {
      const existing = await MarketingNpd.findById(enquiry.linkedNpd);
      if (existing) return existing;
    }

    const npdNumber = await generateDocumentNumber({ prefix: 'MNPD' });
    const npd = await MarketingNpd.create({
      npdNumber,
      customerName: enquiry.customerName,
      customerId: enquiry.customerId,
      partName: enquiry.partName || enquiry.customerName,
      partNumber: enquiry.partNumber || enquiry.enquiryNumber,
      customerDrawingNo: enquiry.customerDrawingNo,
      feasibilityStudy: false,
      status: 'Draft',
      remarks: `Created from enquiry ${enquiry.enquiryNumber}`,
      createdBy: userId,
      updatedBy: userId,
    });

    enquiry.linkedNpd = npd._id as Types.ObjectId;
    enquiry.existingPartChecked = true;
    enquiry.existingPartMatched = false;
    enquiry.workflowStage = 'NPD';
    enquiry.status = 'UnderReview';
    enquiry.statusTimeline.push({
      status: 'NPDCreated',
      changedAt: new Date(),
      changedBy: new Types.ObjectId(userId),
      remarks: npdNumber,
    } as never);
    enquiry.updatedBy = new Types.ObjectId(userId) as never;
    await enquiry.save();

    return npd;
  }

  async advanceEnquiryWorkflow(
    enquiryId: string,
    stage: string,
    userId: string,
    remarks?: string
  ) {
    const enquiry = await CustomerEnquiry.findById(enquiryId);
    if (!enquiry) throw AppError.notFound('Enquiry not found');

    const allowed = [
      'EnquiryCreated',
      'DocumentsUploaded',
      'ExistingPartCheck',
      'NPD',
      'Feasibility',
      'CostEstimation',
      'Quotation',
      'PurchaseOrder',
      'PPC',
      'PDI',
      'PackingDispatch',
      'Completed',
      'Rejected',
    ];
    if (!allowed.includes(stage)) throw AppError.badRequest('Invalid workflow stage');

    enquiry.workflowStage = stage as typeof enquiry.workflowStage;
    if (stage === 'Rejected') enquiry.status = 'Lost';
    if (stage === 'Completed') enquiry.status = 'Converted';
    if (stage === 'Quotation') enquiry.status = 'Quoted';
    enquiry.statusTimeline.push({
      status: stage,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(userId),
      remarks,
    } as never);
    enquiry.updatedBy = new Types.ObjectId(userId) as never;
    await enquiry.save();
    return enquiry;
  }

  async convertEnquiryToRfq(enquiryId: string, userId: string) {
    return mongoose.connection.transaction(async (session) => {
      const enquiry = await CustomerEnquiry.findById(enquiryId).session(session);
      if (!enquiry) throw AppError.notFound('Enquiry not found');
      if (!enquiry.customer) {
        throw AppError.badRequest('This enquiry has no linked master customer; RFQ conversion needs a master Customer record.');
      }

      const rfqNumber = await generateDocumentNumber({ prefix: 'RFQ' });
      const rfq = await RFQ.create(
        [
          {
            rfqNumber,
            enquiry: enquiry._id,
            customer: enquiry.customer,
            items:
              enquiry.items?.length > 0
                ? enquiry.items.map((item) => ({
                    material: item.material,
                    partDescription: item.partDescription,
                    drawing: item.drawing,
                    qty: item.qty,
                    uom: item.uom,
                    targetPrice: item.targetPrice,
                    remarks: item.remarks,
                  }))
                : [
                    {
                      partDescription: enquiry.partName || enquiry.customerName || 'Part',
                      qty: 1,
                      uom: 'Nos',
                    },
                  ],
            rfqDate: enquiry.rfqDate || new Date(),
            dueDate: enquiry.dueDate,
            status: 'Draft',
            currentStatus: 'AwaitingEngineering',
            remarks: enquiry.remarks,
            createdBy: userId,
            updatedBy: userId,
          },
        ],
        { session }
      );

      enquiry.status = 'UnderReview';
      enquiry.linkedRfq = rfq[0]._id as Types.ObjectId;
      enquiry.workflowStage = 'Feasibility';
      enquiry.statusTimeline.push({ status: 'ConvertedToRFQ', changedAt: new Date(), changedBy: new Types.ObjectId(userId) } as never);
      await enquiry.save({ session });

      await this.notifyRoleUsers(['Engineering'], 'Engineering feasibility pending', `RFQ ${rfqNumber} is awaiting engineering review.`, '/sales/rfqs', userId, session);
      return rfq[0];
    });
  }

  async convertQuotationToSalesOrder(quotationId: string, userId: string) {
    return mongoose.connection.transaction(async (session) => {
      const quotation = await Quotation.findById(quotationId).session(session);
      if (!quotation) throw AppError.notFound('Quotation not found');

      const soNumber = await generateDocumentNumber({ prefix: 'SO' });
      const [salesOrder] = await SalesOrder.create(
        [
          {
            soNumber,
            customer: quotation.customer,
            quotation: quotation._id,
            items: quotation.items.map((item) => ({
              material: item.material,
              description: item.description,
              qty: item.qty,
              uom: item.uom,
              unitPrice: item.unitPrice,
              taxPercent: item.taxPercent,
              amount: item.amount,
              qtyDelivered: 0,
              qtyPending: item.qty,
            })),
            orderDate: new Date(),
            status: 'Confirmed',
            totalAmount: quotation.totalAmount,
            currency: quotation.currency,
            paymentTerms: quotation.paymentTerms,
            attachments: quotation.attachments,
            createdBy: userId,
            updatedBy: userId,
          },
        ],
        { session }
      );

      quotation.status = 'Accepted';
      quotation.approvalStatus = 'Approved';
      quotation.history.push({
        revisionNumber: quotation.revisionNumber,
        changedAt: new Date(),
        changedBy: new Types.ObjectId(userId),
        remarks: `Converted to sales order ${soNumber}`,
      } as never);
      await quotation.save({ session });

      await this.notifyRoleUsers(['Sales'], 'Sales order created', `Sales order ${soNumber} has been created from quotation ${quotation.quotationNumber}.`, '/sales/sales-orders', userId, session);
      return salesOrder;
    });
  }

  async generateQuotationPdf(quotationId: string) {
    const quotation = await Quotation.findById(quotationId).populate('customer', 'name code').lean();
    if (!quotation) throw AppError.notFound('Quotation not found');
    return quotation;
  }

  async emailQuotation(quotationId: string, recipients: string[], userId: string) {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) throw AppError.notFound('Quotation not found');
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      throw AppError.badRequest('SMTP is not configured');
    }

    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    await transport.sendMail({
      from: env.SMTP_FROM,
      to: recipients.join(','),
      subject: `Quotation ${quotation.quotationNumber}`,
      text: `Quotation ${quotation.quotationNumber} has been shared with you.`,
    });

    quotation.emailedAt = new Date();
    quotation.emailRecipients = recipients;
    await quotation.save();
    await this.notifyRoleUsers(['Sales'], 'Quotation emailed', `Quotation ${quotation.quotationNumber} was emailed to customer.`, '/sales/quotations', userId);
    return quotation;
  }

  async getReport(reportKey: string) {
    switch (reportKey) {
      case 'customers':
        return Customer.find().lean();
      case 'enquiries':
        return CustomerEnquiry.find().populate('customer', 'code name').lean();
      case 'quotations':
        return Quotation.find().populate('customer', 'code name').lean();
      case 'sales-orders':
        return SalesOrder.find().populate('customer', 'code name').lean();
      case 'conversion':
        return this.getConversionReport();
      case 'sales-executive-performance':
        return this.getSalesExecutivePerformance();
      case 'customer-wise-revenue':
      case 'top-customers':
        return this.getCustomerRevenue();
      default:
        throw AppError.badRequest(`Unsupported report: ${reportKey}`);
    }
  }

  private async getConversionReport() {
    const [enquiries, rfqs, quotations, acceptedQuotes, orders] = await Promise.all([
      CustomerEnquiry.countDocuments({ isDeleted: { $ne: true } }),
      RFQ.countDocuments({ isDeleted: { $ne: true } }),
      Quotation.countDocuments({ isDeleted: { $ne: true } }),
      Quotation.countDocuments({ status: 'Accepted', isDeleted: { $ne: true } }),
      SalesOrder.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    return [{
      enquiries,
      rfqs,
      quotations,
      acceptedQuotes,
      salesOrders: orders,
      enquiryToQuoteRate: enquiries > 0 ? Number(((quotations / enquiries) * 100).toFixed(2)) : 0,
      quoteToOrderRate: quotations > 0 ? Number(((orders / quotations) * 100).toFixed(2)) : 0,
    }];
  }

  private async getSalesExecutivePerformance() {
    return CustomerEnquiry.aggregate([
      {
        $group: {
          _id: '$salesExecutive',
          enquiries: { $sum: 1 },
          expectedOrderValue: { $sum: { $ifNull: ['$expectedOrderValue', 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'executive',
        },
      },
      { $unwind: { path: '$executive', preserveNullAndEmptyArrays: true } },
    ]);
  }

  private async getCustomerRevenue() {
    return SalesOrder.aggregate([
      { $group: { _id: '$customer', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
    ]);
  }

  private async linkAttachment(entityType: string, entityId: string, fileId: string) {
    const oid = new Types.ObjectId(fileId);
    const updates: Record<string, unknown> = {};
    switch (entityType) {
      case 'Customer':
        updates.$addToSet = { documents: oid };
        await Customer.findByIdAndUpdate(entityId, updates).exec();
        break;
      case 'CustomerEnquiry':
        updates.$addToSet = { attachments: oid };
        await CustomerEnquiry.findByIdAndUpdate(entityId, updates).exec();
        break;
      case 'RFQ':
        updates.$addToSet = { attachments: oid };
        await RFQ.findByIdAndUpdate(entityId, updates).exec();
        break;
      case 'Quotation':
        updates.$addToSet = { attachments: oid };
        await Quotation.findByIdAndUpdate(entityId, updates).exec();
        break;
      case 'SalesOrder':
        updates.$addToSet = { attachments: oid };
        await SalesOrder.findByIdAndUpdate(entityId, updates).exec();
        break;
      default:
        break;
    }
  }

  private async notifyRoleUsers(
    roles: string[],
    title: string,
    message: string,
    link: string,
    senderId?: string,
    session?: mongoose.ClientSession
  ) {
    const users = await User.find({ role: { $in: roles }, isActive: true }).session(session ?? null).select('_id').lean();
    if (!users.length) return;
    await Notification.insertMany(
      users.map((u) => ({
        recipient: u._id,
        sender: senderId,
        type: 'Info',
        title,
        message,
        link,
        module: 'marketing',
      })),
      { session }
    );
  }
}

export const marketingService = new MarketingService();
export default marketingService;
