---
name: form-developer
description: Generate React form components from schema definitions with validation and dynamic fields
---

# Form Developer

## Overview
Generate production-ready React form components from schema definitions. Creates type-safe forms with automatic field generation, validation using Zod, and dynamic field rendering.

## Quick Start
To generate form components:
1. Provide the schema.json file path
2. Specify output directory
3. Choose form type (create, update, or dynamic)
4. Review and customize generated code

## Generated Components

### 1. Type Definitions
**Purpose**: Type-safe interfaces for form data

**Generation Rules**:
- Required fields → Required in interface
- Optional fields → `?` modifier
- Enum → Union type
- Date → `string` (ISO format)
- Nested objects → Nested interfaces

**Example**:
```typescript
export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  age: number;
  role: 'admin' | 'editor' | 'viewer';
  phone?: string;
}

export interface UpdateUserDTO {
  name?: string;
  age?: number;
  role?: 'admin' | 'editor' | 'viewer';
  phone?: string;
}
```

### 2. Zod Validation Schema
**Purpose**: Runtime validation and type inference

**Generation Rules**:
- `required: true` → `.nonempty()`
- `minLength: 6` → `.min(6)` (strings/arrays)
- `min: 0` → `.min(0)` (numbers)
- `format: email` → `.email()`
- `enum: ["a", "b"]` → `.enum(["a", "b"])`
- `maxLength: 100` → `.max(100)` (strings/arrays)
- `max: 150` → `.max(150)` (numbers)
- `pattern` → `.regex(pattern)`

**Example**:
```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email').max(100, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().max(50, 'Name too long'),
  age: z.number().min(0).max(150),
  role: z.enum(['admin', 'editor', 'viewer']),
  phone: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
```

### 3. Form Component
**Purpose**: Main form UI with validation and submission

**Generation Rules**:
- React Hook Form integration
- Zod resolver for validation
- Error messages from schema
- Appropriate input types
- Default values from schema
- Required fields marked

**Example**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userAPI } from '@/lib/api/user';
import { CreateUserDTO } from '@/types/user';

const schema = z.object({
  email: z.string().email('Invalid email').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().max(50, 'Name too long'),
  age: z.number().min(0).max(150),
  role: z.enum(['admin', 'editor', 'viewer']),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface UserFormProps {
  onSuccess?: () => void;
  initialData?: Partial<FormData>;
}

export function UserForm({ onSuccess, initialData }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'viewer',
      age: 0,
      ...initialData,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (initialData) {
        // Update mode
        await userAPI.update(initialData.id as string, data);
      } else {
        // Create mode
        await userAPI.create(data as CreateUserDTO);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="user-form">
      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          {...register('email')}
          placeholder="user@example.com"
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      {!initialData && (
        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>
      )}

      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          {...register('name')}
          placeholder="John Doe"
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="form-group">
        <label>Age</label>
        <input
          type="number"
          {...register('age', { valueAsNumber: true })}
          placeholder="0-150"
        />
        {errors.age && <span className="error">{errors.age.message}</span>}
      </div>

      <div className="form-group">
        <label>Role *</label>
        <select {...register('role')}>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        {errors.role && <span className="error">{errors.role.message}</span>}
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input
          type="tel"
          {...register('phone')}
          placeholder="13800138000"
        />
        {errors.phone && <span className="error">{errors.phone.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : initialData ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
```

### 4. Dynamic Form Hook
**Purpose**: Generate form configuration from schema at runtime

**Generation Rules**:
- Load schema dynamically
- Generate fields from properties
- Apply validation rules
- Handle different field types
- Support custom widgets

**Example**:
```typescript
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSchema, getZodSchema } from '@/lib/api/schema';

export function useSchemaForm<T extends Record<string, any>>(moduleName: string) {
  const [schema, setSchema] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<T>({
    resolver: async (data, context, options) => {
      if (!schema) {
        return { values: data, errors: {} };
      }
      const zodSchema = await getZodSchema(moduleName);
      return zodResolver(zodSchema)(data, context, options);
    },
  });

  useEffect(() => {
    loadSchema();
  }, [moduleName]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const loadedSchema = await getSchema(moduleName);
      setSchema(loadedSchema);

      const formFields = Object.entries(loadedSchema.properties).map(([key, prop]: [string, any]) => ({
        name: key,
        label: prop.label || prop.description || key,
        type: prop.type,
        required: prop.validate?.required || false,
        placeholder: prop.ui?.placeholder || prop.label || key,
        validate: prop.validate,
        ui: prop.ui,
        options: prop.ui?.options,
        widget: prop.ui?.widget,
      }));

      setFields(formFields);
    } catch (error) {
      console.error('Failed to load schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: T) => {
    // Implementation depends on your API
    console.log('Form data:', data);
  };

  return { form, schema, fields, loading, onSubmit };
}
```

### 5. Dynamic Form Component
**Purpose**: Render form fields dynamically from schema

**Example**:
```typescript
import { useSchemaForm } from '@/hooks/useSchemaForm';
import { userAPI } from '@/lib/api/user';

interface DynamicFormProps {
  moduleName: string;
  onSuccess?: () => void;
  initialData?: any;
}

export function DynamicForm({ moduleName, onSuccess, initialData }: DynamicFormProps) {
  const { form, fields, loading, onSubmit } = useSchemaForm(moduleName);

  if (loading) return <div>Loading form...</div>;

  const handleSubmit = async (data: any) => {
    try {
      if (initialData) {
        await userAPI.update(initialData.id, data);
      } else {
        await userAPI.create(data);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="dynamic-form">
      {fields.map(field => (
        <div key={field.name} className="form-group">
          <label>
            {field.label}
            {field.required && ' *'}
          </label>

          {/* Render appropriate input based on type */}
          {field.widget === 'textarea' ? (
            <textarea
              {...form.register(field.name)}
              placeholder={field.placeholder}
              rows={field.ui?.rows || 4}
            />
          ) : field.type === 'enum' || field.widget === 'select' ? (
            <select {...form.register(field.name)}>
              <option value="">Select {field.label}</option>
              {field.options?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'boolean' || field.widget === 'switch' ? (
            <input
              type="checkbox"
              {...form.register(field.name)}
            />
          ) : field.type === 'datetime' ? (
            <input
              type="datetime-local"
              {...form.register(field.name)}
            />
          ) : field.type === 'date' ? (
            <input
              type="date"
              {...form.register(field.name)}
            />
          ) : field.type === 'number' ? (
            <input
              type="number"
              {...form.register(field.name, { valueAsNumber: true })}
              placeholder={field.placeholder}
              step={field.ui?.step}
            />
          ) : field.type === 'password' ? (
            <input
              type="password"
              {...form.register(field.name)}
              placeholder={field.placeholder}
            />
          ) : (
            <input
              type="text"
              {...form.register(field.name)}
              placeholder={field.placeholder}
            />
          )}

          {form.formState.errors[field.name] && (
            <span className="error">
              {form.formState.errors[field.name]?.message as string}
            </span>
          )}
        </div>
      ))}

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Field Type Mapping

### Basic Input Types
```typescript
// string → text input
<input type="text" {...register(field.name)} />

// text → textarea
<textarea {...register(field.name)} rows={field.ui?.rows || 4} />

// password → password input
<input type="password" {...register(field.name)} />

// email → email input
<input type="email" {...register(field.name)} />

// number → number input
<input type="number" {...register(field.name, { valueAsNumber: true })} />

// integer → number input (step=1)
<input type="number" step="1" {...register(field.name, { valueAsNumber: true })} />

// boolean → checkbox
<input type="checkbox" {...register(field.name)} />
```

### Date/Time Types
```typescript
// datetime → datetime-local
<input type="datetime-local" {...register(field.name)} />

// date → date
<input type="date" {...register(field.name)} />

// time → time
<input type="time" {...register(field.name)} />
```

### Selection Types
```typescript
// enum → select
<select {...register(field.name)}>
  {field.options?.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>

// enum with radio
{field.options?.map(opt => (
  <label key={opt.value}>
    <input
      type="radio"
      {...register(field.name)}
      value={opt.value}
    />
    {opt.label}
  </label>
))}

// enum with checkbox (multiple)
{field.options?.map(opt => (
  <label key={opt.value}>
    <input
      type="checkbox"
      value={opt.value}
      onChange={(e) => {
        const current = watch(field.name) || [];
        if (e.target.checked) {
          setValue(field.name, [...current, opt.value]);
        } else {
          setValue(field.name, current.filter(v => v !== opt.value));
        }
      }}
    />
    {opt.label}
  </label>
))}
```

### Complex Types
```typescript
// media → file upload
<input type="file" onChange={handleFileUpload} />

// array → dynamic list
{fields.map((item, index) => (
  <div key={index}>
    <input {...register(`items.${index}`)} />
    <button type="button" onClick={() => remove(index)}>Remove</button>
  </div>
))}
<button type="button" onClick={() => append('')}>Add Item</button>

// object → nested form
<div className="nested-form">
  <input {...register('address.street')} />
  <input {...register('address.city')} />
</div>
```

## Validation Rules

### Zod Schema Generation
```typescript
// Required
z.string().nonempty()

// Min/Max length (strings)
z.string().min(6).max(50)

// Min/Max value (numbers)
z.number().min(0).max(150)

// Email
z.string().email()

// URL
z.string().url()

// Pattern
z.string().regex(/^[0-9]+$/)

// Enum
z.enum(['admin', 'editor', 'viewer'])

// Optional
z.string().optional()

// Nullable
z.string().nullable()

// Custom error message
z.string().min(6, { message: 'Password must be at least 6 characters' })
```

### From Schema Validation
```typescript
// Schema
{
  "email": {
    "type": "string",
    "validate": {
      "required": true,
      "format": "email",
      "maxLength": 100
    }
  },
  "password": {
    "type": "password",
    "validate": {
      "required": true,
      "minLength": 6,
      "maxLength": 72
    }
  },
  "age": {
    "type": "integer",
    "validate": {
      "min": 0,
      "max": 150
    }
  }
}

// Generated Zod
z.object({
  email: z.string().email().max(100).nonempty(),
  password: z.string().min(6).max(72).nonempty(),
  age: z.number().int().min(0).max(150),
})
```

## UI Configuration

### From Schema UI
```typescript
// Schema
{
  "email": {
    "type": "string",
    "label": "邮箱",
    "ui": {
      "widget": "email",
      "placeholder": "user@example.com",
      "span": 12,
      "size": "md"
    }
  },
  "bio": {
    "type": "text",
    "ui": {
      "widget": "textarea",
      "rows": 6,
      "placeholder": "Enter your bio..."
    }
  }
}

// Generated Component
<div className="form-group" style={{ gridColumn: 'span 12' }}>
  <label>邮箱</label>
  <input
    type="email"
    {...register('email')}
    placeholder="user@example.com"
    className="size-md"
  />
</div>

<div className="form-group">
  <label>Bio</label>
  <textarea
    {...register('bio')}
    rows={6}
    placeholder="Enter your bio..."
  />
</div>
```

### Widget Mapping
```typescript
const widgetMap = {
  'text': 'input[type="text"]',
  'textarea': 'textarea',
  'password': 'input[type="password"]',
  'email': 'input[type="email"]',
  'number': 'input[type="number"]',
  'decimal': 'input[type="number"] step="0.01"',
  'select': 'select',
  'radio': 'input[type="radio"]',
  'checkbox': 'input[type="checkbox"]',
  'switch': 'input[type="checkbox"]',
  'date': 'input[type="date"]',
  'datetime': 'input[type="datetime-local"]',
  'file': 'input[type="file"]',
  'image': 'input[type="file"] accept="image/*"',
  'video': 'input[type="file"] accept="video/*"',
  'audio': 'input[type="file"] accept="audio/*"',
};
```

## Usage Examples

### Generate Create Form
```bash
# Generate create form
python scripts/generate_form.py schema.json --output ./frontend/components --type create

# Output:
# - components/UserForm.tsx
# - types/user.ts
# - lib/api/user.ts
```

### Generate Update Form
```bash
# Generate update form with initial data
python scripts/generate_form.py schema.json --output ./frontend/components --type update

# Output includes:
# - Prefilled form with initialData
# - Update API call
```

### Generate Dynamic Form
```bash
# Generate dynamic form
python scripts/generate_form.py schema.json --output ./frontend/hooks --dynamic

# Output:
# - hooks/useSchemaForm.ts
# - Dynamic form component
```

### Generate with UI Library
```bash
# With shadcn/ui
python scripts/generate_form.py schema.json \
  --output ./frontend/components \
  --ui shadcn

# With Ant Design
python scripts/generate_form.py schema.json \
  --output ./frontend/components \
  --ui antd
```

### Generate with Custom Layout
```bash
# With 2-column layout
python scripts/generate_form.py schema.json \
  --output ./frontend/components \
  --layout 2-column

# With compact size
python scripts/generate_form.py schema.json \
  --output ./frontend/components \
  --size sm
```

## UI Library Integration

### shadcn/ui
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export function UserForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Ant Design
```typescript
import { Form, Input, Select, Button } from 'antd';
import { useForm } from 'antd/es/form/Form';

interface FormData {
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

export function UserForm() {
  const [form] = useForm<FormData>();

  const onFinish = (values: FormData) => {
    console.log(values);
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: 'email' }]}
      >
        <Input placeholder="user@example.com" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true }]}
      >
        <Input placeholder="John Doe" />
      </Form.Item>

      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true }]}
      >
        <Select placeholder="Select role">
          <Select.Option value="admin">Admin</Select.Option>
          <Select.Option value="editor">Editor</Select.Option>
          <Select.Option value="viewer">Viewer</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
```

### Material-UI
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from '@mui/material';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Name"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
        fullWidth
        margin="normal"
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Role</InputLabel>
        <Select {...register('role')} label="Role">
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="editor">Editor</MenuItem>
          <MenuItem value="viewer">Viewer</MenuItem>
        </Select>
      </FormControl>

      <Button type="submit" variant="contained" fullWidth>
        Submit
      </Button>
    </form>
  );
}
```

## Layout Options

### Single Column
```typescript
// Default layout
return (
  <form className="form-single-column">
    {fields.map(field => (
      <div key={field.name} className="form-group">
        <label>{field.label}</label>
        <input {...register(field.name)} />
      </div>
    ))}
  </form>
);
```

### Two Columns
```typescript
// 2-column grid
return (
  <form className="form-two-columns">
    {fields.map(field => (
      <div
        key={field.name}
        className="form-group"
        style={{ gridColumn: `span ${field.ui?.span || 12}` }}
      >
        <label>{field.label}</label>
        <input {...register(field.name)} />
      </div>
    ))}
  </form>
);
```

### Compact Layout
```typescript
// Small size, tight spacing
return (
  <form className="form-compact">
    {fields.map(field => (
      <div key={field.name} className="form-group compact">
        <label className="text-sm">{field.label}</label>
        <input
          {...register(field.name)}
          className="input-sm"
          placeholder={field.placeholder}
        />
      </div>
    ))}
  </form>
);
```

## Form Modes

### Create Mode
```typescript
export function CreateForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'viewer',
      age: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    await userAPI.create(data);
    // Success handling
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <button type="submit">Create</button>
    </form>
  );
}
```

### Update Mode
```typescript
export function UpdateForm({ id }: { id: string }) {
  const [initialData, setInitialData] = useState<Partial<FormData> | null>(null);

  useEffect(() => {
    userAPI.get(id).then(data => setInitialData(data));
  }, [id]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: FormData) => {
    await userAPI.update(id, data);
    // Success handling
  };

  if (!initialData) return <div>Loading...</div>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <button type="submit">Update</button>
    </form>
  );
}
```

### Hybrid Mode
```typescript
export function Form({ id }: { id?: string }) {
  const isUpdate = !!id;
  const [initialData, setInitialData] = useState<Partial<FormData> | null>(null);

  useEffect(() => {
    if (id) {
      userAPI.get(id).then(data => setInitialData(data));
    }
  }, [id]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { role: 'viewer', age: 0 },
  });

  const onSubmit = async (data: FormData) => {
    if (isUpdate) {
      await userAPI.update(id, data);
    } else {
      await userAPI.create(data);
    }
    // Success handling
  };

  if (isUpdate && !initialData) return <div>Loading...</div>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <button type="submit">
        {isUpdate ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
```

## Field Configuration

### Required Fields
```typescript
// Schema
{ "validate": { "required": true } }

// Generated
<label>Name *</label>
<input {...register('name')} />
{errors.name && <span className="error">{errors.name.message}</span>}
```

### Optional Fields
```typescript
// Schema
{ "validate": { "required": false } }

// Generated
<label>Name (Optional)</label>
<input {...register('name')} />
{errors.name && <span className="error">{errors.name.message}</span>}
```

### Disabled Fields
```typescript
// Schema
{ "ui": { "disabled": true } }

// Generated
<input {...register('field')} disabled />
```

### Read-Only Fields
```typescript
// Schema
{ "ui": { "readOnly": true } }

// Generated
<input {...register('field')} readOnly />
```

### Hidden Fields
```typescript
// Schema
{ "ui": { "hidden": true } }

// Generated
// Field is not rendered
```

## Dynamic Field Rendering

### From Schema
```typescript
const fieldComponents = {
  'string': (field: any) => <input type="text" {...register(field.name)} />,
  'text': (field: any) => <textarea {...register(field.name)} rows={field.ui?.rows} />,
  'password': (field: any) => <input type="password" {...register(field.name)} />,
  'email': (field: any) => <input type="email" {...register(field.name)} />,
  'number': (field: any) => <input type="number" {...register(field.name)} />,
  'boolean': (field: any) => <input type="checkbox" {...register(field.name)} />,
  'enum': (field: any) => (
    <select {...register(field.name)}>
      {field.options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  'datetime': (field: any) => <input type="datetime-local" {...register(field.name)} />,
  'date': (field: any) => <input type="date" {...register(field.name)} />,
  'file': (field: any) => <input type="file" onChange={handleFile(field.name)} />,
};

return (
  <form>
    {fields.map(field => (
      <div key={field.name} className="form-group">
        <label>{field.label}</label>
        {fieldComponents[field.type]?.(field)}
        {errors[field.name] && <span className="error">{errors[field.name]?.message}</span>}
      </div>
    ))}
  </form>
);
```

## File Upload

### Single File
```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const { url } = await response.json();
  setValue('avatar', url);
};

<input type="file" onChange={handleFileUpload} />
```

### Multiple Files
```typescript
const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);

  const uploadPromises = files.map(file => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/upload', { method: 'POST', body: formData })
      .then(res => res.json());
  });

  const results = await Promise.all(uploadPromises);
  const urls = results.map(r => r.url);
  setValue('images', urls);
};

<input type="file" multiple onChange={handleFilesUpload} />
```

### Image Preview
```typescript
const [preview, setPreview] = useState<string | null>(null);

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }
};

return (
  <div>
    <input type="file" accept="image/*" onChange={handleImageUpload} />
    {preview && <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />}
  </div>
);
```

## Nested Forms

### Object Fields
```typescript
// Schema
{
  "address": {
    "type": "object",
    "properties": {
      "street": { "type": "string" },
      "city": { "type": "string" }
    }
  }
}

// Generated
<div className="nested-form">
  <div className="form-group">
    <label>Street</label>
    <input {...register('address.street')} />
  </div>
  <div className="form-group">
    <label>City</label>
    <input {...register('address.city')} />
  </div>
</div>
```

### Array Fields
```typescript
// Schema
{
  "tags": {
    "type": "array",
    "items": { "type": "string" }
  }
}

// Generated
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'tags',
});

{fields.map((field, index) => (
  <div key={field.id}>
    <input {...register(`tags.${index}`)} />
    <button type="button" onClick={() => remove(index)}>Remove</button>
  </div>
))}

<button type="button" onClick={() => append('')}>
  Add Tag
</button>
```

## Error Handling

### Field Errors
```typescript
{errors.email && (
  <span className="error-message">
    {errors.email.message}
  </span>
)}
```

### API Errors
```typescript
const [apiError, setApiError] = useState<string | null>(null);

const onSubmit = async (data: FormData) => {
  try {
    await userAPI.create(data);
    onSuccess?.();
  } catch (error: any) {
    setApiError(error.message || 'Submission failed');
  }
};

{apiError && (
  <div className="api-error">
    {apiError}
  </div>
)}
```

### Global Error Boundary
```typescript
export function FormWithErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div className="error">Something went wrong. Please refresh.</div>}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Success Handling

### Redirect
```typescript
const onSubmit = async (data: FormData) => {
  await userAPI.create(data);
  navigate('/users');
};
```

### Show Message
```typescript
const [success, setSuccess] = useState(false);

const onSubmit = async (data: FormData) => {
  await userAPI.create(data);
  setSuccess(true);
  setTimeout(() => {
    setSuccess(false);
    onSuccess?.();
  }, 2000);
};

{success && <div className="success">Created successfully!</div>}
```

### Reset Form
```typescript
const onSubmit = async (data: FormData) => {
  await userAPI.create(data);
  form.reset(); // Reset to defaults
};
```

## Form State Management

### Loading State
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const onSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  try {
    await userAPI.create(data);
  } finally {
    setIsSubmitting(false);
  }
};

<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
```

### Dirty State
```typescript
const { formState: { isDirty } } = form;

<button type="submit" disabled={!isDirty}>
  Save Changes
</button>
```

### Reset Button
```typescript
const { reset } = form;

<button type="button" onClick={() => reset()}>
  Reset
</button>
```

## Performance Optimization

### Debounced Validation
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange',
  delayError: 500,
});
```

### Lazy Loading
```typescript
const [fields, setFields] = useState<any[]>([]);

useEffect(() => {
  // Only load fields when form is visible
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadSchema();
      observer.disconnect();
    }
  });

  observer.observe(formRef.current!);
}, []);
```

### Memoization
```typescript
const FieldRenderer = React.memo(({ field }: { field: any }) => {
  return (
    <div className="form-group">
      <label>{field.label}</label>
      <input {...register(field.name)} />
    </div>
  );
});

// In form
{fields.map(field => (
  <FieldRenderer key={field.name} field={field} />
))}
```

## Resources

### Scripts
- `scripts/generate_form.py` - Main generation script
- `scripts/generate_dynamic_form.py` - Dynamic form generator
- `scripts/validate_schema.py` - Schema validation

### References
- `references/field-types.md` - Field type mappings
- `references/validation-rules.md` - Validation patterns
- `references/ui-libraries.md` - UI library integration
- `references/nested-forms.md` - Complex form patterns

### Assets
- `assets/templates/` - Component templates
- `assets/examples/` - Complete examples
- `assets/hooks/` - Reusable hooks

## Best Practices

### Before Generation
1. ✅ Validate schema
2. ✅ Configure `showInForm` in schema
3. ✅ Set appropriate labels and placeholders
4. ✅ Define validation rules

### After Generation
1. ✅ Test all validation rules
2. ✅ Check error messages
3. ✅ Test form submission
4. ✅ Add loading states

### Code Quality
- ✅ Type safety
- ✅ Error handling
- ✅ Loading states
- ✅ Success feedback
- ✅ Accessibility
- ✅ Responsive design

## Integration

### With Backend
```bash
# Generate backend first
python ../backend-developer/scripts/generate_go.py schema.json --output ./backend

# Then generate frontend form
python scripts/generate_form.py schema.json --output ./frontend
```

### With Table
```bash
# Generate table for list view
python ../table-developer/scripts/generate_table.py schema.json --output ./frontend

# Generate form for create/edit
python scripts/generate_form.py schema.json --output ./frontend
```

### With Schema Validator
```bash
# Validate first
python ../schema-validator/scripts/validate_schema.py schema.json

# Then generate
python scripts/generate_form.py schema.json --output ./frontend
```

## Common Patterns

### Create Form
```typescript
export function CreateForm() {
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'viewer', age: 0 },
  });

  const onSubmit = async (data: CreateUserDTO) => {
    await userAPI.create(data);
    navigate('/users');
  };

  return <UserForm form={form} onSubmit={onSubmit} />;
}
```

### Edit Form
```typescript
export function EditForm({ id }: { id: string }) {
  const [initialData, setInitialData] = useState<Partial<FormData> | null>(null);

  useEffect(() => {
    userAPI.get(id).then(setInitialData);
  }, [id]);

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: UpdateUserDTO) => {
    await userAPI.update(id, data);
    navigate('/users');
  };

  if (!initialData) return <div>Loading...</div>;

  return <UserForm form={form} onSubmit={onSubmit} />;
}
```

### Search Form
```typescript
export function SearchForm({ onSearch }: { onSearch: (params: any) => void }) {
  const form = useForm();

  const onSubmit = (data: any) => {
    onSearch(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('keyword')} placeholder="Search..." />
      <select {...form.register('status')}>
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button type="submit">Search</button>
    </form>
  );
}
```

## Troubleshooting

### Common Issues

**Validation not working**
- Check Zod schema matches schema.json
- Verify resolver is configured
- Ensure form mode is correct

**Type errors**
- Run TypeScript compiler
- Check generated types
- Verify imports

**Default values not showing**
- Ensure defaultValues is set
- Check initialData loading
- Verify form.reset() timing

**File upload not working**
- Check FormData construction
- Verify API endpoint
- Check CORS settings

**Nested fields not registering**
- Use correct field path syntax
- Check field array usage
- Verify form structure

## Related Skills
- `table-developer` - Generate table components
- `backend-developer` - Generate backend code
- `schema-validator` - Validate schemas before generation