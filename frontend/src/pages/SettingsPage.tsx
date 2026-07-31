import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Stack from '@mui/material/Stack';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import CircularProgress from '@mui/material/CircularProgress';

import { fetchSettings, updateSettings } from '../api/resources';
import { getErrorMessage } from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingScreen } from '../components/common/LoadingScreen';

interface SettingsForm {
  companyName: string;
  companyCode: string;
  gstNumber: string;
  panNumber: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  valuationMethod: string;
  fiscalYearStartMonth: number;
  lowStockThresholdPercent: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  maintenanceMode: boolean;
}

export function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => fetchSettings<Record<string, unknown>>() });

  const { control, handleSubmit, reset } = useForm<SettingsForm>({
    defaultValues: {
      companyName: '',
      companyCode: '',
      gstNumber: '',
      panNumber: '',
      phone: '',
      email: '',
      website: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      valuationMethod: 'FIFO',
      fiscalYearStartMonth: 4,
      lowStockThresholdPercent: 10,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      maintenanceMode: false,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        companyName: (data.companyName as string) ?? '',
        companyCode: (data.companyCode as string) ?? '',
        gstNumber: (data.gstNumber as string) ?? '',
        panNumber: (data.panNumber as string) ?? '',
        phone: (data.phone as string) ?? '',
        email: (data.email as string) ?? '',
        website: (data.website as string) ?? '',
        currency: (data.currency as string) ?? 'INR',
        timezone: (data.timezone as string) ?? 'Asia/Kolkata',
        dateFormat: (data.dateFormat as string) ?? 'DD/MM/YYYY',
        valuationMethod: (data.valuationMethod as string) ?? 'FIFO',
        fiscalYearStartMonth: (data.fiscalYearStartMonth as number) ?? 4,
        lowStockThresholdPercent: (data.lowStockThresholdPercent as number) ?? 10,
        emailNotificationsEnabled: (data.emailNotificationsEnabled as boolean) ?? true,
        smsNotificationsEnabled: (data.smsNotificationsEnabled as boolean) ?? false,
        maintenanceMode: (data.maintenanceMode as boolean) ?? false,
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<SettingsForm>) => updateSettings(payload),
    onSuccess: () => {
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Update failed'), { variant: 'error' }),
  });

  const onSubmit = handleSubmit((values) => saveMutation.mutate(values));

  if (isLoading) return <LoadingScreen fullHeight={false} label="Loading settings…" />;

  return (
    <>
      <PageHeader title="Settings" subtitle="Company profile, localization, and system preferences" />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={onSubmit}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Company Profile</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="companyName" control={control} render={({ field }) => <TextField {...field} label="Company Name" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="companyCode" control={control} render={({ field }) => <TextField {...field} label="Company Code" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="gstNumber" control={control} render={({ field }) => <TextField {...field} label="GST Number" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="panNumber" control={control} render={({ field }) => <TextField {...field} label="PAN Number" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="website" control={control} render={({ field }) => <TextField {...field} label="Website" fullWidth />} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Localization & Finance</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="currency" control={control} render={({ field }) => <TextField {...field} label="Currency" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="timezone" control={control} render={({ field }) => <TextField {...field} label="Timezone" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="dateFormat" control={control} render={({ field }) => <TextField {...field} label="Date Format" fullWidth />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="valuationMethod"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Valuation Method" fullWidth>
                    <MenuItem value="FIFO">FIFO</MenuItem>
                    <MenuItem value="Average">Average</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="fiscalYearStartMonth"
                control={control}
                render={({ field }) => <TextField {...field} label="Fiscal Year Start Month" type="number" fullWidth />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="lowStockThresholdPercent"
                control={control}
                render={({ field }) => <TextField {...field} label="Low Stock Threshold (%)" type="number" fullWidth />}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>System</Typography>
          <Stack spacing={0.5}>
            <Controller
              name="emailNotificationsEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Email Notifications" />
              )}
            />
            <Controller
              name="smsNotificationsEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="SMS Notifications" />
              )}
            />
            <Controller
              name="maintenanceMode"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Maintenance Mode" />
              )}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Button
            type="submit"
            variant="contained"
            startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saveMutation.isPending}
          >
            Save Settings
          </Button>
        </form>
      </Paper>
    </>
  );
}

export default SettingsPage;
