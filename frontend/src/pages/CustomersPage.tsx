import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { ResourceCrudPage } from '../components/common/ResourceCrudPage';
import { StatusChip } from '../components/common/StatusChip';

export function CustomersPage() {
  const navigate = useNavigate();

  return (
    <ResourceCrudPage
      title="Customers"
      endpoint="/customers"
      searchPlaceholder="Search by code, name, company, GST, phone, or email…"
      columns={[
        { id: 'code', label: 'Customer Code' },
        { id: 'name', label: 'Customer Name' },
        { id: 'companyName', label: 'Company Name' },
        { id: 'contactPerson', label: 'Contact Person' },
        { id: 'mobile', label: 'Mobile' },
        { id: 'email', label: 'Email' },
        { id: 'industry', label: 'Industry' },
        { id: 'creditLimit', label: 'Credit Limit', align: 'right' },
        { id: 'status', label: 'Status', render: (row) => <StatusChip status={String(row.status ?? (row.isActive ? 'Active' : 'Inactive'))} /> },
      ]}
      fields={[
        { name: 'code', label: 'Customer Code' },
        { name: 'name', label: 'Customer Name', required: true },
        { name: 'companyName', label: 'Company Name' },
        { name: 'contactPerson', label: 'Contact Person' },
        { name: 'mobile', label: 'Mobile' },
        { name: 'email', label: 'Email' },
        { name: 'gstNumber', label: 'GST Number' },
        { name: 'panNumber', label: 'PAN Number' },
        { name: 'industry', label: 'Industry' },
        { name: 'paymentTerms', label: 'Payment Terms' },
        { name: 'creditLimit', label: 'Credit Limit', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }] },
        { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
      ]}
      rowActions={(row) => (
        <Tooltip title="View customer workspace">
          <IconButton size="small" onClick={() => navigate(`/sales/customers/${String(row._id)}`)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    />
  );
}

export default CustomersPage;
