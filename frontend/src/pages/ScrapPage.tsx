import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import RecyclingIcon from '@mui/icons-material/RecyclingOutlined';
import PaidIcon from '@mui/icons-material/PaidOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';

import { scrapsApi } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { ResourceCrudPage } from '../components/common/ResourceCrudPage';
import { FormDialog } from '../components/common/FormDialog';
import { StatusChip } from '../components/common/StatusChip';
import { LoadingScreen } from '../components/common/LoadingScreen';

const SCRAP_TYPES = ['Turning', 'Machining', 'Rejection', 'Trim', 'ProcessLoss', 'Other'];
const DISPOSAL_METHODS = ['Sale', 'Recycle', 'Disposal', 'ReturnToStock'];

export function ScrapPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['scrap-dashboard'],
    queryFn: scrapsApi.dashboard,
  });

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [disposeTarget, setDisposeTarget] = useState<Record<string, unknown> | null>(null);

  const { control, handleSubmit, reset } = useForm<Record<string, unknown>>({
    defaultValues: { disposalMethod: 'Sale', saleValue: '' },
  });

  const disposeMutation = useMutation({
    mutationFn: (payload: { id: string; disposalMethod: string; saleValue?: number }) =>
      scrapsApi.dispose(payload.id, { disposalMethod: payload.disposalMethod, saleValue: payload.saleValue }),
    onSuccess: () => {
      enqueueSnackbar('Scrap marked as disposed', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['resource', '/scraps'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-dashboard'] });
      setDisposeTarget(null);
      reset();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Dispose failed'), { variant: 'error' }),
  });

  const onDisposeSubmit = handleSubmit((values) => {
    if (!disposeTarget) return;
    disposeMutation.mutate({
      id: String(disposeTarget._id),
      disposalMethod: values.disposalMethod as string,
      saleValue: values.saleValue ? Number(values.saleValue) : undefined,
    });
  });

  return (
    <>
      <PageHeader title="Scrap Management" subtitle="Track scrap generation, recovery, and disposal across production" />

      {dashboardLoading || !dashboard ? (
        <LoadingScreen fullHeight={false} label="Loading scrap KPIs…" />
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <KpiCard label="Total Scrap" value={dashboard.totalScrap?.toFixed(1) ?? 0} suffix="kg" icon={RecyclingIcon} tone="error" helperText={`${dashboard.scrapCount} entries`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <KpiCard label="Today's Scrap" value={dashboard.dailyScrap?.toFixed(1) ?? 0} suffix="kg" icon={Inventory2Icon} tone="warning" helperText={`${dashboard.dailyCount} entries`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <KpiCard label="Sale Value" value={`₹${(dashboard.totalSaleValue ?? 0).toLocaleString('en-IN')}`} icon={PaidIcon} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <KpiCard label="Recovery %" value={dashboard.recoveryPercent ?? 0} suffix="%" icon={TrendingUpIcon} tone="info" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <KpiCard label="Scrap %" value={dashboard.scrapPercent ?? 0} suffix="%" icon={LocalShippingIcon} tone="error" />
          </Grid>
        </Grid>
      )}

      <ResourceCrudPage
        title="Scrap"
        endpoint="/scraps"
        idField="_id"
        searchPlaceholder="Search by scrap number or reason…"
        columns={[
          { id: 'scrapNumber', label: 'Scrap No.' },
          { id: 'scrapType', label: 'Type' },
          { id: 'material', label: 'Material', render: (row) => { const m = row.material as Record<string, unknown> | undefined; return m ? `${m.code} — ${m.name}` : '—'; } },
          { id: 'weight', label: 'Weight (kg)', align: 'right' },
          { id: 'saleValue', label: 'Sale Value', align: 'right' },
          { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status as string} /> },
        ]}
        fields={[
          { name: 'scrapType', label: 'Scrap Type', type: 'select', options: SCRAP_TYPES.map((v) => ({ label: v, value: v })), required: true },
          { name: 'material', label: 'Material ID', required: true },
          { name: 'productionOrder', label: 'Production Order ID' },
          { name: 'weight', label: 'Weight (kg)', type: 'number' },
          { name: 'reason', label: 'Reason' },
          { name: 'machine', label: 'Machine ID' },
          { name: 'operator', label: 'Operator (User ID)' },
          { name: 'recoveredMaterial', label: 'Recovered Material ID' },
          { name: 'recoveredQty', label: 'Recovered Qty', type: 'number' },
          { name: 'saleValue', label: 'Sale Value', type: 'number' },
          { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
        ]}
        disableEdit
        rowActions={(row) =>
          row.status !== 'Disposed' && row.status !== 'Sold' ? (
            <Tooltip title="Dispose / Sell">
              <IconButton size="small" color="warning" onClick={() => setDisposeTarget(row)}>
                <LocalShippingIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null
        }
      />

      <FormDialog
        open={Boolean(disposeTarget)}
        title="Dispose Scrap"
        onClose={() => setDisposeTarget(null)}
        onSave={onDisposeSubmit}
        saving={disposeMutation.isPending}
        maxWidth="xs"
      >
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid size={12}>
            <Controller
              name="disposalMethod"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Disposal Method" fullWidth>
                  {DISPOSAL_METHODS.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={12}>
            <Controller name="saleValue" control={control} render={({ field }) => <TextField {...field} label="Sale Value" type="number" fullWidth />} />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}

export default ScrapPage;
