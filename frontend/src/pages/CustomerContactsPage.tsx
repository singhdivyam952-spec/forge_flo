import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createResource, type ListParams } from '../api/resources';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';

const customersApi = createResource<Record<string, unknown>>('/customers');

export function CustomerContactsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const params: ListParams = { page: page + 1, limit: rowsPerPage, search };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customer-contacts', params],
    queryFn: () => customersApi.list(params),
    placeholderData: (prev) => prev,
  });

  const rows = useMemo(
    () =>
      ((data?.data ?? []) as Record<string, unknown>[]).flatMap((customer) =>
        (((customer.contacts as Record<string, unknown>[] | undefined) ?? []).map((contact) => ({
          _id: `${String(customer._id)}-${String(contact.email ?? contact.phone ?? contact.name)}`,
          customerCode: customer.code,
          customerName: customer.name,
          name: contact.name,
          department: contact.department,
          designation: contact.designation,
          phone: contact.phone,
          email: contact.email,
          isPrimary: contact.isPrimary,
        })))
      ),
    [data]
  );

  return (
    <>
      <PageHeader title="Customer Contacts" subtitle="Unified marketing contact view across all customers" />
      <DataTable
        columns={[
          { id: 'customerCode', label: 'Customer Code' },
          { id: 'customerName', label: 'Customer Name' },
          { id: 'name', label: 'Contact' },
          { id: 'department', label: 'Department' },
          { id: 'designation', label: 'Designation' },
          { id: 'phone', label: 'Phone' },
          { id: 'email', label: 'Email' },
          { id: 'isPrimary', label: 'Primary', render: (row) => ((row.isPrimary as boolean) ? 'Yes' : 'No') },
        ]}
        rows={rows}
        page={page}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
        loading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No customer contacts found"
      />
    </>
  );
}

export default CustomerContactsPage;
