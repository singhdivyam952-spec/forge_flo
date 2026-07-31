import { useMemo, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import dayjs from 'dayjs';
import { fetchCustomerOverview, fetchCustomerTimeline, marketingApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingScreen } from '../components/common/LoadingScreen';

function KeyValue({ label, value }: { label: string; value: unknown }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value ? String(value) : '—'}</Typography>
    </Box>
  );
}

export function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ['marketing-customer-overview', id],
    queryFn: () => fetchCustomerOverview<Record<string, unknown>>(id),
    enabled: Boolean(id),
  });
  const timelineQuery = useQuery({
    queryKey: ['marketing-customer-timeline', id],
    queryFn: () => fetchCustomerTimeline<Record<string, unknown>>(id),
    enabled: Boolean(id),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('entityType', 'Customer');
      form.append('entityId', id);
      form.append('category', 'CustomerDocument');
      return marketingApi.uploadFile(form);
    },
    onSuccess: () => {
      enqueueSnackbar('Customer document uploaded', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['marketing-customer-overview', id] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Upload failed'), { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => marketingApi.deleteFile(fileId),
    onSuccess: () => {
      enqueueSnackbar('Document deleted', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['marketing-customer-overview', id] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Delete failed'), { variant: 'error' }),
  });

  const customer = overviewQuery.data?.customer as Record<string, unknown> | undefined;
  const contacts = useMemo(() => (customer?.contacts as Record<string, unknown>[] | undefined) ?? [], [customer]);
  const addresses = useMemo(() => (customer?.addresses as Record<string, unknown>[] | undefined) ?? [], [customer]);
  const documents = useMemo(() => (customer?.documents as Record<string, unknown>[] | undefined) ?? [], [customer]);
  const quotations = (overviewQuery.data?.quotationHistory as Record<string, unknown>[] | undefined) ?? [];
  const orders = (overviewQuery.data?.orderHistory as Record<string, unknown>[] | undefined) ?? [];
  const enquiries = (overviewQuery.data?.enquiryHistory as Record<string, unknown>[] | undefined) ?? [];
  const timelineEvents = (timelineQuery.data?.events as Record<string, unknown>[] | undefined) ?? [];

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = '';
  };

  if (overviewQuery.isLoading || !overviewQuery.data) {
    return <LoadingScreen fullHeight={false} label="Loading customer workspace…" />;
  }

  return (
    <>
      <PageHeader title={String(customer?.name ?? 'Customer')} subtitle={`Customer workspace for ${String(customer?.code ?? '')}`} />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="Customer Code" value={customer?.code} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="Company" value={customer?.companyName ?? customer?.name} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="Contact Person" value={customer?.contactPerson} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="Status" value={customer?.status ?? ((customer?.isActive as boolean) ? 'Active' : 'Inactive')} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="Mobile" value={customer?.mobile ?? customer?.phone} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="Email" value={customer?.email} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="GST Number" value={customer?.gstNumber} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><KeyValue label="PAN Number" value={customer?.panNumber} /></Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
          <Tab label="General" />
          <Tab label="Address" />
          <Tab label="Contacts" />
          <Tab label="Documents" />
          <Tab label="Quotation History" />
          <Tab label="Order History" />
          <Tab label="Timeline" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><KeyValue label="Industry" value={customer?.industry} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><KeyValue label="Payment Terms" value={customer?.paymentTerms} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><KeyValue label="Credit Limit" value={customer?.creditLimit} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><KeyValue label="Remarks" value={customer?.remarks} /></Grid>
            <Grid size={{ xs: 12 }}><KeyValue label="Enquiries" value={enquiries.length} /></Grid>
          </Grid>
        </Paper>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {addresses.length === 0 && <Grid size={12}><Typography color="text.secondary">No addresses available</Typography></Grid>}
            {addresses.map((address, idx) => (
              <Grid key={idx} size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>{String(address.label ?? address.addressType ?? 'Address')}</Typography>
                  <Typography variant="body2">{String(address.addressLine1 ?? '')}</Typography>
                  <Typography variant="body2">{String(address.addressLine2 ?? '')}</Typography>
                  <Typography variant="body2">{`${address.city ?? ''}, ${address.state ?? ''}, ${address.country ?? ''} ${address.pincode ?? ''}`}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {tab === 2 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {contacts.length === 0 && <Grid size={12}><Typography color="text.secondary">No contacts available</Typography></Grid>}
            {contacts.map((contact, idx) => (
              <Grid key={idx} size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography fontWeight={700}>{String(contact.name ?? 'Contact')}</Typography>
                    {contact.isPrimary ? <Chip size="small" label="Primary" color="primary" /> : null}
                  </Stack>
                  <Typography variant="body2">{String(contact.department ?? '—')} / {String(contact.designation ?? '—')}</Typography>
                  <Typography variant="body2">{String(contact.phone ?? '—')}</Typography>
                  <Typography variant="body2">{String(contact.email ?? '—')}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Customer Documents</Typography>
            <Button variant="contained" component="label" startIcon={<UploadFileOutlinedIcon />} disabled={uploadMutation.isPending}>
              Upload Document
              <input hidden type="file" onChange={onFileChange} />
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No documents uploaded</Typography></TableCell></TableRow>
                )}
                {documents.map((doc) => (
                  <TableRow key={String(doc._id)}>
                    <TableCell>{String(doc.originalName ?? '—')}</TableCell>
                    <TableCell>{String(doc.category ?? 'Other')}</TableCell>
                    <TableCell>{String(doc.version ?? 1)}</TableCell>
                    <TableCell>{doc.previewUrl ? <Button size="small" href={String(doc.previewUrl)} target="_blank">Preview</Button> : '—'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => deleteMutation.mutate(String(doc._id))}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 4 && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Quotation</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {quotations.map((row) => (
                  <TableRow key={String(row._id)}>
                    <TableCell>{String(row.quotationNumber ?? '—')}</TableCell>
                    <TableCell>{dayjs(String(row.quotationDate)).format('DD-MMM-YYYY')}</TableCell>
                    <TableCell>{String(row.status ?? '—')}</TableCell>
                    <TableCell align="right">{String(row.totalAmount ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 5 && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Sales Order</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {orders.map((row) => (
                  <TableRow key={String(row._id)}>
                    <TableCell>{String(row.soNumber ?? '—')}</TableCell>
                    <TableCell>{dayjs(String(row.orderDate)).format('DD-MMM-YYYY')}</TableCell>
                    <TableCell>{String(row.status ?? '—')}</TableCell>
                    <TableCell align="right">{String(row.totalAmount ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 6 && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Event</TableCell><TableCell>Reference</TableCell></TableRow></TableHead>
              <TableBody>
                {timelineEvents.map((row, idx) => (
                  <TableRow key={`${String(row.entityId)}-${idx}`}>
                    <TableCell>{dayjs(String(row.date)).format('DD-MMM-YYYY HH:mm')}</TableCell>
                    <TableCell>{String(row.type ?? '—')}</TableCell>
                    <TableCell>{String(row.label ?? '—')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );
}

export default CustomerDetailPage;
