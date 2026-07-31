import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrowOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunchOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import TimelineIcon from '@mui/icons-material/TimelineOutlined';

import { productionOrdersApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';
import { StatusChip } from '../components/common/StatusChip';
import type { ListParams } from '../api/resources';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

interface ProductionOrderRow extends Record<string, unknown> {
  _id: string;
  orderNumber: string;
  status: string;
  priority: string;
  qty: number;
  qtyCompleted: number;
  yieldPercent: number;
  scrapPercent: number;
  material?: { code?: string; name?: string };
}

export function ProductionOrdersPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [traceabilityId, setTraceabilityId] = useState<string | null>(null);

  const listParams: ListParams = { page: page + 1, limit: rowsPerPage, ...(search ? { search } : {}) };
  const queryKey = ['resource', '/production-orders', listParams];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => productionOrdersApi.list(listParams),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['resource', '/production-orders'] });

  const { control, handleSubmit, reset } = useForm<Record<string, unknown>>({
    defaultValues: {
      material: '',
      qty: '',
      uom: 'NOS',
      bom: '',
      routing: '',
      sourceWarehouse: '',
      targetWarehouse: '',
      priority: 'Medium',
      plannedStart: '',
      plannedEnd: '',
      remarks: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => productionOrdersApi.create(payload),
    onSuccess: () => {
      enqueueSnackbar('Production order created', { variant: 'success' });
      invalidate();
      setCreateOpen(false);
      reset();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Create failed'), { variant: 'error' }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'release' | 'start' | 'complete' }) => {
      if (action === 'release') return productionOrdersApi.release(id);
      if (action === 'start') return productionOrdersApi.start(id);
      return productionOrdersApi.complete(id);
    },
    onSuccess: (_data, variables) => {
      enqueueSnackbar(`Production order ${variables.action}d successfully`, { variant: 'success' });
      invalidate();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Action failed'), { variant: 'error' }),
  });

  const { data: traceability, isLoading: traceabilityLoading } = useQuery({
    queryKey: ['production-order-traceability', traceabilityId],
    queryFn: () => productionOrdersApi.traceability(traceabilityId as string),
    enabled: Boolean(traceabilityId),
  });

  const onSubmit = handleSubmit((values) => {
    const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
    createMutation.mutate({ ...cleaned, qty: Number(cleaned.qty) });
  });

  const rows = (data?.data ?? []) as ProductionOrderRow[];
  const meta = data?.meta;

  const columns = useMemo(
    () => [
      { id: 'orderNumber', label: 'Order No.' },
      {
        id: 'material',
        label: 'Material',
        render: (row: ProductionOrderRow) => (row.material ? `${row.material.code} — ${row.material.name}` : '—'),
      },
      { id: 'qty', label: 'Qty', align: 'right' as const },
      { id: 'qtyCompleted', label: 'Completed', align: 'right' as const },
      { id: 'yieldPercent', label: 'Yield %', align: 'right' as const, render: (row: ProductionOrderRow) => `${row.yieldPercent ?? 0}%` },
      { id: 'scrapPercent', label: 'Scrap %', align: 'right' as const, render: (row: ProductionOrderRow) => `${row.scrapPercent ?? 0}%` },
      { id: 'priority', label: 'Priority', render: (row: ProductionOrderRow) => <Chip size="small" label={row.priority} variant="outlined" /> },
      { id: 'status', label: 'Status', render: (row: ProductionOrderRow) => <StatusChip status={row.status} /> },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Production Orders"
        subtitle="Plan, release, and track shop-floor production execution"
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => invalidate()}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New Production Order
            </Button>
          </>
        }
      />

      <DataTable<ProductionOrderRow>
        columns={columns}
        rows={rows}
        meta={meta}
        page={page}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
        loading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Search by order number…"
        rowActions={(row) => (
          <>
            {row.status === 'Planned' && (
              <Tooltip title="Release">
                <IconButton size="small" color="info" onClick={() => actionMutation.mutate({ id: row._id, action: 'release' })}>
                  <RocketLaunchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {row.status === 'Released' && (
              <Tooltip title="Start">
                <IconButton size="small" color="primary" onClick={() => actionMutation.mutate({ id: row._id, action: 'start' })}>
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {row.status === 'InProgress' && (
              <Tooltip title="Complete">
                <IconButton size="small" color="success" onClick={() => actionMutation.mutate({ id: row._id, action: 'complete' })}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Traceability">
              <IconButton size="small" onClick={() => setTraceabilityId(row._id)}>
                <TimelineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      />

      <FormDialog
        open={createOpen}
        title="New Production Order"
        onClose={() => setCreateOpen(false)}
        onSave={onSubmit}
        saving={createMutation.isPending}
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Controller name="material" control={control} render={({ field }) => <TextField {...field} label="Material ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="qty" control={control} render={({ field }) => <TextField {...field} label="Quantity" type="number" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="uom" control={control} render={({ field }) => <TextField {...field} label="UOM" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Priority" fullWidth>
                  {PRIORITIES.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller name="bom" control={control} render={({ field }) => <TextField {...field} label="BOM ID (optional)" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="routing" control={control} render={({ field }) => <TextField {...field} label="Routing ID (optional)" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="sourceWarehouse" control={control} render={({ field }) => <TextField {...field} label="Source Warehouse ID" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="targetWarehouse" control={control} render={({ field }) => <TextField {...field} label="Target Warehouse ID" fullWidth />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="plannedStart"
              control={control}
              render={({ field }) => <TextField {...field} label="Planned Start" type="date" fullWidth InputLabelProps={{ shrink: true }} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="plannedEnd"
              control={control}
              render={({ field }) => <TextField {...field} label="Planned End" type="date" fullWidth InputLabelProps={{ shrink: true }} />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => <TextField {...field} label="Remarks" fullWidth multiline minRows={2} />}
            />
          </Grid>
        </Grid>
      </FormDialog>

      <FormDialog
        open={Boolean(traceabilityId)}
        title="Production Order Traceability"
        onClose={() => setTraceabilityId(null)}
        maxWidth="md"
        hideActions
      >
        {traceabilityLoading && <Typography variant="body2">Loading traceability…</Typography>}
        {traceability && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={4}>
                <Typography variant="caption" color="text.secondary">Yield %</Typography>
                <Typography variant="h6">{(traceability.materialFlow as Record<string, unknown>)?.yieldPercent as number ?? 0}%</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="caption" color="text.secondary">Scrap %</Typography>
                <Typography variant="h6">{(traceability.materialFlow as Record<string, unknown>)?.scrapPercent as number ?? 0}%</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="caption" color="text.secondary">Recovery %</Typography>
                <Typography variant="h6">{(traceability.materialFlow as Record<string, unknown>)?.recoveryPercent as number ?? 0}%</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Stock Ledger</Typography>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Voucher Type</TableCell>
                    <TableCell>Voucher No.</TableCell>
                    <TableCell align="right">Qty In</TableCell>
                    <TableCell align="right">Qty Out</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {((traceability.stockLedger as Record<string, unknown>[]) ?? []).map((l, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{String(l.voucherType ?? '—')}</TableCell>
                      <TableCell>{String(l.voucherNumber ?? '—')}</TableCell>
                      <TableCell align="right">{String(l.qtyIn ?? 0)}</TableCell>
                      <TableCell align="right">{String(l.qtyOut ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                  {((traceability.stockLedger as unknown[]) ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No ledger entries yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </FormDialog>
    </>
  );
}

export default ProductionOrdersPage;
