import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import OutboxIcon from '@mui/icons-material/OutboxOutlined';

import { goodsReceiptsApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';
import { StatusChip } from '../components/common/StatusChip';
import type { ListParams } from '../api/resources';

interface GoodsReceiptRow extends Record<string, unknown> {
  _id: string;
  grnNumber: string;
  status: string;
  receivedDate: string;
  supplier?: { code?: string; name?: string };
  warehouse?: { code?: string };
  items: { material?: { code?: string }; receivedQty: number; uom: string }[];
}

export function GoodsReceiptsPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const listParams: ListParams = { page: page + 1, limit: rowsPerPage, ...(search ? { search } : {}) };
  const queryKey = ['resource', '/goods-receipts', listParams];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => goodsReceiptsApi.list(listParams),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['resource', '/goods-receipts'] });

  const { control, handleSubmit, reset } = useForm<Record<string, unknown>>({
    defaultValues: {
      purchaseOrder: '',
      supplier: '',
      warehouse: '',
      invoiceNumber: '',
      material: '',
      receivedQty: '',
      uom: 'NOS',
      unitCost: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      const { material, receivedQty, uom, unitCost, ...rest } = payload;
      return goodsReceiptsApi.create({
        ...rest,
        items: [
          {
            material,
            receivedQty: Number(receivedQty),
            acceptedQty: Number(receivedQty),
            uom,
            unitCost: unitCost ? Number(unitCost) : 0,
          },
        ],
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Goods receipt created', { variant: 'success' });
      invalidate();
      setCreateOpen(false);
      reset();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Create failed'), { variant: 'error' }),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => goodsReceiptsApi.post(id),
    onSuccess: () => {
      enqueueSnackbar('GRN posted — stock updated', { variant: 'success' });
      invalidate();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Post failed'), { variant: 'error' }),
  });

  const onSubmit = handleSubmit((values) => {
    const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
    createMutation.mutate(cleaned);
  });

  const rows = (data?.data ?? []) as GoodsReceiptRow[];
  const meta = data?.meta;

  const columns = useMemo(
    () => [
      { id: 'grnNumber', label: 'GRN No.' },
      { id: 'supplier', label: 'Supplier', render: (row: GoodsReceiptRow) => (row.supplier ? `${row.supplier.code} — ${row.supplier.name}` : '—') },
      { id: 'warehouse', label: 'Warehouse', render: (row: GoodsReceiptRow) => row.warehouse?.code ?? '—' },
      {
        id: 'items',
        label: 'Items',
        render: (row: GoodsReceiptRow) => row.items?.map((i) => `${i.material?.code ?? '—'} (${i.receivedQty} ${i.uom})`).join(', ') || '—',
      },
      { id: 'status', label: 'Status', render: (row: GoodsReceiptRow) => <StatusChip status={row.status} /> },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Goods Receipts"
        subtitle="Receive materials against purchase orders and post to stock"
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => invalidate()}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New Goods Receipt
            </Button>
          </>
        }
      />

      <DataTable<GoodsReceiptRow>
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
        searchPlaceholder="Search by GRN or invoice number…"
        rowActions={(row) =>
          row.status === 'Draft' || row.status === 'Received' ? (
            <Tooltip title="Post — updates stock">
              <IconButton size="small" color="success" onClick={() => postMutation.mutate(row._id)}>
                <OutboxIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null
        }
      />

      <FormDialog
        open={createOpen}
        title="New Goods Receipt"
        onClose={() => setCreateOpen(false)}
        onSave={onSubmit}
        saving={createMutation.isPending}
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="purchaseOrder" control={control} render={({ field }) => <TextField {...field} label="Purchase Order ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="supplier" control={control} render={({ field }) => <TextField {...field} label="Supplier ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="warehouse" control={control} render={({ field }) => <TextField {...field} label="Warehouse ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="invoiceNumber" control={control} render={({ field }) => <TextField {...field} label="Invoice Number" fullWidth />} />
          </Grid>
          <Grid size={12}>
            <Divider textAlign="left">
              <Typography variant="caption" color="text.secondary">Receipt Item</Typography>
            </Divider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="material" control={control} render={({ field }) => <TextField {...field} label="Material ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller name="receivedQty" control={control} render={({ field }) => <TextField {...field} label="Received Qty" type="number" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller name="uom" control={control} render={({ field }) => <TextField {...field} label="UOM" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="unitCost" control={control} render={({ field }) => <TextField {...field} label="Unit Cost" type="number" fullWidth />} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}

export default GoodsReceiptsPage;
