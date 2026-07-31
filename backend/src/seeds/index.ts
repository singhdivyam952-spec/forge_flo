/**
 * Manufacturing ERP — Database Seed Script
 *
 * Populates a MongoDB instance with a realistic, end-to-end demo dataset:
 * roles & users, company settings, master data (warehouses, materials,
 * customers, suppliers, machines, work centers, shifts), engineering data
 * (BOM + Routing), opening stock, and one sample sales-to-production flow
 * (Sales Order → Production Order → Material Issue → Scrap).
 *
 * Usage:
 *   npm run seed -w backend
 *   (or, from backend/): npm run seed
 *
 * Safety:
 *   Outside of `production`, existing documents in every collection touched
 *   by this script are wiped first so the seed can be re-run freely during
 *   development. In `production`, master data is upserted instead so the
 *   script can be safely re-run without duplicating records.
 */
import { Types } from 'mongoose';
import { connectDatabase as connectDB, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  User,
  Role,
  Settings,
  Warehouse,
  Material,
  Customer,
  Supplier,
  Machine,
  WorkCenter,
  Shift,
  BOM,
  Routing,
  StockBalance,
  StockLedger,
  SalesOrder,
  ProductionOrder,
  MaterialIssue,
  Scrap,
  Counter,
} from '../models';
import { hashPassword } from '../utils/password';
import { DEFAULT_ROLE_PERMISSIONS, UserRole, PERMISSIONS, ALL_USER_ROLES } from '../constants';

const isProd = env.NODE_ENV === 'production';

/** Seed users: demo credentials for every functional role in the system. */
const SEED_USERS = [
  { employeeCode: 'EMP001', firstName: 'System', lastName: 'Admin', email: 'admin@forgeflo.local', password: 'Admin@123', role: UserRole.Admin },
  { employeeCode: 'EMP002', firstName: 'Priya', lastName: 'Kumar', email: 'ppc@forgeflo.local', password: 'Ppc@12345', role: UserRole.PPC },
  { employeeCode: 'EMP003', firstName: 'Ramesh', lastName: 'Iyer', email: 'store@forgeflo.local', password: 'Store@123', role: UserRole.Store },
  { employeeCode: 'EMP004', firstName: 'Suresh', lastName: 'Patel', email: 'production@forgeflo.local', password: 'Prod@1234', role: UserRole.Production },
  { employeeCode: 'EMP005', firstName: 'Anita', lastName: 'Sharma', email: 'quality@forgeflo.local', password: 'Quality@1', role: UserRole.Quality },
  { employeeCode: 'EMP006', firstName: 'Vikram', lastName: 'Mehta', email: 'sales@forgeflo.local', password: 'Sales@123', role: UserRole.Sales },
  { employeeCode: 'EMP007', firstName: 'Neha', lastName: 'Verma', email: 'purchase@forgeflo.local', password: 'Purch@123', role: UserRole.Purchase },
  {
    employeeCode: 'EMP008',
    firstName: 'Maya',
    lastName: 'Rao',
    email: 'marketing@forgeflo.local',
    password: 'Marketing@123',
    role: UserRole.Sales,
    department: 'Marketing',
    designation: 'Marketing Executive',
    additionalPermissions: [],
    revokedPermissions: [
      'customers:create',
      'customers:read',
      'customers:update',
      'customers:delete',
      'customers:export',
      'customers:import',
    ],
  },
] as const;

async function resetCollections(): Promise<void> {
  if (isProd) {
    logger.warn('NODE_ENV=production — skipping destructive resets, master data will be upserted instead');
    return;
  }

  logger.info('Clearing existing seed-relevant collections (non-production environment)...');

  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Settings.deleteMany({}),
    Warehouse.deleteMany({}),
    Material.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
    Machine.deleteMany({}),
    WorkCenter.deleteMany({}),
    Shift.deleteMany({}),
    BOM.deleteMany({}),
    Routing.deleteMany({}),
    StockBalance.deleteMany({}),
    StockLedger.deleteMany({}),
    SalesOrder.deleteMany({}),
    ProductionOrder.deleteMany({}),
    MaterialIssue.deleteMany({}),
    Scrap.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  logger.info('Collections cleared.');
}

async function seedRoles(): Promise<void> {
  logger.info(`Seeding roles (${ALL_USER_ROLES.length} roles, ${PERMISSIONS.length} total permission strings available)...`);

  for (const role of ALL_USER_ROLES) {
    await Role.findOneAndUpdate(
      { name: role },
      {
        $set: {
          name: role,
          description: `${role} role — default system-generated permission set`,
          permissions: DEFAULT_ROLE_PERMISSIONS[role],
          isSystem: true,
          isActive: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  logger.info('Roles seeded.');
}

async function seedUsers(): Promise<Record<string, InstanceType<typeof User>>> {
  logger.info('Seeding users...');

  const usersByEmail: Record<string, InstanceType<typeof User>> = {};

  for (const u of SEED_USERS) {
    const hashedPassword = await hashPassword(u.password);
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          employeeCode: u.employeeCode,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          department: 'department' in u ? u.department : undefined,
          designation: 'designation' in u ? u.designation : undefined,
          additionalPermissions: 'additionalPermissions' in u ? [...u.additionalPermissions] : [],
          revokedPermissions: 'revokedPermissions' in u ? [...u.revokedPermissions] : [],
          isActive: true,
          isEmailVerified: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
    usersByEmail[u.email] = doc;
  }

  logger.info(`Seeded ${SEED_USERS.length} users.`);
  return usersByEmail;
}

async function seedSettings(adminId: Types.ObjectId): Promise<void> {
  logger.info('Seeding company settings...');

  await Settings.findOneAndUpdate(
    {},
    {
      $set: {
        companyName: 'Forge Flo Manufacturing',
        companyCode: 'FFM',
        address: {
          line1: 'Plot 42, Industrial Estate',
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India',
          pincode: '411019',
        },
        gstNumber: '27AAAAA0000A1Z5',
        phone: '+91-20-12345678',
        email: 'info@forgeflo.local',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        valuationMethod: 'FIFO',
        updatedBy: adminId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  logger.info('Company settings seeded.');
}

async function seedWarehouses(adminId: Types.ObjectId): Promise<Record<string, InstanceType<typeof Warehouse>>> {
  logger.info('Seeding warehouses...');

  const racks = [
    { code: 'R01', name: 'Rack 01', isActive: true },
    { code: 'R02', name: 'Rack 02', isActive: true },
  ];

  const definitions = [
    { code: 'RM-MAIN', name: 'Raw Material Store', type: 'RM' as const },
    { code: 'FG-MAIN', name: 'Finished Goods Store', type: 'FG' as const },
    { code: 'SCRAP-01', name: 'Scrap Yard', type: 'Scrap' as const },
    { code: 'WIP-01', name: 'Work-in-Progress Floor Store', type: 'WIP' as const },
  ];

  const warehousesByCode: Record<string, InstanceType<typeof Warehouse>> = {};

  for (const w of definitions) {
    const doc = await Warehouse.findOneAndUpdate(
      { code: w.code },
      {
        $set: {
          code: w.code,
          name: w.name,
          type: w.type,
          racks,
          isActive: true,
          createdBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
    warehousesByCode[w.code] = doc;
  }

  logger.info(`Seeded ${definitions.length} warehouses.`);
  return warehousesByCode;
}

async function seedMaterials(
  adminId: Types.ObjectId,
  warehouses: Record<string, InstanceType<typeof Warehouse>>,
  suppliers: Record<string, InstanceType<typeof Supplier>>
): Promise<Record<string, InstanceType<typeof Material>>> {
  logger.info('Seeding materials...');

  const definitions = [
    {
      code: 'RM-MS-BAR-25',
      name: 'MS Round Bar 25mm',
      type: 'raw' as const,
      category: 'Raw Material',
      grade: 'MS',
      specification: 'IS 2062, 25mm dia round bar',
      uom: 'KG',
      valuationMethod: 'FIFO' as const,
      standardCost: 65,
      averageCost: 65,
      reorderLevel: 100,
      reorderQty: 500,
      isBatchTracked: true,
      isHeatNumberTracked: true,
      defaultWarehouse: warehouses['RM-MAIN']._id,
      defaultSupplier: suppliers['SUP-001']._id,
    },
    {
      code: 'RM-MS-PLT-10',
      name: 'MS Plate 10mm',
      type: 'raw' as const,
      category: 'Raw Material',
      grade: 'MS',
      specification: 'IS 2062, 10mm thick plate',
      uom: 'KG',
      valuationMethod: 'Average' as const,
      standardCost: 55,
      averageCost: 55,
      reorderLevel: 100,
      reorderQty: 500,
      isBatchTracked: false,
      isHeatNumberTracked: false,
      defaultWarehouse: warehouses['RM-MAIN']._id,
      defaultSupplier: suppliers['SUP-002']._id,
    },
    {
      code: 'FG-SHAFT-001',
      name: 'Precision Shaft',
      type: 'finished' as const,
      category: 'Finished Goods',
      specification: 'Precision turned & ground shaft, 25mm stock',
      uom: 'PCS',
      valuationMethod: 'FIFO' as const,
      standardCost: 450,
      averageCost: 450,
      reorderLevel: 20,
      reorderQty: 100,
      isBatchTracked: false,
      isHeatNumberTracked: false,
      defaultWarehouse: warehouses['FG-MAIN']._id,
    },
    {
      code: 'SCRAP-MS-TURNING',
      name: 'Turning Scrap',
      type: 'scrap' as const,
      category: 'Scrap',
      specification: 'MS turning chips/swarf recovered from machining',
      uom: 'KG',
      valuationMethod: 'Average' as const,
      standardCost: 20,
      averageCost: 20,
      reorderLevel: 0,
      reorderQty: 0,
      isBatchTracked: false,
      isHeatNumberTracked: false,
      defaultWarehouse: warehouses['SCRAP-01']._id,
    },
  ];

  const materialsByCode: Record<string, InstanceType<typeof Material>> = {};

  for (const m of definitions) {
    const doc = await Material.findOneAndUpdate(
      { code: m.code },
      {
        $set: {
          ...m,
          isActive: true,
          createdBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
    materialsByCode[m.code] = doc;
  }

  logger.info(`Seeded ${definitions.length} materials.`);
  return materialsByCode;
}

async function seedCustomers(adminId: Types.ObjectId): Promise<Record<string, InstanceType<typeof Customer>>> {
  logger.info('Seeding customers...');

  const definitions = [
    { code: 'CUST-001', name: 'Acme Auto', customerType: 'OEM' as const, email: 'purchase@acmeauto.example', creditDays: 45, creditLimit: 2_000_000 },
    { code: 'CUST-002', name: 'Bharat Heavy', customerType: 'OEM' as const, email: 'procurement@bharatheavy.example', creditDays: 60, creditLimit: 5_000_000 },
  ];

  const customersByCode: Record<string, InstanceType<typeof Customer>> = {};

  for (const c of definitions) {
    const doc = await Customer.findOneAndUpdate(
      { code: c.code },
      {
        $set: {
          ...c,
          isActive: true,
          createdBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
    customersByCode[c.code] = doc;
  }

  logger.info(`Seeded ${definitions.length} customers.`);
  return customersByCode;
}

async function seedSuppliers(adminId: Types.ObjectId): Promise<Record<string, InstanceType<typeof Supplier>>> {
  logger.info('Seeding suppliers...');

  const definitions = [
    { code: 'SUP-001', name: 'Steel India', supplierType: 'Manufacturer' as const, email: 'sales@steelindia.example', leadTimeDays: 7, isApproved: true },
    { code: 'SUP-002', name: 'Alloy Traders', supplierType: 'Trader' as const, email: 'sales@alloytraders.example', leadTimeDays: 10, isApproved: true },
  ];

  const suppliersByCode: Record<string, InstanceType<typeof Supplier>> = {};

  for (const s of definitions) {
    const doc = await Supplier.findOneAndUpdate(
      { code: s.code },
      {
        $set: {
          ...s,
          isActive: true,
          createdBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
    suppliersByCode[s.code] = doc;
  }

  logger.info(`Seeded ${definitions.length} suppliers.`);
  return suppliersByCode;
}

async function seedWorkCentersMachinesShifts(adminId: Types.ObjectId): Promise<{
  workCenters: Record<string, InstanceType<typeof WorkCenter>>;
  machines: Record<string, InstanceType<typeof Machine>>;
  shifts: Record<string, InstanceType<typeof Shift>>;
}> {
  logger.info('Seeding work centers, machines and shifts...');

  const workCenterDefs = [
    { code: 'WC-CNC', name: 'CNC Machining Center', department: 'Machining' },
    { code: 'WC-GRIND', name: 'Grinding Center', department: 'Finishing' },
  ];

  const workCenters: Record<string, InstanceType<typeof WorkCenter>> = {};
  for (const wc of workCenterDefs) {
    workCenters[wc.code] = await WorkCenter.findOneAndUpdate(
      { code: wc.code },
      { $set: { ...wc, isActive: true, createdBy: adminId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  const machineDefs = [
    { code: 'CNC-L1', name: 'CNC Lathe 1', category: 'CNC' as const, workCenter: workCenters['WC-CNC']._id, hourlyRate: 800 },
    { code: 'CNC-M1', name: 'CNC Milling 1', category: 'CNC' as const, workCenter: workCenters['WC-CNC']._id, hourlyRate: 900 },
    { code: 'GRIND-1', name: 'Cylindrical Grinder 1', category: 'Grinding' as const, workCenter: workCenters['WC-GRIND']._id, hourlyRate: 600 },
  ];

  const machines: Record<string, InstanceType<typeof Machine>> = {};
  for (const m of machineDefs) {
    machines[m.code] = await Machine.findOneAndUpdate(
      { code: m.code },
      { $set: { ...m, status: 'Available', isActive: true, createdBy: adminId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  const shiftDefs = [
    { code: 'A', name: 'Shift A', startTime: '06:00', endTime: '14:00', isNightShift: false },
    { code: 'B', name: 'Shift B', startTime: '14:00', endTime: '22:00', isNightShift: false },
    { code: 'C', name: 'Shift C', startTime: '22:00', endTime: '06:00', isNightShift: true },
  ];

  const shifts: Record<string, InstanceType<typeof Shift>> = {};
  for (const s of shiftDefs) {
    shifts[s.code] = await Shift.findOneAndUpdate(
      { code: s.code },
      { $set: { ...s, breakMinutes: 30, isActive: true, createdBy: adminId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  logger.info(`Seeded ${workCenterDefs.length} work centers, ${machineDefs.length} machines, ${shiftDefs.length} shifts.`);
  return { workCenters, machines, shifts };
}

async function seedBomAndRouting(
  adminId: Types.ObjectId,
  materials: Record<string, InstanceType<typeof Material>>,
  workCenters: Record<string, InstanceType<typeof WorkCenter>>
): Promise<{ bom: InstanceType<typeof BOM>; routing: InstanceType<typeof Routing> }> {
  logger.info('Seeding BOM and Routing for FG-SHAFT-001...');

  const finishedMaterial = materials['FG-SHAFT-001']._id;

  const bom = await BOM.findOneAndUpdate(
    { finishedMaterial, version: 'V1' },
    {
      $set: {
        finishedMaterial,
        version: 'V1',
        baseQty: 1,
        baseUom: 'PCS',
        items: [
          {
            material: materials['RM-MS-BAR-25']._id,
            qty: 2.5,
            uom: 'KG',
            scrapPercent: 5,
            process: 'CNC Turning',
            isCritical: true,
          },
        ],
        status: 'Active',
        effectiveFrom: new Date(),
        approvedBy: adminId,
        approvedAt: new Date(),
        createdBy: adminId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  const routing = await Routing.findOneAndUpdate(
    { finishedMaterial, version: 'V1' },
    {
      $set: {
        finishedMaterial,
        version: 'V1',
        operations: [
          {
            seq: 1,
            operationName: 'CNC Turning',
            processType: 'CNCTurning',
            workCenter: workCenters['WC-CNC']._id,
            setupTime: 30,
            runTimePerUnit: 5,
            qcRequired: false,
          },
          {
            seq: 2,
            operationName: 'Grinding',
            processType: 'Grinding',
            workCenter: workCenters['WC-GRIND']._id,
            setupTime: 15,
            runTimePerUnit: 3,
            qcRequired: false,
          },
          {
            seq: 3,
            operationName: 'Final Inspection',
            processType: 'Inspection',
            setupTime: 0,
            runTimePerUnit: 1,
            qcRequired: true,
          },
        ],
        status: 'Active',
        effectiveFrom: new Date(),
        approvedBy: adminId,
        approvedAt: new Date(),
        createdBy: adminId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  logger.info('BOM and Routing seeded.');
  return { bom, routing };
}

async function seedOpeningStock(
  adminId: Types.ObjectId,
  warehouses: Record<string, InstanceType<typeof Warehouse>>,
  materials: Record<string, InstanceType<typeof Material>>
): Promise<void> {
  logger.info('Seeding opening stock for raw materials...');

  const rmMain = warehouses['RM-MAIN']._id;
  const openingLines = [
    { material: materials['RM-MS-BAR-25'], batchNumber: 'B-2026-0001', heatNumber: 'HT-0001', unitCost: 65, voucherNumber: 'OPEN-2026-0001' },
    { material: materials['RM-MS-PLT-10'], batchNumber: 'B-2026-0002', heatNumber: 'HT-0002', unitCost: 55, voucherNumber: 'OPEN-2026-0002' },
  ];

  const OPENING_QTY = 1000;

  for (const line of openingLines) {
    const totalValue = OPENING_QTY * line.unitCost;

    await StockBalance.findOneAndUpdate(
      {
        material: line.material._id,
        warehouse: rmMain,
        rack: 'R01',
        batchNumber: line.batchNumber,
        heatNumber: line.heatNumber,
        lotNumber: '',
      },
      {
        $set: {
          material: line.material._id,
          warehouse: rmMain,
          rack: 'R01',
          batchNumber: line.batchNumber,
          heatNumber: line.heatNumber,
          lotNumber: '',
          qty: OPENING_QTY,
          reservedQty: 0,
          uom: line.material.uom,
          unitCost: line.unitCost,
          totalValue,
          lastMovementDate: new Date(),
          createdBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();

    await StockLedger.findOneAndUpdate(
      { voucherType: 'Opening', voucherNumber: line.voucherNumber, material: line.material._id },
      {
        $set: {
          voucherType: 'Opening',
          voucherNumber: line.voucherNumber,
          voucherId: new Types.ObjectId(),
          material: line.material._id,
          warehouse: rmMain,
          rack: 'R01',
          batchNumber: line.batchNumber,
          heatNumber: line.heatNumber,
          txnType: 'IN',
          qtyIn: OPENING_QTY,
          qtyOut: 0,
          balanceQty: OPENING_QTY,
          uom: line.material.uom,
          unitCost: line.unitCost,
          totalValue,
          transactionDate: new Date(),
          remarks: 'Opening balance — seed data',
          createdBy: adminId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  logger.info(`Seeded opening stock (${OPENING_QTY} KG each) for ${openingLines.length} raw materials.`);
}

async function seedSalesAndProductionOrder(
  users: Record<string, InstanceType<typeof User>>,
  customers: Record<string, InstanceType<typeof Customer>>,
  materials: Record<string, InstanceType<typeof Material>>,
  warehouses: Record<string, InstanceType<typeof Warehouse>>,
  bom: InstanceType<typeof BOM>,
  routing: InstanceType<typeof Routing>
): Promise<{ salesOrder: InstanceType<typeof SalesOrder>; productionOrder: InstanceType<typeof ProductionOrder> }> {
  logger.info('Seeding sample Sales Order and Production Order...');

  const admin = users['admin@forgeflo.local'];
  const salesUser = users['sales@forgeflo.local'];
  const fgShaft = materials['FG-SHAFT-001'];
  const qty = 100;
  const unitPrice = 500;
  const amount = qty * unitPrice;

  const orderDate = new Date();
  const requiredDate = new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const salesOrder = await SalesOrder.findOneAndUpdate(
    { soNumber: 'SO-2026-0001' },
    {
      $set: {
        soNumber: 'SO-2026-0001',
        customer: customers['CUST-001']._id,
        items: [
          {
            material: fgShaft._id,
            description: fgShaft.name,
            qty,
            uom: 'PCS',
            unitPrice,
            taxPercent: 18,
            amount,
            deliveryDate: requiredDate,
            qtyDelivered: 0,
            qtyPending: qty,
          },
        ],
        orderDate,
        requiredDate,
        status: 'Confirmed',
        totalAmount: amount,
        salesPerson: salesUser._id,
        createdBy: admin._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  const plannedStart = new Date();
  const plannedEnd = new Date(plannedStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const productionOrder = await ProductionOrder.findOneAndUpdate(
    { orderNumber: 'PRD-2026-0001' },
    {
      $set: {
        orderNumber: 'PRD-2026-0001',
        salesOrder: salesOrder._id,
        salesOrderItem: (salesOrder.items[0] as unknown as { _id: Types.ObjectId })._id,
        material: fgShaft._id,
        qty,
        uom: 'PCS',
        bom: bom._id,
        routing: routing._id,
        sourceWarehouse: warehouses['RM-MAIN']._id,
        targetWarehouse: warehouses['FG-MAIN']._id,
        plannedStart,
        plannedEnd,
        status: 'Released',
        priority: 'High',
        materialSummary: { issued: 0, consumed: 0, returned: 0, scrap: 0, balance: 0 },
        costSummary: { materialCost: 0, laborCost: 0, machineCost: 0, overhead: 0, totalCost: 0, unitCost: 0 },
        operations: routing.operations.map((op) => ({
          seq: op.seq,
          operationName: op.operationName,
          processType: op.processType,
          workCenter: op.workCenter,
          operators: [],
          status: 'Pending',
          qtyCompleted: 0,
          qtyRejected: 0,
          scrapQty: 0,
          setupTime: op.setupTime,
          runTimePerUnit: op.runTimePerUnit,
        })),
        remarks: 'Seed data — sample released production order for FG-SHAFT-001',
        createdBy: admin._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  logger.info('Sample Sales Order and Production Order seeded.');
  return { salesOrder, productionOrder };
}

async function seedMaterialIssueAndScrap(
  users: Record<string, InstanceType<typeof User>>,
  materials: Record<string, InstanceType<typeof Material>>,
  warehouses: Record<string, InstanceType<typeof Warehouse>>,
  machines: Record<string, InstanceType<typeof Machine>>,
  shifts: Record<string, InstanceType<typeof Shift>>,
  productionOrder: InstanceType<typeof ProductionOrder>
): Promise<void> {
  logger.info('Seeding sample Material Issue and Scrap entry...');

  const storeUser = users['store@forgeflo.local'];
  const productionUser = users['production@forgeflo.local'];
  const rmBar = materials['RM-MS-BAR-25'];
  const rmMain = warehouses['RM-MAIN']._id;

  const issueQty = 250; // 100 shafts x 2.5 KG/pc per BOM
  const unitCost = 65;
  const totalValue = issueQty * unitCost;

  const materialIssue = await MaterialIssue.findOneAndUpdate(
    { issueNumber: 'MI-2026-0001' },
    {
      $set: {
        issueNumber: 'MI-2026-0001',
        productionOrder: productionOrder._id,
        warehouse: rmMain,
        lines: [
          {
            material: rmBar._id,
            batchNumber: 'B-2026-0001',
            heatNumber: 'HT-0001',
            qty: issueQty,
            uom: 'KG',
            unitCost,
            totalValue,
          },
        ],
        issueDate: new Date(),
        issuedBy: storeUser._id,
        status: 'Issued',
        createdBy: storeUser._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  const existingBalance = await StockBalance.findOne({
    material: rmBar._id,
    warehouse: rmMain,
    rack: 'R01',
    batchNumber: 'B-2026-0001',
    heatNumber: 'HT-0001',
  }).exec();

  const remainingQty = (existingBalance?.qty ?? 1000) - issueQty;

  await StockBalance.findOneAndUpdate(
    { material: rmBar._id, warehouse: rmMain, rack: 'R01', batchNumber: 'B-2026-0001', heatNumber: 'HT-0001', lotNumber: '' },
    {
      $set: {
        qty: remainingQty,
        totalValue: remainingQty * unitCost,
        lastMovementDate: new Date(),
      },
    },
    { new: true }
  ).exec();

  await StockLedger.findOneAndUpdate(
    { voucherType: 'MaterialIssue', voucherNumber: 'MI-2026-0001', material: rmBar._id },
    {
      $set: {
        voucherType: 'MaterialIssue',
        voucherNumber: 'MI-2026-0001',
        voucherId: materialIssue._id,
        material: rmBar._id,
        warehouse: rmMain,
        rack: 'R01',
        batchNumber: 'B-2026-0001',
        heatNumber: 'HT-0001',
        txnType: 'OUT',
        qtyIn: 0,
        qtyOut: issueQty,
        balanceQty: remainingQty,
        uom: 'KG',
        unitCost,
        totalValue,
        productionOrder: productionOrder._id,
        transactionDate: new Date(),
        remarks: `Issued against ${productionOrder.orderNumber}`,
        createdBy: storeUser._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  await ProductionOrder.updateOne(
    { _id: productionOrder._id },
    { $set: { 'materialSummary.issued': issueQty, 'materialSummary.balance': issueQty } }
  ).exec();

  const scrapQty = 5;

  await Scrap.findOneAndUpdate(
    { scrapNumber: 'SCR-2026-0001' },
    {
      $set: {
        scrapNumber: 'SCR-2026-0001',
        scrapType: 'Turning',
        productionOrder: productionOrder._id,
        material: rmBar._id,
        recoveredMaterial: materials['SCRAP-MS-TURNING']._id,
        recoveredQty: scrapQty,
        recoveredUom: 'KG',
        weight: scrapQty,
        weightUom: 'kg',
        reason: 'Turning scrap generated during CNC turning operation',
        operator: productionUser._id,
        machine: machines['CNC-L1']._id,
        shift: shifts['A']._id,
        operationSeq: 1,
        warehouse: warehouses['SCRAP-01']._id,
        scrapDate: new Date(),
        saleValue: 0,
        status: 'Generated',
        scrapPercentContribution: 5,
        remarks: 'Seed data — sample scrap record',
        createdBy: productionUser._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  logger.info('Sample Material Issue and Scrap entry seeded.');
}

async function main(): Promise<void> {
  logger.info(`Starting Manufacturing ERP database seed [NODE_ENV=${env.NODE_ENV}]...`);

  await connectDB();

  await resetCollections();

  await seedRoles();
  const users = await seedUsers();
  const admin = users['admin@forgeflo.local'];

  await seedSettings(admin._id);

  const warehouses = await seedWarehouses(admin._id);
  const suppliers = await seedSuppliers(admin._id);
  const materials = await seedMaterials(admin._id, warehouses, suppliers);
  const customers = await seedCustomers(admin._id);

  const { workCenters, machines, shifts } = await seedWorkCentersMachinesShifts(admin._id);

  const { bom, routing } = await seedBomAndRouting(admin._id, materials, workCenters);

  await seedOpeningStock(admin._id, warehouses, materials);

  const { productionOrder } = await seedSalesAndProductionOrder(users, customers, materials, warehouses, bom, routing);

  await seedMaterialIssueAndScrap(users, materials, warehouses, machines, shifts, productionOrder);

  logger.info('✅ Database seed completed successfully.');
  logger.info('----------------------------------------------------------------');
  logger.info('Demo login credentials (all @forgeflo.local, see README for full list):');
  for (const u of SEED_USERS) {
    logger.info(`  ${u.role.padEnd(10)} -> ${u.email} / ${u.password}`);
  }
  logger.info('----------------------------------------------------------------');
}

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('❌ Database seed failed', { error: error instanceof Error ? error.stack : error });
    try {
      await disconnectDatabase();
    } catch {
      // ignore disconnect errors during failure path
    }
    process.exit(1);
  });
