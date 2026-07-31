import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface LoadingScreenProps {
  label?: string;
  fullHeight?: boolean;
}

export function LoadingScreen({ label = 'Loading…', fullHeight = true }: LoadingScreenProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: fullHeight ? '100vh' : '100%',
        width: '100%',
        py: fullHeight ? 0 : 8,
      }}
    >
      <CircularProgress size={36} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default LoadingScreen;
