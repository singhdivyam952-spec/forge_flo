import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { fetchMarketingDashboard } from '../api/resources';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingScreen } from '../components/common/LoadingScreen';

const PIE_COLORS = ['#0B3A6E', '#2A6FAD', '#6A91B6', '#C77700', '#B23B3B', '#4F6D7A'];

function num(value: unknown): string {
  return Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function MarketingDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['marketing-dashboard'],
    queryFn: () => fetchMarketingDashboard<Record<string, unknown>>(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return <LoadingScreen fullHeight={false} label="Loading marketing dashboard…" />;
  }

  const cards = data.cards as Record<string, unknown>;
  const charts = data.charts as Record<string, unknown[]>;
  const widgets = data.widgets as Record<string, unknown>;
  const recentActivities = (widgets.recentActivities as Record<string, unknown>[]) ?? [];
  const topCustomers = (widgets.topCustomers as Record<string, unknown>[]) ?? [];

  const monthlyEnquiries = (charts.monthlyEnquiries ?? []).map((item) => ({
    ...(item as Record<string, unknown>),
    label: dayjs(String((item as Record<string, unknown>)._id)).format('MMM YY'),
  }));

  const salesOrderTrend = (charts.salesOrderTrend ?? []).map((item) => ({
    ...(item as Record<string, unknown>),
    label: dayjs(String((item as Record<string, unknown>)._id)).format('MMM YY'),
  }));

  return (
    <>
      <PageHeader
        title="Marketing Dashboard"
        subtitle="Customer pipeline, quotation funnel, and order conversion overview"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/sales/customers')}>New Customer</Button>
            <Button variant="contained" onClick={() => navigate('/sales/enquiries')}>New Enquiry</Button>
            <Button variant="outlined" onClick={() => navigate('/sales/rfqs')}>Create RFQ</Button>
            <Button variant="outlined" onClick={() => navigate('/sales/quotations')}>Create Quotation</Button>
          </Stack>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Total Customers" value={num(cards.totalCustomers)} icon={PeopleAltOutlinedIcon} tone="primary" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Active Customers" value={num(cards.activeCustomers)} icon={PeopleAltOutlinedIcon} tone="success" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="New Enquiries" value={num(cards.newEnquiries)} icon={ContactMailOutlinedIcon} tone="warning" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Pending RFQs" value={num(cards.pendingRfqs)} icon={RequestQuoteOutlinedIcon} tone="info" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Pending Quotations" value={num(cards.pendingQuotations)} icon={ReceiptLongOutlinedIcon} tone="warning" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Approved Quotations" value={num(cards.approvedQuotations)} icon={ReceiptLongOutlinedIcon} tone="success" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Sales Orders Created" value={num(cards.salesOrdersCreated)} icon={ShoppingCartOutlinedIcon} tone="primary" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KpiCard label="Monthly Conversion Rate" value={num(cards.monthlyConversionRate)} suffix="%" icon={TrendingUpOutlinedIcon} tone="success" /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined">
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Monthly Enquiries</Typography>} />
            <Box sx={{ height: 300, p: 1 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyEnquiries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Enquiries" fill="#0B3A6E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Paper variant="outlined">
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Quotation Status</Typography>} />
            <Box sx={{ height: 300, p: 1 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={(charts.quotationStatus ?? []) as Record<string, unknown>[]} dataKey="count" nameKey="_id" outerRadius={95}>
                    {((charts.quotationStatus ?? []) as Record<string, unknown>[]).map((entry, index) => (
                      <Cell key={String(entry._id)} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined">
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Sales Order Trend</Typography>} />
            <Box sx={{ height: 300, p: 1 }}>
              <ResponsiveContainer>
                <LineChart data={salesOrderTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Orders" stroke="#0B3A6E" strokeWidth={2} />
                  <Line type="monotone" dataKey="value" name="Value" stroke="#2A6FAD" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined">
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Top Customers</Typography>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topCustomers.map((row) => {
                    const customer = row.customer as Record<string, unknown> | undefined;
                    return (
                      <TableRow key={String(row._id)}>
                        <TableCell>{customer ? `${customer.code} — ${customer.name}` : '—'}</TableCell>
                        <TableCell align="right">{num(row.orders)}</TableCell>
                        <TableCell align="right">₹{num(row.revenue)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined">
            <CardHeader title={<Typography variant="subtitle1" fontWeight={700}>Recent Activities</Typography>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivities.map((row, index) => (
                    <TableRow key={`${String(row.type)}-${index}`}>
                      <TableCell>{String(row.type ?? '—')}</TableCell>
                      <TableCell>{String(row.number ?? '—')}</TableCell>
                      <TableCell>{String(row.status ?? '—')}</TableCell>
                      <TableCell>{dayjs(String(row.date)).format('DD-MMM-YYYY HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}

export default MarketingDashboardPage;
