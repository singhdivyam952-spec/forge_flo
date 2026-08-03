import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid2';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import { ResourceCrudPage } from '../components/common/ResourceCrudPage';
import { FormDialog } from '../components/common/FormDialog';
import { marketingApi, createResource } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { StatusChip } from '../components/common/StatusChip';

const PRIORITY_OPTIONS = ['Low', 'Moderate', 'High', 'Urgent'].map((value) => ({ label: value, value }));
const STATUS_OPTIONS = ['Open', 'UnderReview', 'Quoted', 'Converted', 'Lost', 'Closed'].map((value) => ({
  label: value,
  value,
}));
const PROCESS_OPTIONS = ['Machining', 'Forging', 'Fabrication', 'Casting', 'Other'].map((value) => ({
  label: value,
  value,
}));
const DOC_CATEGORIES = [
  { key: 'Drawing', label: 'Drawing' },
  { key: 'CAD', label: 'CAD File' },
  { key: 'MaterialSpecification', label: 'Material Specification' },
] as const;

export function MarketingEnquiriesPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const enquiriesApi = createResource('/enquiries');

  const [docsTarget, setDocsTarget] = useState<Record<string, unknown> | null>(null);
  const [docMeta, setDocMeta] = useState({ quantity: '', deliverySchedule: '', materialSpecification: '' });
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  const docsQuery = useQuery({
    queryKey: ['enquiry-docs', docsTarget?._id],
    queryFn: () => marketingApi.listFiles('CustomerEnquiry', String(docsTarget?._id)),
    enabled: Boolean(docsTarget?._id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['resource', '/enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['marketing-dashboard'] });
  };

  const convertMutation = useMutation({
    mutationFn: (id: string) => marketingApi.convertEnquiryToRfq(id),
    onSuccess: () => {
      enqueueSnackbar('RFQ created — continue with feasibility / engineering', { variant: 'success' });
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['resource', '/rfqs'] });
      navigate('/sales/rfqs');
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Conversion failed'), { variant: 'error' }),
  });

  const createNpdMutation = useMutation({
    mutationFn: (id: string) => marketingApi.createNpdFromEnquiry(id),
    onSuccess: () => {
      enqueueSnackbar('NPD project created from enquiry', { variant: 'success' });
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['resource', '/marketing-npds'] });
      navigate('/sales/marketing-npds');
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'NPD create failed'), { variant: 'error' }),
  });

  const existingPartMutation = useMutation({
    mutationFn: (payload: { id: string; existingPartMatched: boolean; existingPartReference?: string }) =>
      marketingApi.setExistingPartDecision(payload.id, {
        existingPartMatched: payload.existingPartMatched,
        existingPartReference: payload.existingPartReference,
      }),
    onSuccess: (_data, vars) => {
      enqueueSnackbar(vars.existingPartMatched ? 'Marked as existing part — continue feasibility' : 'Marked as new part', {
        variant: 'success',
      });
      invalidate();
      if (!vars.existingPartMatched) {
        createNpdMutation.mutate(vars.id);
      } else {
        navigate('/sales/marketing-npds');
      }
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Update failed'), { variant: 'error' }),
  });

  const advanceMutation = useMutation({
    mutationFn: (payload: { id: string; stage: string }) => marketingApi.advanceEnquiryWorkflow(payload.id, payload.stage),
    onSuccess: (_data, vars) => {
      enqueueSnackbar(`Moved to ${vars.stage}`, { variant: 'success' });
      invalidate();
      if (vars.stage === 'CostEstimation') navigate('/sales/cost-estimations');
      if (vars.stage === 'Quotation') navigate('/sales/quotations');
      if (vars.stage === 'Feasibility') navigate('/sales/marketing-npds');
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Workflow update failed'), { variant: 'error' }),
  });

  const saveDocsMetaMutation = useMutation({
    mutationFn: async () => {
      if (!docsTarget?._id) return;
      await enquiriesApi.update(String(docsTarget._id), {
        quantity: docMeta.quantity ? Number(docMeta.quantity) : undefined,
        deliverySchedule: docMeta.deliverySchedule || undefined,
        materialSpecification: docMeta.materialSpecification || undefined,
      });
      await marketingApi.advanceEnquiryWorkflow(String(docsTarget._id), 'DocumentsUploaded');
    },
    onSuccess: () => {
      enqueueSnackbar('Documents & quantity details saved', { variant: 'success' });
      invalidate();
      setDocsTarget(null);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Save failed'), { variant: 'error' }),
  });

  const uploadDoc = async (category: string, file?: File | null) => {
    if (!docsTarget?._id || !file) return;
    setUploadingCategory(category);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('entityType', 'CustomerEnquiry');
      form.append('entityId', String(docsTarget._id));
      form.append('category', category);
      form.append('description', category);
      await marketingApi.uploadFile(form);
      enqueueSnackbar(`${category} uploaded`, { variant: 'success' });
      await docsQuery.refetch();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, 'Upload failed'), { variant: 'error' });
    } finally {
      setUploadingCategory(null);
    }
  };

  const openDocs = (row: Record<string, unknown>) => {
    setDocsTarget(row);
    setDocMeta({
      quantity: row.quantity != null ? String(row.quantity) : '',
      deliverySchedule: String(row.deliverySchedule ?? ''),
      materialSpecification: String(row.materialSpecification ?? ''),
    });
  };

  return (
    <>
      <ResourceCrudPage
        title="Customer Enquiry / RFQ"
        subtitle="Flow: Enquiry → Documents → Process → Existing Part / NPD → Feasibility → Cost → Quotation → Purchase Order"
        endpoint="/enquiries"
        searchPlaceholder="Search by enquiry number, customer ID, or name…"
        columns={[
          { id: 'enquiryNumber', label: 'Enquiry No.' },
          { id: 'customerId', label: 'Customer ID' },
          { id: 'customerName', label: 'Customer Name' },
          { id: 'processType', label: 'Process' },
          { id: 'partName', label: 'Part Name' },
          { id: 'workflowStage', label: 'Stage' },
          { id: 'priority', label: 'Priority' },
          { id: 'status', label: 'Status', render: (row) => <StatusChip status={String(row.status ?? '—')} /> },
        ]}
        fields={[
          {
            name: 'customerId',
            label: 'Customer ID',
            readOnly: true,
            helperText: 'Auto-generated on save',
          },
          { name: 'customerName', label: 'Customer Name', required: true },
          { name: 'contactPerson', label: 'Contact Person' },
          { name: 'customerReferenceNumber', label: 'Customer Reference Number' },
          { name: 'source', label: 'Source' },
          { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY_OPTIONS, defaultValue: 'Moderate' },
          { name: 'marketingHead', label: 'Marketing Head ID' },
          { name: 'enquiryDate', label: 'Enquiry Date', type: 'date' },
          { name: 'rfqDate', label: 'RFQ Date', type: 'date' },
          { name: 'dueDate', label: 'Due Date', type: 'date' },
          {
            name: 'processType',
            label: 'Process Type',
            type: 'select',
            options: PROCESS_OPTIONS,
            required: true,
            helperText: 'Machining / Forging / Fabrication / Casting / Other',
          },
          { name: 'partName', label: 'Part Name' },
          { name: 'partNumber', label: 'Part No.' },
          { name: 'customerDrawingNo', label: 'Customer Drawing No.' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'quantityUom', label: 'Qty UOM', defaultValue: 'Nos' },
          { name: 'deliverySchedule', label: 'Delivery Schedule', type: 'textarea', gridSize: 12 },
          { name: 'materialSpecification', label: 'Material Specification', type: 'textarea', gridSize: 12 },
          { name: 'expectedOrderValue', label: 'Expected Order Value', type: 'number' },
          { name: 'deliveryLocation', label: 'Delivery Location' },
          { name: 'leadTimeDays', label: 'Lead Time (days)', type: 'number' },
          { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, defaultValue: 'Open' },
          { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
        ]}
        transformSubmit={(values) => {
          const { customerId, ...rest } = values;
          const payload: Record<string, unknown> = {
            ...rest,
            selectedProcesses:
              typeof values.processType === 'string' && values.processType ? [values.processType] : [],
          };
          if (customerId) payload.customerId = customerId;
          return payload;
        }}
        rowActions={(row) => (
          <>
            <Tooltip title="Upload customer documents">
              <IconButton size="small" color="primary" onClick={() => openDocs(row)}>
                <UploadFileOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Check existing parts">
              <IconButton
                size="small"
                onClick={() => {
                  const params = new URLSearchParams({
                    customer: String(row.customerId ?? ''),
                    partNumber: String(row.partNumber ?? ''),
                    partName: String(row.partName ?? ''),
                    drawingNumber: String(row.customerDrawingNo ?? ''),
                    process: String(row.processType ?? ''),
                    enquiryId: String(row._id),
                  });
                  navigate(`/sales/existing-parts?${params.toString()}`);
                }}
              >
                <ManageSearchOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Existing part → Feasibility">
              <IconButton
                size="small"
                color="success"
                onClick={() =>
                  existingPartMutation.mutate({
                    id: String(row._id),
                    existingPartMatched: true,
                    existingPartReference: String(row.partNumber ?? row.enquiryNumber ?? ''),
                  })
                }
              >
                <ThumbUpAltOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="New part → Create NPD">
              <IconButton size="small" color="secondary" onClick={() => createNpdMutation.mutate(String(row._id))}>
                <ScienceOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Feasible → Cost Estimation">
              <IconButton
                size="small"
                onClick={() => advanceMutation.mutate({ id: String(row._id), stage: 'CostEstimation' })}
              >
                <CalculateOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Convert to RFQ">
              <IconButton size="small" color="primary" onClick={() => convertMutation.mutate(String(row._id))}>
                <CompareArrowsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      />

      <FormDialog
        open={Boolean(docsTarget)}
        title={`Customer Documents — ${String(docsTarget?.enquiryNumber ?? '')}`}
        onClose={() => setDocsTarget(null)}
        onSave={() => saveDocsMetaMutation.mutate()}
        saving={saveDocsMetaMutation.isPending}
        maxWidth="sm"
      >
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Upload Drawing, CAD, and Material Specification. Enter Quantity and Delivery Schedule.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={docMeta.quantity}
                onChange={(e) => setDocMeta((s) => ({ ...s, quantity: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Delivery Schedule"
                multiline
                minRows={2}
                value={docMeta.deliverySchedule}
                onChange={(e) => setDocMeta((s) => ({ ...s, deliverySchedule: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Material Specification (notes)"
                multiline
                minRows={2}
                value={docMeta.materialSpecification}
                onChange={(e) => setDocMeta((s) => ({ ...s, materialSpecification: e.target.value }))}
              />
            </Grid>
          </Grid>

          {DOC_CATEGORIES.map((cat) => {
            const uploaded = (docsQuery.data ?? []).find((f) => f.category === cat.key);
            return (
              <Stack key={cat.key} direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" component="label" disabled={uploadingCategory === cat.key}>
                  {uploadingCategory === cat.key ? 'Uploading…' : `Upload ${cat.label}`}
                  <input
                    hidden
                    type="file"
                    onChange={(e) => {
                      void uploadDoc(cat.key, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </Button>
                <Typography variant="body2" color={uploaded ? 'success.main' : 'text.secondary'}>
                  {uploaded ? String(uploaded.originalName ?? 'Uploaded') : 'Not uploaded'}
                </Typography>
              </Stack>
            );
          })}

          <TextField
            select
            fullWidth
            label="After save, mark existing part?"
            defaultValue=""
            onChange={(e) => {
              if (!docsTarget?._id || !e.target.value) return;
              if (e.target.value === 'yes') {
                existingPartMutation.mutate({
                  id: String(docsTarget._id),
                  existingPartMatched: true,
                  existingPartReference: String(docsTarget.partNumber ?? ''),
                });
              }
              if (e.target.value === 'no') {
                createNpdMutation.mutate(String(docsTarget._id));
              }
            }}
          >
            <MenuItem value="">Decide later</MenuItem>
            <MenuItem value="yes">Yes — Existing part (go to feasibility)</MenuItem>
            <MenuItem value="no">No — Create NPD project</MenuItem>
          </TextField>
        </Stack>
      </FormDialog>
    </>
  );
}

export default MarketingEnquiriesPage;
