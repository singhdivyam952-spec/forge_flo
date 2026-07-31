import type { SvgIconComponent } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import WarehouseIcon from '@mui/icons-material/WarehouseOutlined';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import ApartmentIcon from '@mui/icons-material/ApartmentOutlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTreeOutlined';
import TimelineIcon from '@mui/icons-material/TimelineOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircleOutlined';
import ContactMailIcon from '@mui/icons-material/ContactMailOutlined';
import RequestQuoteIcon from '@mui/icons-material/RequestQuoteOutlined';
import CalculateIcon from '@mui/icons-material/CalculateOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import PlayCircleIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import GroupWorkIcon from '@mui/icons-material/GroupWorkOutlined';
import PersonPinIcon from '@mui/icons-material/PersonPinCircleOutlined';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturnOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChartOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHorizOutlined';
import RecyclingIcon from '@mui/icons-material/RecyclingOutlined';
import FactCheckIcon from '@mui/icons-material/FactCheckOutlined';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import BuildCircleIcon from '@mui/icons-material/BuildCircleOutlined';
import HandymanIcon from '@mui/icons-material/HandymanOutlined';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import MoveToInboxIcon from '@mui/icons-material/MoveToInboxOutlined';
import OutboundIcon from '@mui/icons-material/OutboundOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import ManageSearchIcon from '@mui/icons-material/ManageSearchOutlined';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, permission: 'reports:read' }],
  },
  {
    label: 'Masters',
    items: [
      { label: 'Customers', path: '/masters/customers', icon: PeopleIcon, permission: 'customers:read' },
      { label: 'Suppliers', path: '/masters/suppliers', icon: BusinessIcon, permission: 'suppliers:read' },
      { label: 'Materials', path: '/masters/materials', icon: InventoryIcon, permission: 'materials:read' },
      { label: 'Warehouses', path: '/masters/warehouses', icon: WarehouseIcon, permission: 'inventory:read' },
      { label: 'Machines', path: '/masters/machines', icon: PrecisionManufacturingIcon, permission: 'maintenance:read' },
      { label: 'Work Centers', path: '/masters/work-centers', icon: ApartmentIcon, permission: 'production:read' },
      { label: 'Shifts', path: '/masters/shifts', icon: ScheduleIcon, permission: 'production:read' },
      { label: 'Users', path: '/masters/users', icon: BadgeIcon, permission: 'users:read' },
      { label: 'Roles', path: '/masters/roles', icon: SecurityIcon, permission: 'roles:read' },
    ],
  },
  {
    label: 'Engineering',
    items: [
      { label: 'BOMs', path: '/engineering/boms', icon: AccountTreeIcon, permission: 'engineering:read' },
      { label: 'Routings', path: '/engineering/routings', icon: TimelineIcon, permission: 'engineering:read' },
      { label: 'Drawings', path: '/engineering/drawings', icon: DescriptionIcon, permission: 'engineering:read' },
      { label: 'NPD', path: '/engineering/npd', icon: ScienceIcon, permission: 'engineering:read' },
      { label: 'Engineering Changes', path: '/engineering/engineering-changes', icon: ChangeCircleIcon, permission: 'engineering:read' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Dashboard', path: '/sales/dashboard', icon: DashboardIcon, permission: 'sales:read' },
      { label: 'Customers', path: '/sales/customers', icon: PeopleIcon, permission: 'customers:read' },
      { label: 'Customer Contacts', path: '/sales/customer-contacts', icon: ContactMailIcon, permission: 'customers:read' },
      { label: 'Enquiries', path: '/sales/enquiries', icon: ContactMailIcon, permission: 'sales:read' },
      { label: 'RFQs', path: '/sales/rfqs', icon: RequestQuoteIcon, permission: 'sales:read' },
      { label: 'Existing Parts', path: '/sales/existing-parts', icon: ManageSearchIcon, permission: 'sales:read' },
      { label: 'Cost Estimations', path: '/sales/cost-estimations', icon: CalculateIcon, permission: 'sales:read' },
      { label: 'Quotations', path: '/sales/quotations', icon: ReceiptLongIcon, permission: 'sales:read' },
      { label: 'Sales Orders', path: '/sales/sales-orders', icon: ShoppingCartIcon, permission: 'sales:read' },
      { label: 'Reports', path: '/sales/reports', icon: AssessmentIcon, permission: 'sales:read' },
    ],
  },
  {
    label: 'Dispatch / Logistics',
    items: [
      { label: 'Packing', path: '/sales/packing', icon: Inventory2Icon, permission: 'sales:read' },
      { label: 'Dispatches', path: '/sales/dispatches', icon: LocalShippingIcon, permission: 'sales:read' },
    ],
  },
  {
    label: 'Production',
    items: [
      { label: 'Production Plans', path: '/production/plans', icon: EventNoteIcon, permission: 'production:read' },
      { label: 'Production Orders', path: '/production/orders', icon: PlayCircleIcon, permission: 'production:read' },
      { label: 'Machine Allocations', path: '/production/machine-allocations', icon: GroupWorkIcon, permission: 'production:read' },
      { label: 'Employee Allocations', path: '/production/employee-allocations', icon: PersonPinIcon, permission: 'production:read' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Stock Balances & Ledger', path: '/inventory/stock', icon: ShowChartIcon, permission: 'inventory:read' },
      { label: 'Material Requisitions', path: '/inventory/requisitions', icon: AssignmentIcon, permission: 'inventory:read' },
      { label: 'Material Issues', path: '/inventory/issues', icon: MoveToInboxIcon, permission: 'inventory:read' },
      { label: 'Material Returns', path: '/inventory/returns', icon: AssignmentReturnIcon, permission: 'inventory:read' },
      { label: 'Material Consumptions', path: '/inventory/consumptions', icon: OutboundIcon, permission: 'inventory:read' },
      { label: 'Stock Transfers', path: '/inventory/transfers', icon: SwapHorizIcon, permission: 'inventory:read' },
      { label: 'Scrap', path: '/inventory/scrap', icon: RecyclingIcon, permission: 'production:read' },
    ],
  },
  {
    label: 'Quality',
    items: [
      { label: 'Inspections', path: '/quality/inspections', icon: FactCheckIcon, permission: 'quality:read' },
      { label: 'NCRs', path: '/quality/ncrs', icon: ReportProblemIcon, permission: 'quality:read' },
      { label: 'CAPAs', path: '/quality/capas', icon: BuildCircleIcon, permission: 'quality:read' },
      { label: 'Reworks', path: '/quality/reworks', icon: HandymanIcon, permission: 'quality:read' },
      { label: 'Heat Treatments', path: '/quality/heat-treatments', icon: LocalFireDepartmentIcon, permission: 'quality:read' },
    ],
  },
  {
    label: 'Purchase',
    items: [
      { label: 'Purchase Orders', path: '/purchase/orders', icon: ShoppingCartIcon, permission: 'purchase:read' },
      { label: 'Goods Receipts', path: '/purchase/goods-receipts', icon: MoveToInboxIcon, permission: 'purchase:read' },
      { label: 'Outsourcing', path: '/purchase/outsourcing', icon: HandymanIcon, permission: 'purchase:read' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Reports', path: '/reports', icon: AssessmentIcon, permission: 'reports:read' },
      { label: 'Notifications', path: '/admin/notifications', icon: NotificationsIcon, permission: 'notifications:read' },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: HistoryIcon, permission: 'auditLogs:read' },
      { label: 'Settings', path: '/settings', icon: SettingsIcon, permission: 'settings:read' },
    ],
  },
];

export const DRAWER_WIDTH = 260;
