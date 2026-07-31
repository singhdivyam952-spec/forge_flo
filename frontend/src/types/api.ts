export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface User {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  additionalPermissions: string[];
  revokedPermissions: string[];
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  shift?: string;
  reportingManager?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponseData {
  user: User;
  accessToken: string;
}

export interface DashboardKpis {
  todaysProduction: number;
  todaysProductionOrders: number;
  pendingOrders: number;
  materialConsumptionToday: number;
  materialValueToday: number;
  todaysScrap: number;
  todaysScrapCount: number;
  revenue: number;
  cost: number;
  profit: number;
  lowStockItems: number;
  activeMachines: number;
  productionEfficiency: number;
  machineUtilization: number;
  employeeProductivity: number;
  scrapPercent: number;
  yieldPercent: number;
  recoveryPercent: number;
}

export interface DashboardTrendPoint {
  _id: string;
  completed?: number;
  scrap?: number;
  issued?: number;
  weight?: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  charts: {
    productionTrend: DashboardTrendPoint[];
    scrapTrend: DashboardTrendPoint[];
    scrapByType: { _id: string; weight: number; count: number }[];
  };
  activeProductionOrders: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
}

export interface ScrapDashboardData {
  totalScrap: number;
  scrapCount: number;
  totalSaleValue: number;
  totalRecovered: number;
  dailyScrap: number;
  dailyCount: number;
  monthlyScrap: number;
  monthlyCount: number;
  scrapPercent: number;
  yieldPercent: number;
  recoveryPercent: number;
  byType: { _id: string; weight: number; count: number }[];
  byReason: { _id: string; weight: number; count: number }[];
}

export type ID = string;
