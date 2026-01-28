# 组件开发规范 (Component Specification)

> 组件接口定义与实现标准

## 📐 组件接口

所有组件必须实现 `Component` 接口：

```go
type Component interface {
    Name() string
    Validate(ctx context.Context, config map[string]any, value any) error
    GetOptions(ctx context.Context, config map[string]any) ([]Option, error)
    PopulateDisplay(ctx context.Context, config map[string]any, values []any) (map[any]Display, error)
}
```

## 🔧 接口方法说明

### 1. Name()

**作用**: 返回组件的唯一标识符

**返回值**: `string`

**示例**:
```go
func (c *DictionaryComponent) Name() string {
    return "dictionary"
}
```

**规范**:
- 使用小写字母和下划线（`snake_case`）
- 必须全局唯一
- 推荐使用模块名作为组件名

---

### 2. Validate()

**作用**: 验证字段值是否符合组件规则

**参数**:
- `ctx`: 上下文
- `config`: 组件配置（来自 Schema）
- `value`: 待验证的值

**返回值**: `error`（nil 表示验证通过）

**示例**:
```go
func (c *DictionaryComponent) Validate(ctx context.Context, config map[string]any, value any) error {
    strValue, ok := value.(string)
    if !ok {
        return &ValidationError{Message: "expected string"}
    }

    // 验证值是否在字典中存在
    exists := c.checkExists(ctx, config, strValue)
    if !exists {
        return &ValidationError{Message: "invalid value"}
    }

    return nil
}
```

**规范**:
- 必须进行类型检查
- 返回明确的错误信息
- 使用 `ValidationError` 包装错误
- 不应执行副作用操作（如数据修改）

---

### 3. GetOptions()

**作用**: 获取字段的可选值列表（用于下拉框、单选框等）

**参数**:
- `ctx`: 上下文
- `config`: 组件配置

**返回值**: `[]Option, error`

**Option 结构**:
```go
type Option struct {
    Label string `json:"label"`  // 显示文本
    Value any    `json:"value"`  // 实际值
    Extra any    `json:"extra,omitempty"` // 扩展信息（颜色、图标等）
}
```

**示例**:
```go
func (c *DictionaryComponent) GetOptions(ctx context.Context, config map[string]any) ([]Option, error) {
    details := c.queryDetails(ctx, config)

    options := make([]Option, len(details))
    for i, detail := range details {
        options[i] = Option{
            Label: detail.Label,
            Value: detail.Value,
            Extra: map[string]any{
                "color": detail.Color,
                "icon":  detail.Icon,
            },
        }
    }

    return options, nil
}
```

**规范**:
- 返回的选项应该有序（按 sort 字段）
- 只返回激活状态的选项
- Extra 字段用于存储渲染相关的元数据
- 支持缓存以提升性能

---

### 4. PopulateDisplay()

**作用**: 批量填充字段的显示信息（用于列表展示）

**参数**:
- `ctx`: 上下文
- `config`: 组件配置（包含 `display` 配置）
- `values`: 值列表

**返回值**: `map[any]Display, error`

**Display 结构**:
```go
type Display struct {
    Label string `json:"label"`  // 显示文本
    Value any    `json:"value"`  // 原始值
    Extra any    `json:"extra,omitempty"` // 扩展信息
}
```

**Display 配置**（Schema 中定义）:
```json
{
  "$component": {
    "name": "dictionary",
    "config": {
      "code": "article_status",
      "display": {
        "mode": "auto",     // auto | always | never | on-demand
        "fields": ["label", "color", "icon"],
        "cache": true
      }
    }
  }
}
```

**示例**:
```go
func (c *DictionaryComponent) PopulateDisplay(
    ctx context.Context,
    config map[string]any,
    values []any,
) (map[any]Display, error) {
    // 检查 display 配置
    displayCfg := extractDisplayConfig(config)
    if displayCfg.Mode == "never" {
        return nil, nil // 跳过填充
    }

    // 1. 批量查询
    details := c.batchQuery(ctx, config, values)

    // 2. 构建映射
    displayMap := make(map[any]Display, len(details))
    for _, detail := range details {
        displayMap[detail.Value] = Display{
            Label: detail.Label,
            Value: detail.Value,
            Extra: filterFields(detail.Extra, displayCfg.Fields),
        }
    }

    return displayMap, nil
}
```

**规范**:
- 使用批量查询提升性能（避免 N+1 问题）
- 返回 map 结构方便快速查找
- 缺失的值不应返回错误，返回空 map 项即可
- 支持缓存机制
- **尊重 `display.mode` 配置**：
  - `"never"`: 返回 nil，不填充
  - `"always"`: 始终填充
  - `"auto"`: 根据请求上下文决定
  - `"on-demand"`: 仅在明确请求时填充
- **根据 `display.fields` 过滤返回字段**

## ⚠️ 错误处理

### ValidationError

```go
type ValidationError struct {
    Component string
    Field     string
    Message   string
    Err       error
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("[%s] %s: %s", e.Component, e.Field, e.Message)
}
```

**使用示例**:
```go
return &component.ValidationError{
    Component: c.Name(),
    Field:     "status",
    Message:   "invalid value 'xxx'",
}
```

## 📦 组件注册

### 注册流程

```go
// 1. 创建组件实例
dictComponent := dictionary.NewDictionaryComponent(client)

// 2. 注册到全局注册中心
if err := component.Register(dictComponent); err != nil {
    return err
}
```

### 注册时机

在应用启动时（`main.go` 或 `bootstrap.go`）统一注册所有组件：

```go
func RegisterComponents(client *ent.Client) error {
    // Dictionary 组件
    component.Register(dictionary.NewDictionaryComponent(client))

    // Media 组件
    component.Register(media.NewMediaComponent(client, storage))

    // Location 组件
    component.Register(location.NewLocationComponent(client))

    return nil
}
```

## 🎯 组件开发清单

- [ ] 实现 `Component` 接口的 4 个方法
- [ ] 添加配置解析逻辑
- [ ] 实现缓存机制（可选）
- [ ] 编写单元测试
- [ ] 提供使用示例
- [ ] 更新文档

## 📚 相关文档

- [后端开发指南](./backend/DEVELOPMENT_GUIDE.md)
- [Schema 规范](./SCHEMA_REFERENCE.md)

---

**版本**: v1.0
**更新日期**: 2026-01-28
