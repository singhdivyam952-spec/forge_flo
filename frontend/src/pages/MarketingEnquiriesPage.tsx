import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import { ResourceCrudPage } from '../components/common/ResourceCrudPage';
import { marketingApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { StatusChip } from '../components/common/StatusChip';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'].map((value) => ({ label: value, value }));
const STATUS_OPTIONS = ['Open', 'UnderReview', 'Quoted', 'Converted', 'Lost', 'Closed'].map((value) => ({ label: value, value }));

export function MarketingEnquiriesPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const convertMutation = useMutation({
    mutationFn: (id: string) => marketingApi.convertEnquiryToRfq(id),
    onSuccess: () => {
      enqueueSnackbar('RFQ created from enquiry', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['resource', '/enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['resource', '/rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Conversion failed'), { variant: 'error' }),
  });

  return (
    <ResourceCrudPage
      title="Customer Enquiry"
      endpoint="/enquiries"
      searchPlaceholder="Search by enquiry number or customer reference…"
      columns={[
        { id: 'enquiryNumber', label: 'Enquiry No.' },
        { id: 'customer', label: 'Customer', render: (row) => { const c = row.customer as Record<string, unknown> | undefined; return c ? `${c.code} — ${c.name}` : '—'; } },
        { id: 'customerReferenceNumber', label: 'Customer Ref.' },
        { id: 'priority', label: 'Priority' },
        { id: 'expectedOrderValue', label: 'Expected Order Value', align: 'right' },
        { id: 'status', label: 'Status', render: (row) => <StatusChip status={String(row.status ?? '—')} /> },
      ]}
      fields={[
        { name: 'customer', label: 'Customer ID', required: true },
        { name: 'contactPerson', label: 'Contact Person' },
        { name: 'customerReferenceNumber', label: 'Customer Reference Number' },
        { name: 'source', label: 'Source' },
        { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY_OPTIONS, defaultValue: 'Medium' },
        { name: 'expectedAnnualVolume', label: 'Expected Annual Volume', type: 'number' },
        { name: 'salesExecutive', label: 'Sales Executive (User ID)' },
        { name: 'enquiryDate', label: 'Enquiry Date', type: 'date' },
        { name: 'dueDate', label: 'Due Date', type: 'date' },
        { name: 'leadTimeDays', label: 'Lead Time (days)', type: 'number' },
        { name: 'deliveryLocation', label: 'Delivery Location' },
        { name: 'expectedOrderValue', label: 'Expected Order Value', type: 'number' },
        { name: 'selectedProcesses', label: 'Selected Processes (comma separated)' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, defaultValue: 'Open' },
        { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
      ]}
      transformSubmit={(values) => ({
        ...values,
        selectedProcesses:
          typeof values.selectedProcesses === 'string'
            ? String(values.selectedProcesses).split(',').map((value) => value.trim()).filter(Boolean)
            : values.selectedProcesses,
      })}
      rowActions={(row) =>
        String(row.status) === 'Converted' ? null : (
          <Tooltip title="Convert to RFQ">
            <IconButton size="small" color="primary" onClick={() => convertMutation.mutate(String(row._id))}>
              <CompareArrowsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
    />
  );
}

export default MarketingEnquiriesPage;
