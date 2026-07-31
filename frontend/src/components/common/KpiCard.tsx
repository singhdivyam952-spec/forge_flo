import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SvgIconComponent } from '@mui/icons-material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export type KpiTone = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: SvgIconComponent;
  tone?: KpiTone;
  suffix?: string;
  delta?: number;
  helperText?: string;
}

export function KpiCard({ label, value, icon: Icon, tone = 'primary', suffix, delta, helperText }: KpiCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, lineHeight: 1.2 }}>
              {value}
              {suffix && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  {suffix}
                </Typography>
              )}
            </Typography>
            {helperText && (
              <Typography variant="caption" color="text.secondary">
                {helperText}
              </Typography>
            )}
            {typeof delta === 'number' && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                {delta >= 0 ? (
                  <TrendingUpIcon fontSize="inherit" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="inherit" color="error" />
                )}
                <Typography variant="caption" color={delta >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                  {Math.abs(delta)}%
                </Typography>
              </Stack>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${tone}.main`,
                color: `${tone}.contrastText`,
                opacity: 0.92,
                flexShrink: 0,
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default KpiCard;
