# Dictionary 组件示例

> 完整的 Dictionary 组件实现示例

## 📋 概述

Dictionary 组件用于管理系统中的枚举值和选项列表，支持：

- ✅ 值验证
- ✅ 选项获取
- ✅ 显示信息填充
- ✅ 层级结构（可选）
- ✅ 扩展字段（颜色、图标等）

---

## 📐 数据库结构

### dictionaries 表

```sql
CREATE TABLE dictionaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT true,
    parent_id UUID REFERENCES dictionaries(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### dictionary_details 表

```sql
CREATE TABLE dictionary_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dictionary_id UUID REFERENCES dictionaries(id) NOT NULL,
    label VARCHAR(200) NOT NULL,
    value VARCHAR(200) NOT NULL,
    extend TEXT,  -- JSON 格式
    sort INT DEFAULT 0,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dict_details_dict_id ON dictionary_details(dictionary_id);
CREATE INDEX idx_dict_details_value ON dictionary_details(value);
```

---

## 🔧 组件实现

### component.go

```go
package dictionary

import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/JsonLee12138/leeforge/frame-core/component"
    "leeforge-backend/ent"
    "leeforge-backend/ent/dictionary"
    "leeforge-backend/ent/dictionarydetail"
)

type DictionaryComponent struct {
    client *ent.Client
}

func NewDictionaryComponent(client *ent.Client) *DictionaryComponent {
    return &DictionaryComponent{client: client}
}

func (c *DictionaryComponent) Name() string {
    return "dictionary"
}

func (c *DictionaryComponent) Validate(
    ctx context.Context,
    config map[string]any,
    value any,
) error {
    cfg, err := c.parseConfig(config)
    if err != nil {
        return err
    }

    strValue, ok := value.(string)
    if !ok {
        return &component.ValidationError{
            Component: c.Name(),
            Message:   fmt.Sprintf("expected string, got %T", value),
        }
    }

    exists, err := c.client.DictionaryDetail.Query().
        Where(
            dictionarydetail.HasDictionaryWith(dictionary.CodeEQ(cfg.Code)),
            dictionarydetail.ValueEQ(strValue),
            dictionarydetail.StatusEQ(true),
        ).
        Exist(ctx)

    if err != nil {
        return &component.ValidationError{
            Component: c.Name(),
            Message:   "validation query failed",
            Err:       err,
        }
    }

    if !exists {
        return &component.ValidationError{
            Component: c.Name(),
            Message:   fmt.Sprintf("invalid value '%s' for dictionary '%s'", strValue, cfg.Code),
        }
    }

    return nil
}

func (c *DictionaryComponent) GetOptions(
    ctx context.Context,
    config map[string]any,
) ([]component.Option, error) {
    cfg, err := c.parseConfig(config)
    if err != nil {
        return nil, err
    }

    details, err := c.client.DictionaryDetail.Query().
        Where(
            dictionarydetail.HasDictionaryWith(dictionary.CodeEQ(cfg.Code)),
            dictionarydetail.StatusEQ(true),
        ).
        Order(ent.Asc(dictionarydetail.FieldSort)).
        All(ctx)

    if err != nil {
        return nil, fmt.Errorf("query options failed: %w", err)
    }

    options := make([]component.Option, len(details))
    for i, detail := range details {
        options[i] = component.Option{
            Label: detail.Label,
            Value: detail.Value,
            Extra: c.parseExtend(detail.Extend),
        }
    }

    return options, nil
}

func (c *DictionaryComponent) PopulateDisplay(
    ctx context.Context,
    config map[string]any,
    values []any,
) (map[any]component.Display, error) {
    cfg, err := c.parseConfig(config)
    if err != nil {
        return nil, err
    }

    strValues := make([]string, 0, len(values))
    for _, v := range values {
        if sv, ok := v.(string); ok {
            strValues = append(strValues, sv)
        }
    }

    if len(strValues) == 0 {
        return make(map[any]component.Display), nil
    }

    details, err := c.client.DictionaryDetail.Query().
        Where(
            dictionarydetail.HasDictionaryWith(dictionary.CodeEQ(cfg.Code)),
            dictionarydetail.ValueIn(strValues...),
        ).
        All(ctx)

    if err != nil {
        return nil, fmt.Errorf("query display failed: %w", err)
    }

    displayMap := make(map[any]component.Display, len(details))
    for _, detail := range details {
        displayMap[detail.Value] = component.Display{
            Label: detail.Label,
            Value: detail.Value,
            Extra: c.parseExtend(detail.Extend),
        }
    }

    return displayMap, nil
}

// Config

type DictionaryConfig struct {
    Code              string `json:"code"`
    ValidateOnCreate  bool   `json:"validateOnCreate"`
    ValidateOnUpdate  bool   `json:"validateOnUpdate"`
    PopulateDisplay   bool   `json:"populateDisplay"`
}

func (c *DictionaryComponent) parseConfig(config map[string]any) (*DictionaryConfig, error) {
    cfg := &DictionaryConfig{}

    data, err := json.Marshal(config)
    if err != nil {
        return nil, fmt.Errorf("marshal config failed: %w", err)
    }

    if err := json.Unmarshal(data, cfg); err != nil {
        return nil, fmt.Errorf("unmarshal config failed: %w", err)
    }

    if cfg.Code == "" {
        return nil, fmt.Errorf("config.code is required")
    }

    return cfg, nil
}

func (c *DictionaryComponent) parseExtend(extend string) map[string]any {
    if extend == "" {
        return nil
    }

    var extra map[string]any
    if err := json.Unmarshal([]byte(extend), &extra); err != nil {
        return nil
    }

    return extra
}
```

---

## 📝 Schema 使用

### invitation/schema.json

```json
{
  "name": "InvitationToken",
  "properties": {
    "status": {
      "type": "string",
      "label": "Status",
      "default": "pending",
      "writable": false,
      "$component": {
        "name": "dictionary",
        "config": {
          "code": "invitation_status",
          "validateOnCreate": true,
          "validateOnUpdate": true,
          "populateDisplay": true
        }
      },
      "ui": {
        "widget": "select",
        "render": "tag"
      }
    }
  }
}
```

---

## 🔄 Service 集成

### invitation/service.go

```go
type InvitationService struct {
    client        *ent.Client
    logger        *zap.Logger
    dictComponent component.Component
}

func NewInvitationService(client *ent.Client, logger *zap.Logger) *InvitationService {
    return &InvitationService{
        client:        client,
        logger:        logger,
        dictComponent: component.MustGet("dictionary"),
    }
}

// CreateInvitation with validation
func (s *InvitationService) CreateInvitation(
    ctx context.Context,
    email string,
) (*ent.InvitationToken, error) {
    status := "pending"

    // Validate status
    config := map[string]any{
        "code":             "invitation_status",
        "validateOnCreate": true,
    }

    if err := s.dictComponent.Validate(ctx, config, status); err != nil {
        return nil, fmt.Errorf("invalid status: %w", err)
    }

    // Create
    invitation, err := s.client.InvitationToken.Create().
        SetEmail(email).
        SetStatus(status).
        Save(ctx)

    return invitation, err
}

// ListWithDisplay
func (s *InvitationService) ListWithDisplay(
    ctx context.Context,
) ([]*InvitationDTO, error) {
    // Query
    invitations, err := s.client.InvitationToken.Query().All(ctx)
    if err != nil {
        return nil, err
    }

    // Extract status values
    values := make([]any, len(invitations))
    for i, inv := range invitations {
        values[i] = inv.Status
    }

    // Populate display
    config := map[string]any{
        "code":            "invitation_status",
        "populateDisplay": true,
    }

    displayMap, err := s.dictComponent.PopulateDisplay(ctx, config, values)
    if err != nil {
        s.logger.Warn("Failed to populate display", zap.Error(err))
        displayMap = make(map[any]component.Display)
    }

    // Build DTOs
    dtos := make([]*InvitationDTO, len(invitations))
    for i, inv := range invitations {
        dto := &InvitationDTO{
            ID:     inv.ID.String(),
            Status: inv.Status,
        }

        if display, ok := displayMap[inv.Status]; ok {
            dto.StatusDisplay = &ComponentDisplayDTO{
                Label: display.Label,
                Value: display.Value,
                Extra: display.Extra,
            }
        }

        dtos[i] = dto
    }

    return dtos, nil
}
```

---

## 🎨 前端使用

### React Hook

```tsx
import { useComponent } from '@/hooks/useComponent';

function InvitationForm() {
  const { options, loading } = useComponent('dictionary', {
    code: 'invitation_status',
  });

  return (
    <Select loading={loading}>
      {options.map((opt) => (
        <Select.Option key={opt.value} value={opt.value}>
          {opt.label}
        </Select.Option>
      ))}
    </Select>
  );
}
```

### 表格渲染

```tsx
const columns = [
  {
    title: 'Status',
    dataIndex: 'status',
    render: (_: string, record: Invitation) => {
      if (record.statusDisplay) {
        return (
          <Tag color={record.statusDisplay.extra?.color}>
            {record.statusDisplay.label}
          </Tag>
        );
      }
      return <Tag>{record.status}</Tag>;
    },
  },
];
```

---

## 📊 初始化数据

### SQL Script

```sql
-- 1. 创建字典
INSERT INTO dictionaries (id, code, name, description, status)
VALUES (
  gen_random_uuid(),
  'invitation_status',
  'Invitation Status',
  'Status enumeration for invitation tokens',
  true
);

-- 2. 创建明细
INSERT INTO dictionary_details (id, dictionary_id, label, value, extend, sort, status)
SELECT
  gen_random_uuid(),
  d.id,
  'Pending',
  'pending',
  '{"color":"blue","icon":"Clock"}',
  1,
  true
FROM dictionaries d WHERE d.code = 'invitation_status'

UNION ALL

SELECT
  gen_random_uuid(),
  d.id,
  'Used',
  'used',
  '{"color":"green","icon":"CheckCircle"}',
  2,
  true
FROM dictionaries d WHERE d.code = 'invitation_status'

UNION ALL

SELECT
  gen_random_uuid(),
  d.id,
  'Expired',
  'expired',
  '{"color":"red","icon":"XCircle"}',
  3,
  true
FROM dictionaries d WHERE d.code = 'invitation_status';
```

---

## ✅ 测试

### component_test.go

```go
func TestDictionaryComponent_Validate(t *testing.T) {
    client := setupTestClient(t)
    comp := dictionary.NewDictionaryComponent(client)

    // Setup: Insert test data
    setupTestDictionary(t, client, "test_status")

    tests := []struct {
        name    string
        config  map[string]any
        value   any
        wantErr bool
    }{
        {
            name:    "valid value",
            config:  map[string]any{"code": "test_status"},
            value:   "active",
            wantErr: false,
        },
        {
            name:    "invalid value",
            config:  map[string]any{"code": "test_status"},
            value:   "unknown",
            wantErr: true,
        },
        {
            name:    "wrong type",
            config:  map[string]any{"code": "test_status"},
            value:   123,
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := comp.Validate(context.Background(), tt.config, tt.value)
            if (err != nil) != tt.wantErr {
                t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

---

## 📚 相关文档

- [组件规范](../COMPONENT_SPECIFICATION.md)
- [后端开发指南](../backend/DEVELOPMENT_GUIDE.md)
- [前端集成指南](../frontend/INTEGRATION_GUIDE.md)

---

**版本**: v1.0
**更新日期**: 2026-01-28
