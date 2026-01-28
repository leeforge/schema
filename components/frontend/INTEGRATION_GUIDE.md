# 前端集成指南

> 前端如何使用组件数据

## 🎯 集成方式

前端可以通过以下方式使用组件：

1. **后端附加** - 后端返回 `xxxDisplay` 字段（推荐）
2. **前端获取** - 前端调用组件 API 获取选项
3. **混合模式** - 表单用 API，列表用后端附加

---

## 📡 API 规范

### 获取组件选项

**Endpoint**: `POST /api/v1/components/{name}/options`

**Request Body**:
```json
{
  "code": "invitation_status"
}
```

**Response**:
```json
{
  "data": [
    {
      "label": "Pending",
      "value": "pending",
      "extra": {
        "color": "blue",
        "icon": "Clock"
      }
    },
    {
      "label": "Used",
      "value": "used",
      "extra": {
        "color": "green",
        "icon": "CheckCircle"
      }
    }
  ]
}
```

---

## 🪝 通用 Hook

### useComponent

```typescript
// hooks/useComponent.ts
import { useRequest } from 'ahooks';

export interface ComponentOption {
  label: string;
  value: any;
  extra?: Record<string, any>;
}

export interface ComponentConfig {
  [key: string]: any;
}

export function useComponent(name: string, config: ComponentConfig) {
  const cacheKey = `component:${name}:${JSON.stringify(config)}`;

  const { data, loading, error } = useRequest<ComponentOption[]>(
    async () => {
      const res = await fetch(`/api/v1/components/${name}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      return json.data;
    },
    {
      cacheKey,
      staleTime: 5 * 60 * 1000, // 5分钟缓存
    }
  );

  const getDisplay = (value: any) => {
    return data?.find((opt) => opt.value === value);
  };

  return {
    options: data ?? [],
    loading,
    error,
    getDisplay,
  };
}
```

---

## 📝 表单集成

### 使用组件选项

```tsx
import { useComponent } from '@/hooks/useComponent';
import { Form, Select } from 'antd';

function InvitationForm() {
  const { options: statusOptions, loading } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  return (
    <Form>
      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select
          loading={loading}
          options={statusOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
          }))}
        />
      </Form.Item>
    </Form>
  );
}
```

### 自定义渲染（带图标和颜色）

```tsx
import { Tag } from 'antd';
import * as Icons from '@ant-design/icons';

function InvitationForm() {
  const { options: statusOptions } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  return (
    <Form.Item name="status" label="Status">
      <Select>
        {statusOptions.map((opt) => {
          const Icon = Icons[opt.extra?.icon];
          return (
            <Select.Option key={opt.value} value={opt.value}>
              <Tag color={opt.extra?.color} icon={Icon && <Icon />}>
                {opt.label}
              </Tag>
            </Select.Option>
          );
        })}
      </Select>
    </Form.Item>
  );
}
```

---

## 📊 表格集成

### 方式 1：使用后端附加的 Display（推荐）

```tsx
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface Invitation {
  id: string;
  email: string;
  status: string;
  statusDisplay?: {
    label: string;
    value: string;
    extra?: {
      color?: string;
      icon?: string;
    };
  };
}

function InvitationTable() {
  const columns: ColumnsType<Invitation> = [
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status, record) => {
        // 优先使用后端附加的 Display
        if (record.statusDisplay) {
          const { label, extra } = record.statusDisplay;
          return <Tag color={extra?.color}>{label}</Tag>;
        }
        // Fallback：显示原始值
        return <Tag>{status}</Tag>;
      },
    },
  ];

  return <Table columns={columns} dataSource={data} />;
}
```

### 方式 2：前端获取字典映射

```tsx
function InvitationTable() {
  const { options: statusOptions } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  // 构建 value -> option 映射
  const statusMap = useMemo(() => {
    return statusOptions.reduce((acc, opt) => {
      acc[opt.value] = opt;
      return acc;
    }, {} as Record<string, ComponentOption>);
  }, [statusOptions]);

  const columns: ColumnsType<Invitation> = [
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const option = statusMap[status];
        if (!option) return <Tag>{status}</Tag>;

        return <Tag color={option.extra?.color}>{option.label}</Tag>;
      },
    },
  ];

  return <Table columns={columns} dataSource={data} />;
}
```

---

## 🔍 筛选集成

### 表格筛选

```tsx
function InvitationTable() {
  const { options: statusOptions } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  const columns: ColumnsType<Invitation> = [
    {
      title: 'Status',
      dataIndex: 'status',
      filters: statusOptions.map((opt) => ({
        text: opt.label,
        value: opt.value,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status, record) => {
        const display = record.statusDisplay;
        return <Tag color={display?.extra?.color}>{display?.label || status}</Tag>;
      },
    },
  ];

  return <Table columns={columns} dataSource={data} />;
}
```

### 搜索表单

```tsx
function InvitationSearch() {
  const { options: statusOptions } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  return (
    <Form layout="inline">
      <Form.Item name="status" label="Status">
        <Select
          allowClear
          placeholder="All"
          options={[
            { label: 'All', value: '' },
            ...statusOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
          ]}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Search
        </Button>
      </Form.Item>
    </Form>
  );
}
```

---

## 🎨 渲染工具函数

### 通用 Tag 渲染器

```tsx
// utils/componentRenderer.tsx
import { Tag } from 'antd';
import * as Icons from '@ant-design/icons';

export interface ComponentDisplay {
  label: string;
  value: any;
  extra?: {
    color?: string;
    icon?: string;
  };
}

export function renderTag(display?: ComponentDisplay, fallback?: string) {
  if (!display) {
    return <Tag>{fallback}</Tag>;
  }

  const Icon = display.extra?.icon ? Icons[display.extra.icon] : undefined;

  return (
    <Tag color={display.extra?.color} icon={Icon && <Icon />}>
      {display.label}
    </Tag>
  );
}

// 使用
<Table
  columns={[
    {
      title: 'Status',
      render: (_, record) => renderTag(record.statusDisplay, record.status),
    },
  ]}
/>
```

### 通用 Badge 渲染器

```tsx
// utils/componentRenderer.tsx
import { Badge } from 'antd';

export function renderBadge(display?: ComponentDisplay, fallback?: string) {
  if (!display) {
    return <Badge status="default" text={fallback} />;
  }

  const statusMap = {
    blue: 'processing',
    green: 'success',
    red: 'error',
    yellow: 'warning',
  } as const;

  const status = statusMap[display.extra?.color] || 'default';

  return <Badge status={status} text={display.label} />;
}
```

---

## 🔄 完整示例

### 邀请管理页面

```tsx
import { useState } from 'react';
import { Table, Form, Select, Button, Tag, Modal } from 'antd';
import { useComponent } from '@/hooks/useComponent';
import { useRequest } from 'ahooks';

function InvitationManagement() {
  const [searchForm] = Form.useForm();
  const { options: statusOptions } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  // 查询列表
  const { data, loading, run: fetchList } = useRequest(
    async (params) => {
      const res = await fetch('/api/v1/invitations?' + new URLSearchParams(params));
      return res.json();
    },
    { manual: false }
  );

  // 搜索
  const handleSearch = (values: any) => {
    fetchList(values);
  };

  // 表格列
  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_: string, record: any) => {
        const display = record.statusDisplay;
        return <Tag color={display?.extra?.color}>{display?.label}</Tag>;
      },
      filters: statusOptions.map((opt) => ({
        text: opt.label,
        value: opt.value,
      })),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
    },
  ];

  return (
    <div>
      {/* 搜索表单 */}
      <Form form={searchForm} layout="inline" onFinish={handleSearch}>
        <Form.Item name="status" label="Status">
          <Select allowClear placeholder="All" style={{ width: 150 }}>
            {statusOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Search
          </Button>
        </Form.Item>
      </Form>

      {/* 表格 */}
      <Table
        loading={loading}
        columns={columns}
        dataSource={data?.data}
        pagination={{
          total: data?.total,
          pageSize: data?.pageSize,
        }}
      />
    </div>
  );
}
```

---

## 🎯 最佳实践

### 1. 缓存策略

- 使用 `staleTime` 缓存组件选项（5分钟）
- 相同配置共享缓存（通过 cacheKey）

### 2. 加载状态

- 表单加载时显示 loading
- 表格可以先渲染原始值，再替换为 display

### 3. 错误处理

```tsx
const { options, error } = useComponent('dictionary', { code: 'xxx' });

if (error) {
  return <Alert type="error" message="Failed to load options" />;
}
```

### 4. TypeScript 类型

```typescript
// types/component.ts
export interface ComponentDisplay {
  label: string;
  value: any;
  extra?: Record<string, any>;
}

export interface InvitationDTO {
  id: string;
  status: string;
  statusDisplay?: ComponentDisplay;
}
```

---

## 📚 相关文档

- [组件规范](../COMPONENT_SPECIFICATION.md)
- [Schema 规范](../SCHEMA_REFERENCE.md)
- [后端使用指南](../backend/USAGE_GUIDE.md)

---

**版本**: v1.0
**更新日期**: 2026-01-28
