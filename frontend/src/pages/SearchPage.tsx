import { useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';

import { globalSearch } from '../api/resources';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { StatusChip } from '../components/common/StatusChip';

interface ResultSection {
  key: string;
  title: string;
  items: Record<string, unknown>[];
  renderPrimary: (item: Record<string, unknown>) => string;
  renderSecondary?: (item: Record<string, unknown>) => string;
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', q],
    queryFn: () => globalSearch(q),
    enabled: q.trim().length > 0,
  });

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const sections: ResultSection[] = data
    ? [
        {
          key: 'materials',
          title: 'Materials',
          items: data.materials,
          renderPrimary: (i) => `${i.code} — ${i.name}`,
          renderSecondary: (i) => String(i.type ?? ''),
        },
        {
          key: 'customers',
          title: 'Customers',
          items: data.customers,
          renderPrimary: (i) => `${i.code} — ${i.name}`,
        },
        {
          key: 'suppliers',
          title: 'Suppliers',
          items: data.suppliers,
          renderPrimary: (i) => `${i.code} — ${i.name}`,
        },
        {
          key: 'productionOrders',
          title: 'Production Orders',
          items: data.productionOrders,
          renderPrimary: (i) => String(i.orderNumber),
          renderSecondary: (i) => `Qty ${i.qty} / Completed ${i.qtyCompleted}`,
        },
        {
          key: 'drawings',
          title: 'Drawings',
          items: data.drawings,
          renderPrimary: (i) => `${i.drawingNumber} — ${i.title}`,
          renderSecondary: (i) => `Rev. ${i.revision ?? '—'}`,
        },
        {
          key: 'salesOrders',
          title: 'Sales Orders',
          items: data.salesOrders,
          renderPrimary: (i) => String(i.soNumber ?? '—'),
          renderSecondary: (i) => `PO ${i.poReferenceNumber ?? '—'} | ₹${i.totalAmount ?? 0}`,
        },
      ]
    : [];

  const totalResults = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <>
      <PageHeader title="Search" subtitle="Search across materials, orders, customers, and documents" />

      <TextField
        fullWidth
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleSearch}
        placeholder="Type a query and press Enter…"
        sx={{ mb: 3, maxWidth: 480 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {!q && (
        <Typography variant="body2" color="text.secondary">
          Enter a search term to find materials, customers, suppliers, production orders, drawings, and sales orders.
        </Typography>
      )}

      {q && isLoading && <LoadingScreen fullHeight={false} label="Searching…" />}

      {q && !isLoading && data && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {totalResults} result(s) for "{q}"
          </Typography>
          <Grid container spacing={2}>
            {sections
              .filter((s) => s.items.length > 0)
              .map((section) => (
                <Grid key={section.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper variant="outlined" sx={{ height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2, pt: 1.5 }}>
                      {section.title} ({section.items.length})
                    </Typography>
                    <Divider sx={{ mt: 1 }} />
                    <List dense>
                      {section.items.map((item, idx) => (
                        <ListItem key={idx} divider={idx < section.items.length - 1}>
                          <ListItemText
                            primary={section.renderPrimary(item)}
                            secondary={section.renderSecondary?.(item)}
                          />
                          {typeof item.status === 'string' && <StatusChip status={item.status} />}
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              ))}
            {totalResults === 0 && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary">
                  No results found for "{q}".
                </Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </>
  );
}

export default SearchPage;
