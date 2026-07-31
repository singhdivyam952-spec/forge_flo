import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Alert from '@mui/material/Alert';
import { searchExistingParts } from '../api/resources';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingScreen } from '../components/common/LoadingScreen';

export function ExistingPartsPage() {
  const [filters, setFilters] = useState({
    customer: '',
    partNumber: '',
    partName: '',
    drawingNumber: '',
    material: '',
    process: '',
  });
  const [submitted, setSubmitted] = useState(filters);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['existing-parts', submitted],
    queryFn: () => searchExistingParts(submitted),
  });

  return (
    <>
      <PageHeader title="Existing Parts" subtitle="Check prior quotations, orders, and production history before creating new engineering work" />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label="Customer ID" value={filters.customer} onChange={(e) => setFilters((s) => ({ ...s, customer: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label="Part Number" value={filters.partNumber} onChange={(e) => setFilters((s) => ({ ...s, partNumber: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label="Part Name" value={filters.partName} onChange={(e) => setFilters((s) => ({ ...s, partName: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label="Drawing Number" value={filters.drawingNumber} onChange={(e) => setFilters((s) => ({ ...s, drawingNumber: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label="Material" value={filters.material} onChange={(e) => setFilters((s) => ({ ...s, material: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label="Process" value={filters.process} onChange={(e) => setFilters((s) => ({ ...s, process: e.target.value }))} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => setSubmitted(filters)}>Search Existing Parts</Button>
        </Stack>
      </Paper>

      {(isLoading || isFetching) && <LoadingScreen fullHeight={false} label="Searching previous parts…" />}

      {data?.createNewNpdSuggested && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No strong match found. Proceed with a new NPD / engineering review flow.
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Quotation</TableCell>
                <TableCell>Previous Cost</TableCell>
                <TableCell>Sales Orders</TableCell>
                <TableCell>Production History</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.results ?? []).length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">No prior part history found</Typography>
                  </TableCell>
                </TableRow>
              )}
              {(data?.results ?? []).map((row, idx) => {
                const entry = row as Record<string, unknown>;
                const quotation = entry.quotation as Record<string, unknown> | undefined;
                const previousCost = entry.previousCost as Record<string, unknown> | null | undefined;
                const previousSalesOrders = (entry.previousSalesOrders as Record<string, unknown>[] | undefined) ?? [];
                const productionHistory = (entry.productionHistory as Record<string, unknown>[] | undefined) ?? [];
                return (
                  <TableRow key={String(quotation?._id ?? idx)}>
                    <TableCell>{String(quotation?.quotationNumber ?? '—')}</TableCell>
                    <TableCell>
                      {previousCost ? `Total ${String(previousCost.totalCost ?? '—')} / Unit ${String(previousCost.unitCost ?? '—')}` : '—'}
                    </TableCell>
                    <TableCell>{previousSalesOrders.map((s) => String(s.soNumber ?? '—')).join(', ') || '—'}</TableCell>
                    <TableCell>{productionHistory.map((p) => String(p.orderNumber ?? '—')).join(', ') || '—'}</TableCell>
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

export default ExistingPartsPage;
