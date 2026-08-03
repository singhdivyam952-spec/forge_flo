import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
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
import { marketingApi, searchExistingParts } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingScreen } from '../components/common/LoadingScreen';

export function ExistingPartsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    customer: searchParams.get('customer') ?? '',
    partNumber: searchParams.get('partNumber') ?? '',
    partName: searchParams.get('partName') ?? '',
    drawingNumber: searchParams.get('drawingNumber') ?? '',
    material: '',
    process: searchParams.get('process') ?? '',
  });
  const [submitted, setSubmitted] = useState(filters);
  const enquiryId = searchParams.get('enquiryId');

  useEffect(() => {
    const next = {
      customer: searchParams.get('customer') ?? '',
      partNumber: searchParams.get('partNumber') ?? '',
      partName: searchParams.get('partName') ?? '',
      drawingNumber: searchParams.get('drawingNumber') ?? '',
      material: '',
      process: searchParams.get('process') ?? '',
    };
    setFilters(next);
    setSubmitted(next);
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['existing-parts', submitted],
    queryFn: () => searchExistingParts(submitted),
  });

  const markExisting = useMutation({
    mutationFn: () =>
      marketingApi.setExistingPartDecision(String(enquiryId), {
        existingPartMatched: true,
        existingPartReference: filters.partNumber || undefined,
      }),
    onSuccess: () => {
      enqueueSnackbar('Existing part selected — continue feasibility / cost estimation', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['resource', '/enquiries'] });
      navigate('/sales/marketing-npds');
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Update failed'), { variant: 'error' }),
  });

  const createNpd = useMutation({
    mutationFn: () => marketingApi.createNpdFromEnquiry(String(enquiryId)),
    onSuccess: () => {
      enqueueSnackbar('No match — NPD project created', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['resource', '/enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['resource', '/marketing-npds'] });
      navigate('/sales/marketing-npds');
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'NPD create failed'), { variant: 'error' }),
  });

  return (
    <>
      <PageHeader
        title="Existing Parts"
        subtitle="Flowchart step: after process type, check if the part already exists. Yes → retrieve data. No → create NPD."
      />

      {enquiryId && (
        <Alert severity="info" sx={{ mb: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={() => markExisting.mutate()} disabled={markExisting.isPending}>
                Yes — Existing Part
              </Button>
              <Button color="inherit" size="small" variant="outlined" onClick={() => createNpd.mutate()} disabled={createNpd.isPending}>
                No — Create NPD
              </Button>
            </Stack>
          }
        >
          Deciding for enquiry. Choose Yes to reuse history, or No to open a new NPD project.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Customer ID" value={filters.customer} onChange={(e) => setFilters((s) => ({ ...s, customer: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Part Number" value={filters.partNumber} onChange={(e) => setFilters((s) => ({ ...s, partNumber: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Part Name" value={filters.partName} onChange={(e) => setFilters((s) => ({ ...s, partName: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Drawing Number" value={filters.drawingNumber} onChange={(e) => setFilters((s) => ({ ...s, drawingNumber: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Material" value={filters.material} onChange={(e) => setFilters((s) => ({ ...s, material: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Process" value={filters.process} onChange={(e) => setFilters((s) => ({ ...s, process: e.target.value }))} />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => setSubmitted(filters)}>Search Existing Parts</Button>
        </Stack>
      </Paper>

      {(isLoading || isFetching) && <LoadingScreen fullHeight={false} label="Searching previous parts…" />}

      {data?.createNewNpdSuggested && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            enquiryId ? (
              <Button color="inherit" size="small" onClick={() => createNpd.mutate()}>
                Create NPD Project
              </Button>
            ) : (
              <Button color="inherit" size="small" onClick={() => navigate('/sales/marketing-npds')}>
                Go to NPD
              </Button>
            )
          }
        >
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
                <TableCell>Purchase Orders</TableCell>
                <TableCell>Production History</TableCell>
                {enquiryId && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.results ?? []).length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={enquiryId ? 5 : 4} align="center" sx={{ py: 5 }}>
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
                    {enquiryId && (
                      <TableCell align="right">
                        <Button size="small" onClick={() => markExisting.mutate()}>
                          Use This
                        </Button>
                      </TableCell>
                    )}
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
