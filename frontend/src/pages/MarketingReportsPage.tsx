import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import apiClient, { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { FormDialog } from '../components/common/FormDialog';
import { useState } from 'react';

const REPORTS = [
  { key: 'customers', title: 'Customer Report', icon: PeopleAltOutlinedIcon },
  { key: 'enquiries', title: 'Enquiry Report', icon: ContactMailOutlinedIcon },
  { key: 'quotations', title: 'Quotation Report', icon: ReceiptLongOutlinedIcon },
  { key: 'sales-orders', title: 'Purchase Order Report', icon: ShoppingCartOutlinedIcon },
  { key: 'conversion', title: 'Conversion Report', icon: TrendingUpOutlinedIcon },
  { key: 'sales-executive-performance', title: 'Sales Executive Performance', icon: AssessmentOutlinedIcon },
  { key: 'customer-wise-revenue', title: 'Customer Wise Revenue', icon: AssessmentOutlinedIcon },
  { key: 'top-customers', title: 'Top Customers', icon: TrendingUpOutlinedIcon },
] as const;

export function MarketingReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewData, setPreviewData] = useState<unknown>(null);

  const downloadMutation = useMutation({
    mutationFn: async (reportKey: string) => {
      const response = await apiClient.get(`/marketing/reports/${reportKey}`, {
        params: { format: 'excel' },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportKey}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onSuccess: (_d, reportKey) => enqueueSnackbar(`${reportKey} downloaded`, { variant: 'success' }),
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Download failed'), { variant: 'error' }),
  });

  const previewMutation = useMutation({
    mutationFn: async (reportKey: string) => (await apiClient.get(`/marketing/reports/${reportKey}`)).data.data,
    onSuccess: (data, reportKey) => {
      setPreviewTitle(reportKey);
      setPreviewData(data);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Preview failed'), { variant: 'error' }),
  });

  return (
    <>
      <PageHeader title="Marketing Reports" subtitle="Customer, enquiry, quotation, order, conversion, and revenue reporting" />
      <Grid container spacing={2}>
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Grid key={report.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ width: 40, height: 40, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', color: '#fff', mb: 1.5 }}>
                    <Icon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{report.title}</Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={() => downloadMutation.mutate(report.key)}>
                    Excel
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => previewMutation.mutate(report.key)}>
                    Preview
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <FormDialog open={Boolean(previewData)} title={previewTitle} onClose={() => setPreviewData(null)} maxWidth="md" hideActions>
        <Box component="pre" sx={{ maxHeight: 480, overflow: 'auto', p: 2, borderRadius: 1, bgcolor: 'action.hover', fontSize: '0.75rem' }}>
          {JSON.stringify(previewData, null, 2)}
        </Box>
      </FormDialog>
    </>
  );
}

export default MarketingReportsPage;
