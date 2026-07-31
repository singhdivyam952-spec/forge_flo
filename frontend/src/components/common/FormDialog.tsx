import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import type { ReactNode } from 'react';

interface FormDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hideActions?: boolean;
}

export function FormDialog({
  open,
  title,
  children,
  onClose,
  onSave,
  saving = false,
  saveLabel = 'Save',
  maxWidth = 'sm',
  hideActions = false,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          disabled={saving}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {!hideActions && (
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          {onSave && (
            <Button
              onClick={onSave}
              disabled={saving}
              variant="contained"
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {saveLabel}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default FormDialog;
