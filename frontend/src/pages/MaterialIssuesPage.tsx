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

import { materialIssuesApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';
import { StatusChip } from '../components/common/StatusChip';
import type { ListParams } from '../api/resources';

interface MaterialIssueRow extends Record<string, unknown> {
  _id: string;
  issueNumber: string;
  status: string;
  issueDate: string;
  warehouse?: { code?: string; name?: string };
  productionOrder?: { orderNumber?: string };
  lines: { material?: { code?: string; name?: string }; qty: number; uom: string }[];
}

export function MaterialIssuesPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const listParams: ListParams = { page: page + 1, limit: rowsPerPage, ...(search ? { search } : {}) };
  const queryKey = ['resource', '/material-issues', listParams];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => materialIssuesApi.list(listParams),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['resource', '/material-issues'] });

  const { control, handleSubmit, reset } = useForm<Record<string, unknown>>({
    defaultValues: {
      warehouse: '',
      productionOrder: '',
      material: '',
      qty: '',
      uom: 'NOS',
      remarks: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      const { material, qty, uom, ...rest } = payload;
      return materialIssuesApi.create({
        ...rest,
        lines: [{ material, qty: Number(qty), uom }],
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Material issue created', { variant: 'success' });
      invalidate();
      setCreateOpen(false);
      reset();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Create failed'), { variant: 'error' }),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => materialIssuesApi.post(id),
    onSuccess: () => {
      enqueueSnackbar('Material issue posted — stock updated', { variant: 'success' });
      invalidate();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Post failed'), { variant: 'error' }),
  });

  const onSubmit = handleSubmit((values) => {
    const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
    createMutation.mutate(cleaned);
  });

  const rows = (data?.data ?? []) as MaterialIssueRow[];
  const meta = data?.meta;

  const columns = useMemo(
    () => [
      { id: 'issueNumber', label: 'Issue No.' },
      {
        id: 'productionOrder',
        label: 'Production Order',
        render: (row: MaterialIssueRow) => row.productionOrder?.orderNumber ?? '—',
      },
      { id: 'warehouse', label: 'Warehouse', render: (row: MaterialIssueRow) => row.warehouse?.code ?? '—' },
      {
        id: 'lines',
        label: 'Lines',
        render: (row: MaterialIssueRow) =>
          row.lines?.map((l) => `${l.material?.code ?? '—'} (${l.qty} ${l.uom})`).join(', ') || '—',
      },
      { id: 'status', label: 'Status', render: (row: MaterialIssueRow) => <StatusChip status={row.status} /> },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Material Issues"
        subtitle="Issue raw materials from stores to production orders"
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => invalidate()}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New Material Issue
            </Button>
          </>
        }
      />

      <DataTable<MaterialIssueRow>
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
        searchPlaceholder="Search by issue number…"
        rowActions={(row) =>
          row.status === 'Draft' ? (
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
        title="New Material Issue"
        onClose={() => setCreateOpen(false)}
        onSave={onSubmit}
        saving={createMutation.isPending}
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="warehouse" control={control} render={({ field }) => <TextField {...field} label="Warehouse ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="productionOrder" control={control} render={({ field }) => <TextField {...field} label="Production Order ID" fullWidth />} />
          </Grid>
          <Grid size={12}>
            <Divider textAlign="left">
              <Typography variant="caption" color="text.secondary">Issue Line</Typography>
            </Divider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="material" control={control} render={({ field }) => <TextField {...field} label="Material ID" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller name="qty" control={control} render={({ field }) => <TextField {...field} label="Qty" type="number" fullWidth required />} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller name="uom" control={control} render={({ field }) => <TextField {...field} label="UOM" fullWidth required />} />
          </Grid>
          <Grid size={12}>
            <Controller name="remarks" control={control} render={({ field }) => <TextField {...field} label="Remarks" fullWidth multiline minRows={2} />} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}

export default MaterialIssuesPage;
