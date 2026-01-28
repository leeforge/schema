# 后端组件开发指南

> 如何开发一个新组件

## 🎯 开发流程

```
1. 定义组件结构
   ↓
2. 实现 Component 接口
   ↓
3. 添加配置解析
   ↓
4. 注册组件
   ↓
5. 编写测试
```

---

## 📁 目录结构

```
backend/internal/modules/{module_name}/
├── module.go
├── service.go
├── handler.go
├── component.go          # 组件实现（新增）
└── component_test.go     # 组件测试（新增）
```

---

## 🔧 实现步骤

### 1. 定义组件结构

```go
// component.go
package dictionary

import (
    "context"
    "github.com/JsonLee12138/leeforge/frame-core/component"
    "leeforge-backend/ent"
)

type DictionaryComponent struct {
    client *ent.Client
    // 可选：添加缓存
    // cache cache.Cache
}

func NewDictionaryComponent(client *ent.Client) *DictionaryComponent {
    return &DictionaryComponent{
        client: client,
    }
}
```

---

### 2. 实现 Component 接口

#### Name()

```go
func (c *DictionaryComponent) Name() string {
    return "dictionary"
}
```

#### Validate()

```go
func (c *DictionaryComponent) Validate(
    ctx context.Context,
    config map[string]any,
    value any,
) error {
    // 1. 解析配置
    cfg, err := c.parseConfig(config)
    if err != nil {
        return err
    }

    // 2. 类型检查
    strValue, ok := value.(string)
    if !ok {
        return &component.ValidationError{
            Component: c.Name(),
            Message:   fmt.Sprintf("expected string, got %T", value),
        }
    }

    // 3. 业务验证
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
            Message:   fmt.Sprintf("invalid value '%s'", strValue),
        }
    }

    return nil
}
```

#### GetOptions()

```go
func (c *DictionaryComponent) GetOptions(
    ctx context.Context,
    config map[string]any,
) ([]component.Option, error) {
    // 1. 解析配置
    cfg, err := c.parseConfig(config)
    if err != nil {
        return nil, err
    }

    // 2. 查询数据
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

    // 3. 转换为 Option
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
```

#### PopulateDisplay()

```go
func (c *DictionaryComponent) PopulateDisplay(
    ctx context.Context,
    config map[string]any,
    values []any,
) (map[any]component.Display, error) {
    // 1. 解析配置
    cfg, err := c.parseConfig(config)
    if err != nil {
        return nil, err
    }

    // 2. 转换 values
    strValues := make([]string, 0, len(values))
    for _, v := range values {
        if sv, ok := v.(string); ok {
            strValues = append(strValues, sv)
        }
    }

    if len(strValues) == 0 {
        return make(map[any]component.Display), nil
    }

    // 3. 批量查询
    details, err := c.client.DictionaryDetail.Query().
        Where(
            dictionarydetail.HasDictionaryWith(dictionary.CodeEQ(cfg.Code)),
            dictionarydetail.ValueIn(strValues...),
        ).
        All(ctx)

    if err != nil {
        return nil, fmt.Errorf("query display failed: %w", err)
    }

    // 4. 构建映射
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
```

---

### 3. 添加配置解析

```go
// DictionaryConfig 组件配置
type DictionaryConfig struct {
    Code              string `json:"code"`
    ValidateOnCreate  bool   `json:"validateOnCreate"`
    ValidateOnUpdate  bool   `json:"validateOnUpdate"`
    PopulateDisplay   bool   `json:"populateDisplay"`
}

// parseConfig 解析配置
func (c *DictionaryComponent) parseConfig(config map[string]any) (*DictionaryConfig, error) {
    cfg := &DictionaryConfig{}

    // 使用 JSON 序列化/反序列化
    data, err := json.Marshal(config)
    if err != nil {
        return nil, fmt.Errorf("marshal config failed: %w", err)
    }

    if err := json.Unmarshal(data, cfg); err != nil {
        return nil, fmt.Errorf("unmarshal config failed: %w", err)
    }

    // 验证必填字段
    if cfg.Code == "" {
        return nil, fmt.Errorf("config.code is required")
    }

    return cfg, nil
}

// parseExtend 解析扩展字段（JSON）
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

### 4. 注册组件

#### backend/internal/bootstrap/components.go

```go
package bootstrap

import (
    "fmt"
    "github.com/JsonLee12138/leeforge/frame-core/component"
    "leeforge-backend/ent"
    "leeforge-backend/internal/modules/dictionary"
)

// RegisterComponents 注册所有组件
func RegisterComponents(client *ent.Client) error {
    // 字典组件
    dictComponent := dictionary.NewDictionaryComponent(client)
    if err := component.Register(dictComponent); err != nil {
        return fmt.Errorf("register dictionary component: %w", err)
    }

    return nil
}
```

#### backend/cmd/server/main.go

```go
func main() {
    // ... 初始化 client ...

    // 注册组件
    if err := bootstrap.RegisterComponents(client); err != nil {
        log.Fatal("Failed to register components", zap.Error(err))
    }

    // ... 启动服务器 ...
}
```

---

### 5. 编写测试

#### component_test.go

```go
package dictionary_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "leeforge-backend/internal/modules/dictionary"
)

func TestDictionaryComponent_Validate(t *testing.T) {
    // Setup
    client := setupTestClient(t)
    comp := dictionary.NewDictionaryComponent(client)

    tests := []struct {
        name    string
        config  map[string]any
        value   any
        wantErr bool
    }{
        {
            name: "valid value",
            config: map[string]any{
                "code": "invitation_status",
            },
            value:   "pending",
            wantErr: false,
        },
        {
            name: "invalid value",
            config: map[string]any{
                "code": "invitation_status",
            },
            value:   "unknown",
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := comp.Validate(context.Background(), tt.config, tt.value)
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

---

## 🎯 最佳实践

### 1. 性能优化

- **批量查询**: `PopulateDisplay()` 必须使用批量查询
- **缓存**: 对于不常变化的数据（如字典），添加缓存层
- **索引**: 确保查询字段有数据库索引

```go
// 使用 IN 查询而不是循环查询
details, err := c.client.DictionaryDetail.Query().
    Where(dictionarydetail.ValueIn(values...)).
    All(ctx)
```

### 2. 错误处理

- 使用 `component.ValidationError` 包装验证错误
- 提供明确的错误信息
- 区分业务错误和系统错误

```go
if !exists {
    return &component.ValidationError{
        Component: c.Name(),
        Field:     "status",
        Message:   fmt.Sprintf("value '%s' not found in dictionary '%s'", value, cfg.Code),
    }
}
```

### 3. 配置验证

在 `parseConfig()` 中验证所有必填字段：

```go
if cfg.Code == "" {
    return nil, fmt.Errorf("config.code is required")
}

if cfg.MaxSize <= 0 {
    return nil, fmt.Errorf("config.maxSize must be positive")
}
```

### 4. 可扩展性

预留扩展字段和钩子函数：

```go
type DictionaryComponent struct {
    client      *ent.Client
    cache       cache.Cache
    beforeQuery func(ctx context.Context, code string) error // Hook
}
```

---

## 📚 相关文档

- [组件规范](../COMPONENT_SPECIFICATION.md)
- [后端使用指南](./USAGE_GUIDE.md)
- [字典组件示例](../examples/dictionary-component.md)

---

**版本**: v1.0
**更新日期**: 2026-01-28
