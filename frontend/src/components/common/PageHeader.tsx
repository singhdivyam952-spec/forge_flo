import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 0.5, fontSize: '0.72rem' }} separator="›">
          {breadcrumbs.map((crumb, idx) => (
            <Link key={idx} underline="hover" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              {crumb}
            </Link>
          ))}
        </Breadcrumbs>
      )}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Stack direction="row" spacing={1} alignItems="center">{actions}</Stack>}
      </Stack>
    </Box>
  );
}

export default PageHeader;
