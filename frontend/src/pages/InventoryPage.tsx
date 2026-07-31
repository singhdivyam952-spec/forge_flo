import { useState, type SyntheticEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

import { inventoryApi, type ListParams } from '../api/resources';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import dayjs from 'dayjs';

function refCell(value: unknown, primary = 'code', secondary?: string): string {
  if (!value) return '—';
  const obj = value as Record<string, unknown>;
  if (secondary && obj[secondary]) return `${obj[primary] ?? ''} — ${obj[secondary]}`;
  return String(obj[primary] ?? '—');
}

function BalancesTab() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const listParams: ListParams = { page: page + 1, limit: rowsPerPage };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['inventory-balances', listParams],
    queryFn: () => inventoryApi.balances(listParams),
    placeholderData: (prev) => prev,
  });

  return (
    <DataTable
      columns={[
        { id: 'material', label: 'Material', render: (row) => refCell(row.material, 'code', 'name') },
        { id: 'warehouse', label: 'Warehouse', render: (row) => refCell(row.warehouse, 'code', 'name') },
        { id: 'batchNumber', label: 'Batch' },
        { id: 'heatNumber', label: 'Heat' },
        { id: 'lotNumber', label: 'Lot' },
        { id: 'rack', label: 'Rack' },
        { id: 'qty', label: 'Qty', align: 'right' },
        { id: 'reservedQty', label: 'Reserved', align: 'right' },
        { id: 'unitCost', label: 'Unit Cost', align: 'right' },
        { id: 'totalValue', label: 'Total Value', align: 'right' },
      ]}
      rows={(data?.data ?? []) as Record<string, unknown>[]}
      meta={data?.meta}
      page={page}
      onPageChange={setPage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(n) => {
        setRowsPerPage(n);
        setPage(0);
      }}
      loading={isLoading || isFetching}
      emptyMessage="No stock balances found"
    />
  );
}

function LedgerTab() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const listParams: ListParams = { page: page + 1, limit: rowsPerPage };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['inventory-ledger', listParams],
    queryFn: () => inventoryApi.ledger(listParams),
    placeholderData: (prev) => prev,
  });

  return (
    <DataTable
      columns={[
        { id: 'transactionDate', label: 'Date', render: (row) => dayjs(row.transactionDate as string).format('DD-MMM-YYYY HH:mm') },
        { id: 'voucherType', label: 'Voucher Type' },
        { id: 'voucherNumber', label: 'Voucher No.' },
        { id: 'material', label: 'Material', render: (row) => refCell(row.material, 'code', 'name') },
        { id: 'warehouse', label: 'Warehouse', render: (row) => refCell(row.warehouse, 'code') },
        { id: 'txnType', label: 'Type' },
        { id: 'qtyIn', label: 'Qty In', align: 'right' },
        { id: 'qtyOut', label: 'Qty Out', align: 'right' },
        { id: 'balanceQty', label: 'Balance', align: 'right' },
      ]}
      rows={(data?.data ?? []) as Record<string, unknown>[]}
      meta={data?.meta}
      page={page}
      onPageChange={setPage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(n) => {
        setRowsPerPage(n);
        setPage(0);
      }}
      loading={isLoading || isFetching}
      emptyMessage="No ledger entries found"
    />
  );
}

export function InventoryPage() {
  const [tab, setTab] = useState(0);

  const handleChange = (_e: SyntheticEvent, value: number) => setTab(value);

  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock balances and movement ledger across all warehouses" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={handleChange}>
          <Tab label="Stock Balances" />
          <Tab label="Stock Ledger" />
        </Tabs>
      </Box>

      {tab === 0 ? <BalancesTab /> : <LedgerTab />}
    </>
  );
}

export default InventoryPage;
