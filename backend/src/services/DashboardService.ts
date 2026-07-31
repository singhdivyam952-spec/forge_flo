import dayjs from 'dayjs';
import { ProductionOrder } from '../models/ProductionOrder';
import { Scrap } from '../models/Scrap';
import { SalesOrder } from '../models/SalesOrder';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Material } from '../models/Material';
import { StockBalance } from '../models/StockBalance';
import { Machine } from '../models/Machine';
import { MachineDowntime } from '../models/MachineDowntime';
import { ShopFloorEntry } from '../models/ShopFloorEntry';
import { MaterialIssue } from '../models/MaterialIssue';
import { Notification } from '../models/Notification';

export class DashboardService {
  async getOverview() {
    const startOfToday = dayjs().startOf('day').toDate();
    const startOfMonth = dayjs().startOf('month').toDate();

    const [
      todayProduction,
      pendingOrders,
      materialIssuedToday,
      scrapToday,
      revenueMonth,
      purchaseMonth,
      lowStock,
      machines,
      activePOs,
      recentNotifications,
      scrapDash,
      efficiency,
    ] = await Promise.all([
      ProductionOrder.aggregate([
        { $match: { actualEnd: { $gte: startOfToday }, status: { $in: ['Completed', 'Closed', 'InProgress'] } } },
        { $group: { _id: null, qty: { $sum: '$qtyCompleted' }, orders: { $sum: 1 } } },
      ]),
      ProductionOrder.countDocuments({ status: { $in: ['Planned', 'Released', 'InProgress', 'OnHold'] } }),
      MaterialIssue.aggregate([
        { $match: { status: 'Issued', issueDate: { $gte: startOfToday } } },
        { $unwind: '$lines' },
        { $group: { _id: null, qty: { $sum: '$lines.qty' }, value: { $sum: '$lines.totalValue' } } },
      ]),
      Scrap.aggregate([
        { $match: { scrapDate: { $gte: startOfToday } } },
        { $group: { _id: null, weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } }, count: { $sum: 1 } } },
      ]),
      SalesOrder.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['Cancelled', 'Draft'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['Cancelled', 'Draft'] } } },
        { $group: { _id: null, cost: { $sum: '$totalAmount' } } },
      ]),
      this.getLowStockCount(),
      Machine.countDocuments({ isActive: true }),
      ProductionOrder.find({ status: 'InProgress' })
        .select('orderNumber qty qtyCompleted yieldPercent scrapPercent materialSummary status')
        .populate('material', 'code name')
        .limit(10)
        .lean(),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.getScrapKpis(),
      this.getEfficiencyKpis(startOfMonth),
    ]);

    const revenue = revenueMonth[0]?.revenue ?? 0;
    const cost = purchaseMonth[0]?.cost ?? 0;
    const materialCost = await ProductionOrder.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, cost: { $sum: '$costSummary.materialCost' } } },
    ]);
    const productionCost = materialCost[0]?.cost ?? 0;
    const totalCost = cost + productionCost;
    const profit = revenue - totalCost;

    const productionTrend = await ProductionOrder.aggregate([
      { $match: { createdAt: { $gte: dayjs().subtract(13, 'day').startOf('day').toDate() } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          completed: { $sum: '$qtyCompleted' },
          scrap: { $sum: '$materialSummary.scrap' },
          issued: { $sum: '$materialSummary.issued' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const scrapTrend = await Scrap.aggregate([
      { $match: { scrapDate: { $gte: dayjs().subtract(13, 'day').startOf('day').toDate() } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scrapDate' } },
          weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      kpis: {
        todaysProduction: todayProduction[0]?.qty ?? 0,
        todaysProductionOrders: todayProduction[0]?.orders ?? 0,
        pendingOrders,
        materialConsumptionToday: materialIssuedToday[0]?.qty ?? 0,
        materialValueToday: materialIssuedToday[0]?.value ?? 0,
        todaysScrap: scrapToday[0]?.weight ?? 0,
        todaysScrapCount: scrapToday[0]?.count ?? 0,
        revenue,
        cost: totalCost,
        profit,
        lowStockItems: lowStock,
        activeMachines: machines,
        productionEfficiency: efficiency.productionEfficiency,
        machineUtilization: efficiency.machineUtilization,
        employeeProductivity: efficiency.employeeProductivity,
        scrapPercent: scrapDash.scrapPercent,
        yieldPercent: scrapDash.yieldPercent,
        recoveryPercent: scrapDash.recoveryPercent,
      },
      charts: {
        productionTrend,
        scrapTrend,
        scrapByType: scrapDash.byType,
      },
      activeProductionOrders: activePOs,
      notifications: recentNotifications,
    };
  }

  private async getLowStockCount(): Promise<number> {
    const materials = await Material.find({ isActive: true, reorderLevel: { $gt: 0 } })
      .select('_id reorderLevel')
      .lean();
    if (!materials.length) return 0;

    const balances = await StockBalance.aggregate([
      { $group: { _id: '$material', qty: { $sum: '$qty' } } },
    ]);
    const map = new Map(balances.map((b) => [String(b._id), b.qty as number]));

    return materials.filter((m) => (map.get(String(m._id)) ?? 0) <= (m.reorderLevel || 0)).length;
  }

  private async getScrapKpis() {
    const po = await ProductionOrder.aggregate([
      {
        $group: {
          _id: null,
          issued: { $sum: '$materialSummary.issued' },
          scrap: { $sum: '$materialSummary.scrap' },
          avgYield: { $avg: '$yieldPercent' },
          avgRecovery: { $avg: '$recoveryPercent' },
        },
      },
    ]);
    const byType = await Scrap.aggregate([
      { $group: { _id: '$scrapType', weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } } } },
      { $sort: { weight: -1 } },
    ]);
    const row = po[0] || { issued: 0, scrap: 0, avgYield: 0, avgRecovery: 0 };
    return {
      scrapPercent: row.issued > 0 ? Number(((row.scrap / row.issued) * 100).toFixed(2)) : 0,
      yieldPercent: Number((row.avgYield || 0).toFixed(2)),
      recoveryPercent: Number((row.avgRecovery || 0).toFixed(2)),
      byType,
    };
  }

  private async getEfficiencyKpis(since: Date) {
    const [poStats, downtime, shopFloor] = await Promise.all([
      ProductionOrder.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            planned: { $sum: '$qty' },
            completed: { $sum: '$qtyCompleted' },
          },
        },
      ]),
      MachineDowntime.aggregate([
        { $match: { startTime: { $gte: since } } },
        {
          $group: {
            _id: null,
            minutes: {
              $sum: {
                $divide: [{ $subtract: [{ $ifNull: ['$endTime', new Date()] }, '$startTime'] }, 60000],
              },
            },
          },
        },
      ]),
      ShopFloorEntry.aggregate([
        { $match: { startTime: { $gte: since } } },
        {
          $group: {
            _id: '$operator',
            qty: { $sum: '$qtyCompleted' },
            entries: { $sum: 1 },
          },
        },
      ]),
    ]);

    const planned = poStats[0]?.planned || 0;
    const completed = poStats[0]?.completed || 0;
    const productionEfficiency = planned > 0 ? Number(((completed / planned) * 100).toFixed(2)) : 0;

    const downtimeMinutes = downtime[0]?.minutes || 0;
    const availableMinutes = dayjs().diff(dayjs(since), 'minute');
    const machineUtilization =
      availableMinutes > 0
        ? Number((Math.max(0, 100 - (downtimeMinutes / availableMinutes) * 100)).toFixed(2))
        : 0;

    const avgQty =
      shopFloor.length > 0 ? shopFloor.reduce((s, r) => s + r.qty, 0) / shopFloor.length : 0;

    return {
      productionEfficiency,
      machineUtilization,
      employeeProductivity: Number(avgQty.toFixed(2)),
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
