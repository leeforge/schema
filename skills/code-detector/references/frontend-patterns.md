# Frontend Code Patterns

## Common Issues and Fixes

### 1. Zod Schema Validation

#### ❌ Wrong
```typescript
const schema = z.object({
  email: z.string(),
  password: z.string(),
});
```

#### ✅ Correct
```typescript
const schema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(6).max(72),
  name: z.string().max(50),
  age: z.number().int().min(0).max(150),
  role: z.enum(["admin", "editor", "viewer"]),
});
```

### 2. Form Error Handling

#### ❌ Wrong
```typescript
const { register, handleSubmit } = useForm();

const onSubmit = async (data) => {
  await api.user.create(data);
};
```

#### ✅ Correct
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

const onSubmit = async (data) => {
  try {
    await api.user.create(data);
    toast.success("User created");
  } catch (error) {
    toast.error(error.message);
  }
};

// In JSX
<Controller
  name="email"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <div>
      <Input {...field} />
      {error && <span className="text-red-500">{error.message}</span>}
    </div>
  )}
/>
```

### 3. Loading States

#### ❌ Wrong
```typescript
export function UserTable() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.user.list().then(setUsers);
  }, []);

  return <Table data={users} />;
}
```

#### ✅ Correct
```typescript
export function UserTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.user.list()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (users.length === 0) return <EmptyState message="No users found" />;

  return <Table data={users} />;
}
```

### 4. API Error Handling

#### ❌ Wrong
```typescript
export async function create(data: CreateUser) {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}
```

#### ✅ Correct
```typescript
export async function create(data: CreateUser): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }

  return response.json();
}
```

### 5. Table Column Definitions

#### ❌ Wrong
```typescript
export function UserTable({ data }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {data.map(user => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>{user.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### ✅ Correct
```typescript
interface UserTableProps {
  data: User[];
  loading?: boolean;
  onSort?: (field: keyof User) => void;
  onSearch?: (query: string) => void;
}

export function UserTable({ data, loading, onSort, onSearch }: UserTableProps) {
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof User) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field);
  };

  if (loading) return <Spinner />;
  if (data.length === 0) return <EmptyState message="No users found" />;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users..."
        onChange={(e) => onSearch?.(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('email')}>
              Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('name')}>
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                <Button onClick={() => handleEdit(user)}>Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  );
}
```

### 6. Dynamic Form Fields

#### ❌ Wrong
```typescript
export function UserForm({ user }: { user?: User }) {
  const { register, handleSubmit } = useForm({
    defaultValues: user,
  });

  return (
    <form>
      <input {...register("email")} />
      <input {...register("password")} />
      <input {...register("name")} />
    </form>
  );
}
```

#### ✅ Correct
```typescript
export function UserForm({ user, onSubmit }: { user?: User; onSubmit: (data: CreateUser) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateUser>({
    resolver: zodResolver(createUserSchema),
    defaultValues: user,
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label>Email</label>
        <Input
          type="email"
          {...register("email")}
          disabled={isSubmitting}
        />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </div>

      {!user && (
        <div>
          <label>Password</label>
          <Input
            type="password"
            {...register("password")}
            disabled={isSubmitting}
          />
          {errors.password && <span className="text-red-500">{errors.password.message}</span>}
        </div>
      )}

      <div>
        <label>Name</label>
        <Input
          {...register("name")}
          disabled={isSubmitting}
        />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : user ? 'Update' : 'Create'}
      </Button>
    </form>
  );
}
```

### 7. File Upload

#### ✅ Correct
```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export function FileUpload({ onFileSelect, accept }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <Input type="file" onChange={handleFileChange} accept={accept} />
      {preview && <img src={preview} alt="Preview" className="mt-2 max-w-xs" />}
    </div>
  );
}
```

### 8. Relationship Fields (Many-to-Many)

#### ✅ Correct
```typescript
interface CategorySelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.category.list()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(catId => catId !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => (
        <Badge
          key={cat.id}
          variant={selected.includes(cat.id) ? 'default' : 'outline'}
          onClick={() => toggleCategory(cat.id)}
          className="cursor-pointer"
        >
          {cat.name}
        </Badge>
      ))}
    </div>
  );
}
```

### 9. Search and Filter

#### ✅ Correct
```typescript
export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !search ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.name.toLowerCase().includes(search.toLowerCase());

      const matchesRole = !role || user.role === role;

      return matchesSearch && matchesRole;
    });
  }, [users, search, role]);

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={role || ''} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <UserTable data={filteredUsers} />
    </div>
  );
}
```

### 10. Export Functionality

#### ✅ Correct
```typescript
export function UserExport({ data }: { data: User[] }) {
  const handleExport = () => {
    const csv = [
      ['ID', 'Email', 'Name', 'Role'],
      ...data.map(user => [user.id, user.email, user.name, user.role])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
```

## Type Mapping

| Schema Type | TypeScript | Zod Validation | Component |
|-------------|------------|----------------|-----------|
| `string` | `string` | `z.string()` | `Input` |
| `string` + email | `string` | `z.string().email()` | `Input type="email"` |
| `integer` | `number` | `z.number().int()` | `Input type="number"` |
| `number` | `number` | `z.number()` | `Input type="number"` |
| `boolean` | `boolean` | `z.boolean()` | `Checkbox` |
| `enum` | `string` | `z.enum([...])` | `Select` |
| `password` | `string` | `z.string().min(6)` | `Input type="password"` |
| `datetime` | `Date` | `z.date()` | `DatePicker` |
| `json` | `any` | `z.any()` | `Textarea` |

## Best Practices Checklist

- [ ] Zod schema matches entity schema
- [ ] All required fields have validation
- [ ] Forms display error messages
- [ ] Loading states are shown
- [ ] Empty states are handled
- [ ] API calls have error handling
- [ ] Tables have pagination
- [ ] Tables support sorting
- [ ] Tables support search/filter
- [ ] File uploads have validation
- [ ] Relationship fields use multi-select
- [ ] Export functionality is available
- [ ] Type safety is maintained
- [ ] Components are reusable
