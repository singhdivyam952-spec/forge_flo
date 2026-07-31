import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import RecyclingIcon from '@mui/icons-material/RecyclingOutlined';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';

import apiClient, { getErrorMessage } from '../api/client';
import { downloadReport } from '../api/resources';
import { PageHeader } from '../components/common/PageHeader';
import { FormDialog } from '../components/common/FormDialog';

interface ReportDef {
  key: string;
  title: string;
  description: string;
  path: string;
  icon: typeof AssessmentOutlinedIcon;
  supportsExcel: boolean;
}

const REPORTS: ReportDef[] = [
  {
    key: 'material-consumption',
    title: 'Material Consumption',
    description: 'Issued, consumed, returned and scrapped quantities by production order.',
    path: '/reports/material-consumption',
    icon: PrecisionManufacturingIcon,
    supportsExcel: true,
  },
  {
    key: 'scrap-analysis',
    title: 'Scrap Analysis',
    description: 'Scrap generation, recovery, and disposal value across the shop floor.',
    path: '/reports/scrap-analysis',
    icon: RecyclingIcon,
    supportsExcel: true,
  },
  {
    key: 'inventory',
    title: 'Inventory Valuation',
    description: 'Point-in-time stock balances, quantities, and valuation by warehouse.',
    path: '/reports/inventory',
    icon: Inventory2Icon,
    supportsExcel: true,
  },
  {
    key: 'machine-utilization',
    title: 'Machine Utilization',
    description: 'Machine-wise completed quantity and running hours.',
    path: '/reports/machine-utilization',
    icon: AssessmentOutlinedIcon,
    supportsExcel: false,
  },
  {
    key: 'stock-ledger',
    title: 'Stock Ledger',
    description: 'Chronological, immutable record of every stock movement.',
    path: '/reports/stock-ledger',
    icon: ReceiptLongIcon,
    supportsExcel: false,
  },
];

export function ReportsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const downloadMutation = useMutation({
    mutationFn: (report: ReportDef) => downloadReport(report.path, 'excel', `${report.key}.xlsx`),
    onSuccess: (_data, report) => enqueueSnackbar(`${report.title} downloaded`, { variant: 'success' }),
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Download failed'), { variant: 'error' }),
  });

  const previewMutation = useMutation({
    mutationFn: async (report: ReportDef) => {
      const response = await apiClient.get(report.path);
      return { report, data: response.data.data };
    },
    onSuccess: ({ report, data }) => {
      setPreviewTitle(report.title);
      setPreviewData(data);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Failed to load report'), { variant: 'error' }),
  });

  return (
    <>
      <PageHeader title="Reports" subtitle="Export or preview operational and financial reports" />

      <Grid container spacing={2}>
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Grid key={report.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.main',
                      color: '#fff',
                      mb: 1.5,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{report.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {report.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  {report.supportsExcel ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadMutation.mutate(report)}
                      disabled={downloadMutation.isPending}
                    >
                      Download Excel
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => previewMutation.mutate(report)}
                      disabled={previewMutation.isPending}
                    >
                      Preview Data
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <FormDialog
        open={Boolean(previewData)}
        title={previewTitle}
        onClose={() => setPreviewData(null)}
        maxWidth="md"
        hideActions
      >
        <Box
          component="pre"
          sx={{
            fontSize: '0.72rem',
            maxHeight: 480,
            overflow: 'auto',
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
          }}
        >
          {JSON.stringify(previewData, null, 2)}
        </Box>
      </FormDialog>
    </>
  );
}

export default ReportsPage;
