import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { ResourceCrudPage } from '../components/common/ResourceCrudPage';
import { FormDialog } from '../components/common/FormDialog';
import { marketingApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { StatusChip } from '../components/common/StatusChip';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Revised'].map((value) => ({ label: value, value }));
const APPROVAL_OPTIONS = ['Draft', 'PendingApproval', 'Approved', 'Rejected'].map((value) => ({ label: value, value }));

export function MarketingQuotationsPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [emailTargetId, setEmailTargetId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState('');

  const convertMutation = useMutation({
    mutationFn: (id: string) => marketingApi.convertQuotationToSalesOrder(id),
    onSuccess: () => {
      enqueueSnackbar('Purchase order created from quotation', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['resource', '/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['resource', '/sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Conversion failed'), { variant: 'error' }),
  });

  const emailMutation = useMutation({
    mutationFn: (payload: { id: string; recipients: string[] }) => marketingApi.emailQuotation(payload.id, payload.recipients),
    onSuccess: () => {
      enqueueSnackbar('Quotation emailed', { variant: 'success' });
      setEmailTargetId(null);
      setRecipients('');
      queryClient.invalidateQueries({ queryKey: ['resource', '/quotations'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Email failed'), { variant: 'error' }),
  });

  return (
    <>
      <ResourceCrudPage
        title="Quotation"
        endpoint="/quotations"
        searchPlaceholder="Search by quotation number…"
        columns={[
          { id: 'quotationNumber', label: 'Quotation No.' },
          { id: 'customer', label: 'Customer', render: (row) => { const c = row.customer as Record<string, unknown> | undefined; return c ? `${c.code} — ${c.name}` : '—'; } },
          { id: 'approvalStatus', label: 'Approval' },
          { id: 'totalAmount', label: 'Amount', align: 'right' },
          { id: 'status', label: 'Status', render: (row) => <StatusChip status={String(row.status ?? '—')} /> },
        ]}
        fields={[
          { name: 'customer', label: 'Customer ID', required: true },
          { name: 'rfq', label: 'RFQ ID' },
          { name: 'costEstimation', label: 'Cost Estimation ID' },
          { name: 'quotationDate', label: 'Quotation Date', type: 'date' },
          { name: 'validUntil', label: 'Valid Until', type: 'date' },
          { name: 'paymentTerms', label: 'Payment Terms' },
          { name: 'deliveryTerms', label: 'Delivery Terms' },
          { name: 'taxes', label: 'Taxes', type: 'number' },
          { name: 'discountAmount', label: 'Discount Amount', type: 'number' },
          { name: 'approvalStatus', label: 'Approval Status', type: 'select', options: APPROVAL_OPTIONS, defaultValue: 'Draft' },
          { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, defaultValue: 'Draft' },
          { name: 'totalAmount', label: 'Total Amount', type: 'number' },
          { name: 'currency', label: 'Currency', defaultValue: 'INR' },
          { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
        ]}
        rowActions={(row) => (
          <>
            <Tooltip title="Download PDF">
              <IconButton size="small" component="a" href={`/api/marketing/quotations/${String(row._id)}/pdf`} target="_blank">
                <PictureAsPdfOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Email quotation">
              <IconButton size="small" onClick={() => setEmailTargetId(String(row._id))}>
                <SendOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Convert to Purchase Order">
              <IconButton size="small" color="primary" onClick={() => convertMutation.mutate(String(row._id))}>
                <CompareArrowsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      />

      <FormDialog
        open={Boolean(emailTargetId)}
        title="Email Quotation"
        onClose={() => {
          setEmailTargetId(null);
          setRecipients('');
        }}
        onSave={() => emailTargetId && emailMutation.mutate({ id: emailTargetId, recipients: recipients.split(',').map((value) => value.trim()).filter(Boolean) })}
        saving={emailMutation.isPending}
      >
        <TextField
          fullWidth
          label="Recipients"
          helperText="Enter one or more comma-separated email addresses"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
        />
      </FormDialog>
    </>
  );
}

export default MarketingQuotationsPage;
