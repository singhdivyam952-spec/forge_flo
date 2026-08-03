import { type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../layouts/AppLayout';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { hasUserPermission } from '../utils/access';

import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { SearchPage } from '../pages/SearchPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProductionOrdersPage } from '../pages/ProductionOrdersPage';
import { MaterialIssuesPage } from '../pages/MaterialIssuesPage';
import { ScrapPage } from '../pages/ScrapPage';
import { InventoryPage } from '../pages/InventoryPage';
import { GoodsReceiptsPage } from '../pages/GoodsReceiptsPage';
import { GenericModulePage } from '../pages/GenericModulePage';
import { MarketingDashboardPage } from '../pages/MarketingDashboardPage';
import { ExistingPartsPage } from '../pages/ExistingPartsPage';
import { MarketingReportsPage } from '../pages/MarketingReportsPage';
import { CustomersPage } from '../pages/CustomersPage';
import { CustomerDetailPage } from '../pages/CustomerDetailPage';
import { CustomerContactsPage } from '../pages/CustomerContactsPage';
import { MarketingEnquiriesPage } from '../pages/MarketingEnquiriesPage';
import { MarketingQuotationsPage } from '../pages/MarketingQuotationsPage';

function getDefaultAuthorizedPath(
  user: ReturnType<typeof useAuth>['user']
): string {
  if (!user) return '/login';
  if (hasUserPermission(user, 'reports:read')) return '/dashboard';
  if (hasUserPermission(user, 'sales:read')) return '/sales/dashboard';
  if (hasUserPermission(user, 'production:read')) return '/production/orders';
  if (hasUserPermission(user, 'inventory:read')) return '/inventory/stock';
  if (hasUserPermission(user, 'quality:read')) return '/quality/inspections';
  if (hasUserPermission(user, 'purchase:read')) return '/purchase/orders';
  if (hasUserPermission(user, 'engineering:read')) return '/engineering/boms';
  if (hasUserPermission(user, 'customers:read')) return '/masters/customers';
  if (hasUserPermission(user, 'users:read')) return '/masters/users';
  return '/login';
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) return <LoadingScreen label="Checking session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (location.pathname.startsWith('/dashboard') && !hasUserPermission(user, 'reports:read')) {
    return <Navigate to={getDefaultAuthorizedPath(user)} replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  if (isInitializing) return <LoadingScreen label="Loading…" />;
  if (isAuthenticated) return <Navigate to={getDefaultAuthorizedPath(user)} replace />;
  return <>{children}</>;
}

function PermissionRoute({
  children,
  permission,
}: {
  children: ReactNode;
  permission: string;
}) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return <LoadingScreen label="Checking access…" />;
  if (!hasUserPermission(user, permission)) {
    return <Navigate to={getDefaultAuthorizedPath(user)} replace />;
  }
  return <>{children}</>;
}

function AnyPermissionRoute({
  children,
  permissions,
}: {
  children: ReactNode;
  permissions: string[];
}) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return <LoadingScreen label="Checking access…" />;
  if (!permissions.some((permission) => hasUserPermission(user, permission))) {
    return <Navigate to={getDefaultAuthorizedPath(user)} replace />;
  }
  return <>{children}</>;
}

const MODULE_ROUTES: { path: string; moduleKey: string; permission: string }[] = [
  { path: '/masters/customers', moduleKey: 'customers', permission: 'customers:read' },
  { path: '/masters/suppliers', moduleKey: 'suppliers', permission: 'suppliers:read' },
  { path: '/masters/materials', moduleKey: 'materials', permission: 'materials:read' },
  { path: '/masters/warehouses', moduleKey: 'warehouses', permission: 'inventory:read' },
  { path: '/masters/machines', moduleKey: 'machines', permission: 'maintenance:read' },
  { path: '/masters/work-centers', moduleKey: 'work-centers', permission: 'production:read' },
  { path: '/masters/shifts', moduleKey: 'shifts', permission: 'production:read' },
  { path: '/masters/users', moduleKey: 'users', permission: 'users:read' },
  { path: '/masters/roles', moduleKey: 'roles', permission: 'roles:read' },

  { path: '/engineering/boms', moduleKey: 'boms', permission: 'engineering:read' },
  { path: '/engineering/routings', moduleKey: 'routings', permission: 'engineering:read' },
  { path: '/engineering/drawings', moduleKey: 'drawings', permission: 'engineering:read' },
  { path: '/engineering/npd', moduleKey: 'npd', permission: 'engineering:read' },
  { path: '/engineering/engineering-changes', moduleKey: 'engineering-changes', permission: 'engineering:read' },

  { path: '/sales/enquiries', moduleKey: 'enquiries', permission: 'sales:read' },
  { path: '/sales/rfqs', moduleKey: 'rfqs', permission: 'sales:read' },
  { path: '/sales/cost-estimations', moduleKey: 'cost-estimations', permission: 'sales:read' },
  { path: '/sales/quotations', moduleKey: 'quotations', permission: 'sales:read' },
  { path: '/sales/sales-orders', moduleKey: 'sales-orders', permission: 'sales:read' },
  { path: '/sales/marketing-npds', moduleKey: 'marketing-npds', permission: 'sales:read' },
  { path: '/sales/marketing-ppc', moduleKey: 'marketing-ppc', permission: 'sales:read' },
  { path: '/sales/marketing-qa', moduleKey: 'marketing-qa', permission: 'sales:read' },
  { path: '/sales/marketing-packing-dispatch', moduleKey: 'marketing-packing-dispatch', permission: 'sales:read' },
  { path: '/sales/packing', moduleKey: 'packing', permission: 'sales:read' },
  { path: '/sales/dispatches', moduleKey: 'dispatches', permission: 'sales:read' },

  { path: '/production/plans', moduleKey: 'production-plans', permission: 'production:read' },
  { path: '/production/machine-allocations', moduleKey: 'machine-allocations', permission: 'production:read' },
  { path: '/production/employee-allocations', moduleKey: 'employee-allocations', permission: 'production:read' },

  { path: '/inventory/requisitions', moduleKey: 'material-requisitions', permission: 'inventory:read' },
  { path: '/inventory/returns', moduleKey: 'material-returns', permission: 'inventory:read' },
  { path: '/inventory/consumptions', moduleKey: 'material-consumptions', permission: 'inventory:read' },
  { path: '/inventory/transfers', moduleKey: 'stock-transfers', permission: 'inventory:read' },

  { path: '/quality/inspections', moduleKey: 'inspections', permission: 'quality:read' },
  { path: '/quality/ncrs', moduleKey: 'ncrs', permission: 'quality:read' },
  { path: '/quality/capas', moduleKey: 'capas', permission: 'quality:read' },
  { path: '/quality/reworks', moduleKey: 'reworks', permission: 'quality:read' },
  { path: '/quality/heat-treatments', moduleKey: 'heat-treatments', permission: 'quality:read' },

  { path: '/purchase/orders', moduleKey: 'purchase-orders', permission: 'purchase:read' },
  { path: '/purchase/outsourcing', moduleKey: 'outsourcing', permission: 'purchase:read' },

  { path: '/admin/notifications', moduleKey: 'notifications', permission: 'notifications:read' },
  { path: '/admin/audit-logs', moduleKey: 'audit-logs', permission: 'auditLogs:read' },
];

export function AppRoutes() {
  const { user } = useAuth();
  const defaultPath = getDefaultAuthorizedPath(user);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<PermissionRoute permission="reports:read"><DashboardPage /></PermissionRoute>} />
        <Route path="/sales/dashboard" element={<PermissionRoute permission="sales:read"><MarketingDashboardPage /></PermissionRoute>} />
        <Route path="/sales/customers" element={<PermissionRoute permission="customers:read"><CustomersPage /></PermissionRoute>} />
        <Route path="/sales/customers/:id" element={<PermissionRoute permission="customers:read"><CustomerDetailPage /></PermissionRoute>} />
        <Route path="/sales/customer-contacts" element={<PermissionRoute permission="customers:read"><CustomerContactsPage /></PermissionRoute>} />
        <Route path="/sales/existing-parts" element={<PermissionRoute permission="sales:read"><ExistingPartsPage /></PermissionRoute>} />
        <Route path="/sales/reports" element={<PermissionRoute permission="sales:read"><MarketingReportsPage /></PermissionRoute>} />
        <Route path="/sales/enquiries" element={<PermissionRoute permission="sales:read"><MarketingEnquiriesPage /></PermissionRoute>} />
        <Route path="/sales/quotations" element={<PermissionRoute permission="sales:read"><MarketingQuotationsPage /></PermissionRoute>} />
        <Route path="/search" element={<AnyPermissionRoute permissions={['reports:read', 'sales:read']}><SearchPage /></AnyPermissionRoute>} />
        <Route path="/settings" element={<PermissionRoute permission="settings:read"><SettingsPage /></PermissionRoute>} />
        <Route path="/reports" element={<PermissionRoute permission="reports:read"><ReportsPage /></PermissionRoute>} />

        <Route path="/production/orders" element={<PermissionRoute permission="production:read"><ProductionOrdersPage /></PermissionRoute>} />
        <Route path="/inventory/issues" element={<PermissionRoute permission="inventory:read"><MaterialIssuesPage /></PermissionRoute>} />
        <Route path="/inventory/scrap" element={<PermissionRoute permission="production:read"><ScrapPage /></PermissionRoute>} />
        <Route path="/inventory/stock" element={<PermissionRoute permission="inventory:read"><InventoryPage /></PermissionRoute>} />
        <Route path="/purchase/goods-receipts" element={<PermissionRoute permission="purchase:read"><GoodsReceiptsPage /></PermissionRoute>} />

        {MODULE_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PermissionRoute permission={route.permission}>
                <GenericModulePage moduleKey={route.moduleKey} />
              </PermissionRoute>
            }
          />
        ))}
        {/* Generic fallback so any module can also be reached by key directly */}
        <Route path="/modules/:moduleKey" element={<GenericModulePage />} />

        <Route index element={<Navigate to={defaultPath} replace />} />
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
