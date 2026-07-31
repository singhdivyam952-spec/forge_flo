import { type ReactNode } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Toolbar from '@mui/material/Toolbar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import type { PaginationMeta } from '../../types/api';

export interface DataTableColumn<T> {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  rows: T[];
  idField?: string;
  meta?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  dense?: boolean;
}

function getRowKey<T extends Record<string, unknown>>(row: T, idField: string, index: number): string {
  const value = row[idField];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : String(index);
}

function getCellValue<T extends Record<string, unknown>>(row: T, id: string): ReactNode {
  const value = id.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, row);
  if (value === null || value === undefined || value === '') return <Box component="span" color="text.disabled">—</Box>;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  idField = '_id',
  meta,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  loading = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  toolbarActions,
  rowActions,
  emptyMessage = 'No records found',
  onRowClick,
  dense = true,
}: DataTableProps<T>) {
  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      {(onSearchChange || toolbarActions) && (
        <Toolbar sx={{ px: 2, py: 1.25, gap: 1.5, minHeight: '56px !important' }}>
          {onSearchChange && (
            <TextField
              size="small"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              sx={{ minWidth: 260 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}
          <Box sx={{ flexGrow: 1 }} />
          {toolbarActions && <Stack direction="row" spacing={1}>{toolbarActions}</Stack>}
        </Toolbar>
      )}
      {loading && <LinearProgress />}
      <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
        <Table size={dense ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align ?? 'left'} sx={{ minWidth: col.minWidth }}>
                  {col.label}
                </TableCell>
              ))}
              {rowActions && (
                <TableCell align="right" sx={{ width: 1 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, index) => (
              <TableRow
                key={getRowKey(row, idField, index)}
                hover
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align ?? 'left'}>
                    {col.render ? col.render(row) : getCellValue(row, col.id)}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {rowActions(row)}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {meta && (
        <TablePagination
          component="div"
          count={meta.totalItems}
          page={page}
          onPageChange={(_e, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      )}
    </Paper>
  );
}

export default DataTable;
