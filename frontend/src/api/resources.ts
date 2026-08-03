import apiClient from './client';
import type { ApiListResponse, ApiResponse, DashboardData, ScrapDashboardData } from '../types/api';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  [key: string]: unknown;
}

export interface CrudResource<T> {
  list: (params?: ListParams) => Promise<ApiListResponse<T>>;
  get: (id: string) => Promise<T>;
  create: (payload: Partial<T>) => Promise<T>;
  update: (id: string, payload: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

export function createResource<T = Record<string, unknown>>(endpoint: string): CrudResource<T> {
  return {
    async list(params) {
      const response = await apiClient.get<ApiListResponse<T>>(endpoint, { params });
      return response.data;
    },
    async get(id) {
      const response = await apiClient.get<ApiResponse<T>>(`${endpoint}/${id}`);
      return response.data.data;
    },
    async create(payload) {
      const response = await apiClient.post<ApiResponse<T>>(endpoint, payload);
      return response.data.data;
    },
    async update(id, payload) {
      const response = await apiClient.put<ApiResponse<T>>(`${endpoint}/${id}`, payload);
      return response.data.data;
    },
    async remove(id) {
      await apiClient.delete<ApiResponse<null>>(`${endpoint}/${id}`);
    },
  };
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
  return response.data.data;
}

export interface SearchResults {
  materials: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  productionOrders: Record<string, unknown>[];
  drawings: Record<string, unknown>[];
  salesOrders: Record<string, unknown>[];
}

export interface MarketingSearchResults {
  results: Record<string, unknown>[];
  createNewNpdSuggested: boolean;
}

export async function globalSearch(query: string): Promise<SearchResults> {
  const response = await apiClient.get<ApiResponse<SearchResults>>('/search', { params: { q: query } });
  return response.data.data;
}

export async function fetchSettings<T = Record<string, unknown>>(): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>('/settings');
  return response.data.data;
}

export async function fetchMarketingDashboard<T = Record<string, unknown>>(): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>('/marketing/dashboard');
  return response.data.data;
}

export async function fetchCustomerOverview<T = Record<string, unknown>>(id: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(`/marketing/customers/${id}/overview`);
  return response.data.data;
}

export async function fetchCustomerTimeline<T = Record<string, unknown>>(id: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(`/marketing/customers/${id}/timeline`);
  return response.data.data;
}

export async function searchExistingParts(params: Record<string, unknown>): Promise<MarketingSearchResults> {
  const response = await apiClient.get<ApiResponse<MarketingSearchResults>>('/marketing/existing-parts', { params });
  return response.data.data;
}

export async function fetchEnquiryByCustomerId(customerId: string): Promise<Record<string, unknown>> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    `/marketing/enquiries/by-customer-id/${encodeURIComponent(customerId.trim())}`
  );
  return response.data.data;
}

export const marketingApi = {
  convertEnquiryToRfq: async (id: string) =>
    (await apiClient.post<ApiResponse<Record<string, unknown>>>(`/marketing/enquiries/${id}/convert-to-rfq`)).data.data,
  setExistingPartDecision: async (id: string, payload: { existingPartMatched: boolean; existingPartReference?: string }) =>
    (await apiClient.post<ApiResponse<Record<string, unknown>>>(`/marketing/enquiries/${id}/existing-part-decision`, payload)).data.data,
  createNpdFromEnquiry: async (id: string) =>
    (await apiClient.post<ApiResponse<Record<string, unknown>>>(`/marketing/enquiries/${id}/create-npd`)).data.data,
  advanceEnquiryWorkflow: async (id: string, stage: string, remarks?: string) =>
    (await apiClient.post<ApiResponse<Record<string, unknown>>>(`/marketing/enquiries/${id}/advance-workflow`, { stage, remarks })).data
      .data,
  convertQuotationToSalesOrder: async (id: string) =>
    (await apiClient.post<ApiResponse<Record<string, unknown>>>(`/marketing/quotations/${id}/convert-to-sales-order`)).data.data,
  emailQuotation: async (id: string, recipients: string[]) =>
    (await apiClient.post<ApiResponse<Record<string, unknown>>>(`/marketing/quotations/${id}/email`, { recipients })).data.data,
  uploadFile: async (payload: FormData) =>
    (
      await apiClient.post<ApiResponse<Record<string, unknown>>>('/marketing/files/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data.data,
  listFiles: async (entityType: string, entityId: string) =>
    (await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/marketing/files', { params: { entityType, entityId } })).data.data,
  replaceFile: async (id: string, payload: FormData) =>
    (
      await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/marketing/files/${id}/replace`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data.data,
  deleteFile: async (id: string) =>
    (await apiClient.delete<ApiResponse<Record<string, unknown>>>(`/marketing/files/${id}`)).data.data,
  report: async (reportKey: string) =>
    (await apiClient.get<ApiResponse<Record<string, unknown>[]>>(`/marketing/reports/${reportKey}`)).data.data,
};

export async function updateSettings<T = Record<string, unknown>>(payload: Partial<T>): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>('/settings', payload);
  return response.data.data;
}

// ---- Production Orders ----
export const productionOrdersApi = {
  ...createResource('/production-orders'),
  release: async (id: string) => (await apiClient.post<ApiResponse<unknown>>(`/production-orders/${id}/release`)).data.data,
  start: async (id: string) => (await apiClient.post<ApiResponse<unknown>>(`/production-orders/${id}/start`)).data.data,
  complete: async (id: string) => (await apiClient.post<ApiResponse<unknown>>(`/production-orders/${id}/complete`)).data.data,
  logShopFloor: async (id: string, payload: Record<string, unknown>) =>
    (await apiClient.post<ApiResponse<unknown>>(`/production-orders/${id}/shop-floor`, payload)).data.data,
  traceability: async (id: string) =>
    (await apiClient.get<ApiResponse<Record<string, unknown>>>(`/production-orders/${id}/traceability`)).data.data,
};

// ---- Material Issues ----
export const materialIssuesApi = {
  ...createResource('/material-issues'),
  post: async (id: string) => (await apiClient.post<ApiResponse<unknown>>(`/material-issues/${id}/post`)).data.data,
};

// ---- Scraps ----
export const scrapsApi = {
  ...createResource('/scraps'),
  dashboard: async (): Promise<ScrapDashboardData> =>
    (await apiClient.get<ApiResponse<ScrapDashboardData>>('/scraps/dashboard')).data.data,
  dispose: async (id: string, payload: { disposalMethod: string; saleValue?: number }) =>
    (await apiClient.post<ApiResponse<unknown>>(`/scraps/${id}/dispose`, payload)).data.data,
};

// ---- Inventory ----
export const inventoryApi = {
  balances: async (params?: ListParams) =>
    (await apiClient.get<ApiListResponse<Record<string, unknown>>>('/inventory/balances', { params })).data,
  ledger: async (params?: ListParams) =>
    (await apiClient.get<ApiListResponse<Record<string, unknown>>>('/inventory/ledger', { params })).data,
  available: async (materialId: string, warehouse?: string) =>
    (
      await apiClient.get<ApiResponse<{ materialId: string; availableQty: number }>>(
        `/inventory/available/${materialId}`,
        { params: { warehouse } }
      )
    ).data.data,
};

// ---- Goods Receipts ----
export const goodsReceiptsApi = {
  ...createResource('/goods-receipts'),
  post: async (id: string) => (await apiClient.post<ApiResponse<unknown>>(`/goods-receipts/${id}/post`)).data.data,
};

// ---- Material Returns / Consumptions ----
export const materialReturnsApi = createResource('/material-returns');
export const materialConsumptionsApi = createResource('/material-consumptions');

// ---- Reports ----
export async function downloadReport(reportPath: string, format: 'excel' | 'csv' | 'pdf' = 'excel', filename?: string): Promise<void> {
  const response = await apiClient.get(reportPath, {
    params: { format },
    responseType: 'blob',
  });
  const blob = new Blob([response.data as BlobPart]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const ext = format === 'excel' ? 'xlsx' : format;
  link.href = url;
  link.download = filename || `${reportPath.replace(/^\//, '').replace(/\//g, '-')}.${ext}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default createResource;
