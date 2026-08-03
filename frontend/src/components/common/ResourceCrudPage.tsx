import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

import { createResource, fetchEnquiryByCustomerId, type ListParams } from '../../api/resources';
import { getErrorMessage } from '../../api/client';
import { DataTable, type DataTableColumn } from './DataTable';
import { PageHeader } from './PageHeader';
import { FormDialog } from './FormDialog';
import { ConfirmDialog } from './ConfirmDialog';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'boolean';
  options?: FieldOption[];
  required?: boolean;
  defaultValue?: unknown;
  helperText?: string;
  gridSize?: number;
  readOnly?: boolean;
  /** When true, leaving this field triggers enquiry lookup + auto-fill. */
  autoFillFromEnquiry?: boolean;
}

export interface ResourceCrudPageProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  endpoint: string;
  columns: DataTableColumn<T>[];
  fields: FieldConfig[];
  searchPlaceholder?: string;
  idField?: string;
  extraFilters?: ReactNode;
  filters?: Record<string, unknown>;
  rowActions?: (row: T, helpers: { edit: () => void; remove: () => void }) => ReactNode;
  disableCreate?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  transformSubmit?: (values: Record<string, unknown>) => Record<string, unknown>;
  createLabel?: string;
  /** Map of enquiry response keys → form field names for auto-fill. */
  enquiryAutoFillMap?: Record<string, string>;
}

function buildDefaultValues(fields: FieldConfig[], source?: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (source && field.name in source) {
      const raw = source[field.name];
      if (field.type === 'date' && raw) {
        values[field.name] = String(raw).slice(0, 10);
      } else if (raw !== null && typeof raw === 'object' && '_id' in (raw as Record<string, unknown>)) {
        values[field.name] = (raw as Record<string, unknown>)._id;
      } else if (Array.isArray(raw)) {
        values[field.name] = raw[0] ?? '';
      } else {
        values[field.name] = raw ?? (field.type === 'boolean' ? false : '');
      }
    } else {
      values[field.name] = field.defaultValue ?? (field.type === 'boolean' ? false : '');
    }
  }
  return values;
}

const DEFAULT_ENQUIRY_AUTO_FILL: Record<string, string> = {
  customerName: 'customerName',
  partName: 'partName',
  partNumber: 'partNumber',
  customerDrawingNo: 'customerDrawingNo',
};

export function ResourceCrudPage<T extends Record<string, unknown>>({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder = 'Search…',
  idField = '_id',
  extraFilters,
  filters,
  rowActions,
  disableCreate = false,
  disableEdit = false,
  disableDelete = false,
  transformSubmit,
  createLabel,
  enquiryAutoFillMap = DEFAULT_ENQUIRY_AUTO_FILL,
}: ResourceCrudPageProps<T>) {
  const resource = useMemo(() => createResource<T>(endpoint), [endpoint]);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  const listParams: ListParams = {
    page: page + 1,
    limit: rowsPerPage,
    ...(search ? { search } : {}),
    ...(filters ?? {}),
  };

  const queryKey = ['resource', endpoint, listParams];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => resource.list(listParams),
    placeholderData: (prev) => prev,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Record<string, unknown>>({ defaultValues: buildDefaultValues(fields) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['resource', endpoint] });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => resource.create(payload as Partial<T>),
    onSuccess: () => {
      enqueueSnackbar(`${title} created successfully`, { variant: 'success' });
      invalidate();
      setDialogOpen(false);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Create failed'), { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      resource.update(id, payload as Partial<T>),
    onSuccess: () => {
      enqueueSnackbar(`${title} updated successfully`, { variant: 'success' });
      invalidate();
      setDialogOpen(false);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Update failed'), { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resource.remove(id),
    onSuccess: () => {
      enqueueSnackbar(`${title} deleted`, { variant: 'success' });
      invalidate();
      setDeleteTarget(null);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, 'Delete failed'), { variant: 'error' }),
  });

  const openCreateDialog = () => {
    setEditingRow(null);
    reset(buildDefaultValues(fields));
    setDialogOpen(true);
  };

  const openEditDialog = (row: T) => {
    setEditingRow(row);
    reset(buildDefaultValues(fields, row));
    setDialogOpen(true);
  };

  const fillFromEnquiry = async (customerIdRaw: string) => {
    const customerId = customerIdRaw.trim();
    if (!customerId) return;
    setAutoFillLoading(true);
    try {
      const enquiry = await fetchEnquiryByCustomerId(customerId);
      Object.entries(enquiryAutoFillMap).forEach(([enquiryKey, fieldName]) => {
        if (!fields.some((f) => f.name === fieldName)) return;
        const value = enquiry[enquiryKey];
        if (value === undefined || value === null || value === '') return;
        setValue(fieldName, value, { shouldDirty: true });
      });
      if (enquiry.customerId) {
        setValue('customerId', enquiry.customerId, { shouldDirty: true });
      }
      enqueueSnackbar(`Details loaded from enquiry ${String(enquiry.enquiryNumber ?? '')}`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, 'No enquiry found for this Customer ID'), { variant: 'warning' });
    } finally {
      setAutoFillLoading(false);
    }
  };

  const onSubmit = handleSubmit((values) => {
    const payload = transformSubmit ? transformSubmit(values) : values;
    const cleaned = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined)
    );
    const id = editingRow ? String((editingRow as Record<string, unknown>)[idField]) : undefined;
    if (id) {
      updateMutation.mutate({ id, payload: cleaned });
    } else {
      createMutation.mutate(cleaned);
    }
  });

  const rows = (data?.data ?? []) as T[];
  const meta = data?.meta;
  const saving = createMutation.isPending || updateMutation.isPending;

  const defaultRowActions = (row: T) => (
    <>
      {!disableEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => openEditDialog(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {!disableDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {rowActions?.(row, { edit: () => openEditDialog(row), remove: () => setDeleteTarget(row) })}
    </>
  );

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton onClick={() => invalidate()} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!disableCreate && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                {createLabel ?? `New ${title}`}
              </Button>
            )}
          </>
        }
      />

      {extraFilters}

      <DataTable<T>
        columns={columns}
        rows={rows}
        idField={idField}
        meta={meta}
        page={page}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
        loading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder={searchPlaceholder}
        rowActions={disableEdit && disableDelete && !rowActions ? undefined : defaultRowActions}
      />

      <FormDialog
        open={dialogOpen}
        title={editingRow ? `Edit ${title}` : `New ${title}`}
        onClose={() => setDialogOpen(false)}
        onSave={onSubmit}
        saving={saving || autoFillLoading}
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          {fields.map((field) => (
            <Grid size={{ xs: 12, sm: field.gridSize ?? 6 }} key={field.name}>
              <Controller
                name={field.name}
                control={control}
                rules={{ required: field.required ? `${field.label} is required` : false }}
                render={({ field: controllerField }) => {
                  if (field.type === 'boolean') {
                    return (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(controllerField.value)}
                            onChange={(e) => controllerField.onChange(e.target.checked)}
                            disabled={field.readOnly}
                          />
                        }
                        label={field.label}
                      />
                    );
                  }
                  if (field.type === 'select') {
                    return (
                      <TextField
                        {...controllerField}
                        value={controllerField.value ?? ''}
                        select
                        fullWidth
                        label={field.label}
                        disabled={field.readOnly}
                        error={Boolean(errors[field.name])}
                        helperText={(errors[field.name]?.message as string) || field.helperText}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {field.options?.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    );
                  }
                  return (
                    <TextField
                      {...controllerField}
                      value={controllerField.value ?? ''}
                      fullWidth
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      label={field.label}
                      multiline={field.type === 'textarea'}
                      minRows={field.type === 'textarea' ? 3 : undefined}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                      error={Boolean(errors[field.name])}
                      helperText={
                        (errors[field.name]?.message as string) ||
                        field.helperText ||
                        (field.autoFillFromEnquiry ? 'Tab / blur to load enquiry details' : undefined)
                      }
                      disabled={field.readOnly}
                      onBlur={(e) => {
                        controllerField.onBlur();
                        if (field.autoFillFromEnquiry) {
                          const next = String(e.target.value ?? getValues(field.name) ?? '');
                          void fillFromEnquiry(next);
                        }
                      }}
                    />
                  );
                }}
              />
            </Grid>
          ))}
        </Grid>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${title}`}
        message={`Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(String((deleteTarget as Record<string, unknown>)[idField]));
        }}
      />
    </>
  );
}

export default ResourceCrudPage;
