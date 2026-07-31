import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid2';
import CardHeader from '@mui/material/CardHeader';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActionsOutlined';
import RecyclingIcon from '@mui/icons-material/RecyclingOutlined';
import PaidIcon from '@mui/icons-material/PaidOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import SpeedIcon from '@mui/icons-material/SpeedOutlined';
import PrecisionManufacturing from '@mui/icons-material/PrecisionManufacturing';

import { fetchDashboard } from '../api/resources';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { StatusChip } from '../components/common/StatusChip';

function formatNumber(value: number | undefined, decimals = 0): string {
  if (value === undefined || Number.isNaN(value)) return '0';
  return value.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return '₹0';
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard, refetchInterval: 60_000 });

  if (isLoading || !data) return <LoadingScreen fullHeight={false} label="Loading dashboard…" />;

  const { kpis, charts, activeProductionOrders } = data;

  const productionTrend = charts.productionTrend.map((p) => ({
    ...p,
    label: dayjs(p._id).format('DD MMM'),
  }));
  const scrapByType = charts.scrapByType.map((s) => ({ type: s._id || 'Unspecified', weight: Number(s.weight?.toFixed?.(1) ?? s.weight) }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Real-time overview of manufacturing operations" />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Today's Production" value={formatNumber(kpis.todaysProduction)} icon={PrecisionManufacturingIcon} tone="primary" helperText={`${kpis.todaysProductionOrders} orders`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Pending Orders" value={formatNumber(kpis.pendingOrders)} icon={PendingActionsIcon} tone="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Today's Scrap" value={formatNumber(kpis.todaysScrap, 1)} suffix="kg" icon={RecyclingIcon} tone="error" helperText={`${kpis.todaysScrapCount} entries`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Low Stock Items" value={formatNumber(kpis.lowStockItems)} icon={WarningAmberIcon} tone="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Monthly Revenue" value={formatCurrency(kpis.revenue)} icon={PaidIcon} tone="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Monthly Profit" value={formatCurrency(kpis.profit)} icon={TrendingUpIcon} tone={kpis.profit >= 0 ? 'success' : 'error'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Production Efficiency" value={formatNumber(kpis.productionEfficiency, 1)} suffix="%" icon={SpeedIcon} tone="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Active Machines" value={formatNumber(kpis.activeMachines)} icon={PrecisionManufacturing} tone="primary" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Yield %" value={formatNumber(kpis.yieldPercent, 1)} suffix="%" tone="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Scrap %" value={formatNumber(kpis.scrapPercent, 1)} suffix="%" tone="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard label="Recovery %" value={formatNumber(kpis.recoveryPercent, 1)} suffix="%" tone="info" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ height: '100%' }}>
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Production Trend (14 days)</Typography>} sx={{ pb: 0 }} />
            <Box sx={{ width: '100%', height: 300, p: 1 }}>
              <ResponsiveContainer>
                <LineChart data={productionTrend} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#0B3A6E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="issued" name="Issued" stroke="#2A6FAD" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="scrap" name="Scrap" stroke="#B23B3B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ height: '100%' }}>
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Scrap by Type</Typography>} sx={{ pb: 0 }} />
            <Box sx={{ width: '100%', height: 300, p: 1 }}>
              <ResponsiveContainer>
                <BarChart data={scrapByType} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="weight" name="Weight (kg)" fill="#C77700" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined">
        <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Active Production Orders</Typography>} sx={{ pb: 0 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order No.</TableCell>
                <TableCell>Material</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Yield %</TableCell>
                <TableCell align="right">Scrap %</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeProductionOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No active production orders</Typography>
                  </TableCell>
                </TableRow>
              )}
              {activeProductionOrders.map((po) => {
                const row = po as Record<string, unknown>;
                const material = row.material as Record<string, unknown> | undefined;
                return (
                  <TableRow key={String(row._id)} hover>
                    <TableCell>{String(row.orderNumber ?? '—')}</TableCell>
                    <TableCell>{material ? `${material.code} — ${material.name}` : '—'}</TableCell>
                    <TableCell align="right">{formatNumber(row.qty as number)}</TableCell>
                    <TableCell align="right">{formatNumber(row.qtyCompleted as number)}</TableCell>
                    <TableCell align="right">{formatNumber(row.yieldPercent as number, 1)}</TableCell>
                    <TableCell align="right">{formatNumber(row.scrapPercent as number, 1)}</TableCell>
                    <TableCell><StatusChip status={row.status as string} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

export default DashboardPage;
