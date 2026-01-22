---
name: table-developer
description: Generate React table components from schema definitions with filtering, sorting, and pagination
---

# Table Developer

## Overview
Generate production-ready React table components from schema definitions. Creates type-safe tables with automatic column generation, filtering, sorting, pagination, and action buttons.

## Quick Start
To generate table components:
1. Provide the schema.json file path
2. Specify output directory
3. Choose table type (basic, advanced, or dynamic)
4. Review and customize generated code

## Generated Components

### 1. Type Definitions
**Purpose**: Type-safe interfaces for table data

**Generation Rules**:
- Required fields → Required in interface
- Optional fields → `?` modifier
- Enum → Union type
- Date → `string` (ISO format)
- Nested objects → Nested interfaces

**Example**:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  role: 'admin' | 'editor' | 'viewer';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. API Client
**Purpose**: Type-safe API calls for data fetching

**Generation Rules**:
- List → GET with pagination
- Get → GET by ID
- Create → POST
- Update → PUT
- Delete → DELETE
- Type-safe with DTOs

**Example**:
```typescript
export class UserAPI {
  private baseURL = '/api/users';

  async list(params?: { page?: number; pageSize?: number }): Promise<User[]> {
    const url = new URL(this.baseURL);
    if (params?.page) url.searchParams.set('page', params.page.toString());
    if (params?.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());

    const response = await fetch(url.toString());
    const { data } = await response.json();
    return data;
  }

  async get(id: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/${id}`);
    const { data } = await response.json();
    return data;
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseURL}/${id}`, { method: 'DELETE' });
  }
}

export const userAPI = new UserAPI();
```

### 3. Table Component
**Purpose**: Main table UI with data display and actions

**Generation Rules**:
- Auto-generated columns from schema
- Include actions (view, edit, delete)
- Loading states
- Error handling
- Refresh after mutations
- Respect `showInList` configuration

**Example**:
```typescript
import { useEffect, useState } from 'react';
import { User } from '@/types/user';
import { userAPI } from '@/lib/api/user';

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userAPI.list();
      setUsers(data);
    } catch (error) {
      setError('Failed to load users');
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await userAPI.delete(id);
      loadUsers(); // Refresh
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-table">
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Age</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.age}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleView(user.id)}>View</button>
                <button onClick={() => handleEdit(user.id)}>Edit</button>
                <button onClick={() => handleDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4. Dynamic Table Hook
**Purpose**: Generate table configuration from schema at runtime

**Generation Rules**:
- Load schema dynamically
- Generate columns from properties
- Apply `showInList` filter
- Handle different field types
- Support custom renderers

**Example**:
```typescript
import { useEffect, useState } from 'react';
import { getSchema } from '@/lib/api/schema';

export function useSchemaTable(moduleName: string) {
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTableConfig();
  }, [moduleName]);

  const loadTableConfig = async () => {
    setLoading(true);
    try {
      const schema = await getSchema(moduleName);

      // Generate columns from schema
      const tableColumns = Object.entries(schema.properties).map(([key, prop]: [string, any]) => ({
        key: key,
        title: prop.label || prop.description || key,
        dataIndex: key,
        render: (value: any) => {
          if (prop.type === 'password') return '••••••';
          if (prop.type === 'boolean') return value ? '✓' : '✗';
          if (prop.type === 'datetime') return new Date(value).toLocaleString();
          return value;
        },
        // Filter based on showInList
        showInList: prop.ui?.showInList !== false,
        // Sorting
        sortable: prop.ui?.sortable || false,
        // Filtering
        filterable: prop.ui?.filterable || false,
      })).filter(col => col.showInList);

      setColumns(tableColumns);
    } catch (error) {
      console.error('Failed to load table config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (apiEndpoint: string) => {
    try {
      const response = await fetch(apiEndpoint);
      const { data } = await response.json();
      setData(data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  return { columns, data, loading, loadData };
}
```

### 5. Advanced Table Component
**Purpose**: Full-featured table with search, filter, sort, pagination

**Features**:
- Search functionality
- Column filtering
- Sorting (ascending/descending)
- Pagination (client-side or server-side)
- Bulk actions
- Export to CSV/Excel
- Row selection

**Example**:
```typescript
import { useState, useMemo } from 'react';
import { User } from '@/types/user';
import { userAPI } from '@/lib/api/user';

export function AdvancedUserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...users];

    // Search filter
    if (search) {
      data = data.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Sorting
    if (sortField) {
      data.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Pagination
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [users, search, sortField, sortOrder, page, pageSize]);

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    const csv = [
      Object.keys(users[0]).join(','),
      ...users.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  return (
    <div className="advanced-table">
      {/* Search and Actions */}
      <div className="table-header">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={handleExport}>Export CSV</button>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('email')}>
              Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')}>
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('age')}>
              Age {sortField === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.age}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleView(user.id)}>View</button>
                <button onClick={() => handleEdit(user.id)}>Edit</button>
                <button onClick={() => handleDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}
```

## Column Generation Rules

### From Schema Properties
```typescript
// Schema
{
  "properties": {
    "email": {
      "type": "string",
      "label": "邮箱",
      "ui": { "showInList": true, "sortable": true }
    },
    "password": {
      "type": "password",
      "ui": { "showInList": false }
    }
  }
}

// Generated Columns
[
  {
    key: 'email',
    title: '邮箱',
    dataIndex: 'email',
    showInList: true,
    sortable: true,
    render: (value) => value
  }
  // password is excluded (showInList: false)
]
```

### Field Type Handling
```typescript
const typeRenderers = {
  'password': () => '••••••',
  'boolean': (value) => value ? '✓' : '✗',
  'datetime': (value) => new Date(value).toLocaleString(),
  'date': (value) => new Date(value).toLocaleDateString(),
  'enum': (value, prop) => prop.ui?.options?.find(o => o.value === value)?.label || value,
  'media': (value, prop) => prop.allowedTypes?.includes('image') ?
    `<img src="${value}" />` : `<a href="${value}">Download</a>`
};
```

### Visibility Control
```typescript
// Respect schema UI configuration
const visibleColumns = columns.filter(col => {
  const prop = schema.properties[col.key];
  return prop.ui?.showInList !== false;
});
```

## Usage Examples

### Generate Basic Table
```bash
# Generate table component
python scripts/generate_table.py schema.json --output ./frontend/components

# Output:
# - components/UserTable.tsx
# - types/user.ts
# - lib/api/user.ts
```

### Generate Advanced Table
```bash
# With search, filter, sort
python scripts/generate_table.py schema.json \
  --output ./frontend/components \
  --advanced \
  --include-search \
  --include-sort \
  --include-export
```

### Generate Dynamic Table
```bash
# Dynamic configuration from schema
python scripts/generate_table.py schema.json \
  --output ./frontend/hooks \
  --dynamic
```

### Generate with UI Library
```bash
# With shadcn/ui components
python scripts/generate_table.py schema.json \
  --output ./frontend/components \
  --ui shadcn

# With Ant Design
python scripts/generate_table.py schema.json \
  --output ./frontend/components \
  --ui antd
```

## UI Library Integration

### shadcn/ui
```typescript
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

export function UserTable() {
  const columns: ColumnDef<User>[] = [
    { accessorKey: "email", header: "Email" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "age", header: "Age" },
    { accessorKey: "role", header: "Role" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button onClick={() => handleView(row.original.id)}>View</Button>
          <Button onClick={() => handleEdit(row.original.id)}>Edit</Button>
          <Button variant="destructive" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return <DataTable columns={columns} data={users} />;
}
```

### Ant Design
```typescript
import { Table, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export function UserTable() {
  const columns: ColumnsType<User> = [
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Age', dataIndex: 'age', key: 'age', sorter: true },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleView(record.id)}>View</Button>
          <Button onClick={() => handleEdit(record.id)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      )
    }
  ];

  return <Table columns={columns} dataSource={users} rowKey="id" />;
}
```

### Material-UI
```typescript
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export function UserTable() {
  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'age', headerName: 'Age', width: 100 },
    { field: 'role', headerName: 'Role', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div>
          <button onClick={() => handleView(params.row.id)}>View</button>
          <button onClick={() => handleEdit(params.row.id)}>Edit</button>
          <button onClick={() => handleDelete(params.row.id)}>Delete</button>
        </div>
      )
    }
  ];

  return (
    <DataGrid
      rows={users}
      columns={columns}
      pageSize={20}
      rowsPerPageOptions={[20]}
    />
  );
}
```

## Feature Options

### Search
```bash
python scripts/generate_table.py schema.json --include-search
```

Generates:
```typescript
const [search, setSearch] = useState('');

const filteredData = useMemo(() => {
  if (!search) return data;
  return data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );
}, [data, search]);
```

### Sorting
```bash
python scripts/generate_table.py schema.json --include-sort
```

Generates:
```typescript
const [sortField, setSortField] = useState<keyof User | null>(null);
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

const sortedData = useMemo(() => {
  if (!sortField) return data;
  return [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}, [data, sortField, sortOrder]);
```

### Pagination
```bash
python scripts/generate_table.py schema.json --include-pagination
```

Generates:
```typescript
const [page, setPage] = useState(1);
const [pageSize] = useState(20);

const paginatedData = useMemo(() => {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}, [data, page, pageSize]);
```

### Export
```bash
python scripts/generate_table.py schema.json --include-export
```

Generates:
```typescript
const handleExport = () => {
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  a.click();
};
```

### Bulk Actions
```bash
python scripts/generate_table.py schema.json --include-bulk
```

Generates:
```typescript
const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

const handleBulkDelete = async () => {
  if (!confirm(`Delete ${selectedRowKeys.length} items?`)) return;

  for (const id of selectedRowKeys) {
    await userAPI.delete(id);
  }

  setSelectedRowKeys([]);
  loadData();
};
```

## Column Configuration

### From Schema UI
```typescript
// Schema
{
  "email": {
    "type": "string",
    "label": "邮箱",
    "ui": {
      "sortable": true,
      "filterable": true,
      "showInList": true,
      "span": 12
    }
  }
}

// Generated Column Config
{
  key: 'email',
  title: '邮箱',
  dataIndex: 'email',
  sortable: true,
  filterable: true,
  showInList: true,
  span: 12
}
```

### Custom Renderers
```typescript
// Password field
render: () => '••••••'

// Boolean field
render: (value) => value ? '✓' : '✗'

// Date field
render: (value) => new Date(value).toLocaleDateString()

// Enum field
render: (value, prop) => {
  const option = prop.ui?.options?.find(o => o.value === value);
  return option?.label || value;
}

// Media field
render: (value, prop) => {
  if (prop.allowedTypes?.includes('image')) {
    return `<img src="${value}" alt="image" />`;
  }
  return `<a href="${value}">Download</a>`;
}
```

## Dynamic Table

### Runtime Schema Loading
```typescript
export function DynamicTable({ moduleName }: { moduleName: string }) {
  const { columns, data, loading, loadData } = useSchemaTable(moduleName);

  if (loading) return <div>Loading schema...</div>;

  return (
    <div>
      <button onClick={() => loadData(`/api/${moduleName}`)}>Load Data</button>
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.title}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], col) : row[col.key]}
                </td>
              ))}
              <td>
                <button onClick={() => handleView(row.id)}>View</button>
                <button onClick={() => handleEdit(row.id)}>Edit</button>
                <button onClick={() => handleDelete(row.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Usage
```typescript
<DynamicTable moduleName="user" />
<DynamicTable moduleName="article" />
<DynamicTable moduleName="product" />
```

## Error Handling

### Loading Errors
```typescript
const [error, setError] = useState<string | null>(null);

const loadUsers = async () => {
  setError(null);
  try {
    const data = await userAPI.list();
    setUsers(data);
  } catch (error) {
    setError('Failed to load data');
    console.error(error);
  }
};

if (error) return <div className="error-banner">{error}</div>;
```

### Empty State
```typescript
if (users.length === 0) {
  return (
    <div className="empty-state">
      <p>No data available</p>
      <button onClick={() => navigate('/create')}>Create First Item</button>
    </div>
  );
}
```

### Loading State
```typescript
if (loading) {
  return (
    <div className="loading-state">
      <Spinner />
      <p>Loading data...</p>
    </div>
  );
}
```

## Styling Patterns

### CSS Classes
```css
.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.user-table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.user-table tr:hover {
  background: #fafafa;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.loading-state, .error-state, .empty-state {
  padding: 40px;
  text-align: center;
}
```

### Tailwind CSS
```typescript
return (
  <div className="w-full">
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="Search..."
        className="flex-1 px-4 py-2 border rounded"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <button className="px-4 py-2 bg-blue-500 text-white rounded">
        Export
      </button>
    </div>

    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{row.email}</td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3 flex gap-2">
                <button className="text-blue-600">View</button>
                <button className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
```

## Performance Optimization

### Virtual Scrolling
```typescript
import { FixedSizeList as List } from 'react-window';

export function VirtualizedTable({ data }: { data: User[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="flex border-b">
      <div className="w-1/4 p-2">{data[index].email}</div>
      <div className="w-1/4 p-2">{data[index].name}</div>
      <div className="w-1/4 p-2">{data[index].age}</div>
      <div className="w-1/4 p-2">{data[index].role}</div>
    </div>
  );

  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Memoization
```typescript
const TableBody = React.memo(({ data, columns }: { data: User[]; columns: any[] }) => {
  return (
    <tbody>
      {data.map(row => (
        <tr key={row.id}>
          {columns.map(col => (
            <td key={col.key}>
              {col.render ? col.render(row[col.key]) : row[col.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
});
```

## Resources

### Scripts
- `scripts/generate_table.py` - Main generation script
- `scripts/generate_dynamic_table.py` - Dynamic table generator
- `scripts/validate_schema.py` - Schema validation

### References
- `references/column-types.md` - Column type mappings
- `references/ui-libraries.md` - UI library integration
- `references/performance.md` - Performance optimization
- `references/patterns.md` - Common table patterns

### Assets
- `assets/templates/` - Component templates
- `assets/examples/` - Complete examples
- `assets/hooks/` - Reusable hooks

## Best Practices

### Before Generation
1. ✅ Validate schema
2. ✅ Configure `showInList` in schema
3. ✅ Set appropriate labels
4. ✅ Define sortable/filterable fields

### After Generation
1. ✅ Review column configuration
2. ✅ Test sorting and filtering
3. ✅ Add error boundaries
4. ✅ Optimize performance

### Code Quality
- ✅ Type safety
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design
- ✅ Accessibility

## Integration

### With Backend
```bash
# Generate backend first
python ../backend-developer/scripts/generate_go.py schema.json --output ./backend

# Then generate frontend
python scripts/generate_table.py schema.json --output ./frontend
```

### With Form
```bash
# Generate table for list view
python scripts/generate_table.py schema.json --output ./frontend/components

# Generate form for create/edit
python ../form-developer/scripts/generate_form.py schema.json --output ./frontend/components
```

### With Schema Validator
```bash
# Validate first
python ../schema-validator/scripts/validate_schema.py schema.json

# Then generate
python scripts/generate_table.py schema.json --output ./frontend
```

## Common Patterns

### CRUD Table
```typescript
export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await userAPI.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => navigate('/users/create');
  const handleEdit = (id: string) => navigate(`/users/${id}/edit`);
  const handleDelete = async (id: string) => {
    if (confirm('Delete?')) {
      await userAPI.delete(id);
      load();
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>Create</button>
      <UserTable data={users} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
```

### Searchable Table
```typescript
export function SearchableTable() {
  const [data, setData] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    const result = data.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
    setFiltered(result);
  }, [data, search]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <UserTable data={filtered} />
    </div>
  );
}
```

### Sortable Table
```typescript
export function SortableTable() {
  const [data, setData] = useState<User[]>([]);
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div>
      <thead>
        <tr>
          <th onClick={() => handleSort('email')}>Email</th>
          <th onClick={() => handleSort('name')}>Name</th>
        </tr>
      </thead>
      <UserTable data={sorted} />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

**Columns not showing**
- Check `showInList` in schema
- Verify property names match

**Sorting not working**
- Ensure field types are comparable
- Check `sortable` flag in schema

**API errors**
- Verify endpoint URLs
- Check CORS settings
- Ensure response format matches

**Type errors**
- Run TypeScript compiler
- Check generated type definitions
- Verify imports

## Related Skills
- `form-developer` - Generate form components
- `backend-developer` - Generate backend code
- `schema-validator` - Validate schemas before generation