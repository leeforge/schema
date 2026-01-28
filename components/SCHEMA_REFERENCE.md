# Schema 类型系统与组件规范

> Leeforge Schema 的类型系统和组件使用指南

## 📐 三层类型系统

Leeforge Schema 采用**分层类型系统**，清晰分离存储、业务逻辑和外部依赖：

```
第一层：存储类型（Storage Types）
├── string, integer, number, boolean, datetime, text, json, array, object

第二层：扩展类型（Extended Types）- 内置支持
├── enum (静态枚举)
├── uid (URL slug)
├── email, url, phone (特殊格式的 string)
├── decimal (特殊格式的数值)
├── richText (富文本)
├── password (密码)

第三层：组件类型（Component Types）- 需要外部依赖
├── dictionary (动态字典)
├── media (媒体库)
├── location (地区级联)
└── relation (关联选择器)
```

### 设计原则

- **第一层**：只关心数据库存储
- **第二层**：常用业务类型，无外部依赖，自包含验证
- **第三层**：需要外部数据源或复杂业务逻辑

---

## 🎯 何时使用组件

### 静态枚举 vs 动态字典

```json
{
  // ✅ 静态枚举 - 编译时确定，不会变化
  "priority": {
    "type": "enum",
    "validate": {
      "enum": ["low", "medium", "high"]
    },
    "ui": {
      "widget": "select",
      "options": [
        { "value": "low", "label": { "zh-CN": "低", "en-US": "Low" } },
        { "value": "medium", "label": { "zh-CN": "中", "en-US": "Medium" } },
        { "value": "high", "label": { "zh-CN": "高", "en-US": "High" } }
      ]
    }
  },

  // ✅ 动态字典 - 运行时配置，可能变化
  "industryType": {
    "$component": "dictionary:industry_types",
    "ui": { "span": 12 }
  }
}
```

**使用原则**：
- **静态枚举**：选项固定，不需要后台配置（如优先级、状态）
- **动态字典**：选项需要后台配置、可能增删改（如行业分类、地区）

### 扩展类型 vs 组件

```json
{
  // ✅ 扩展类型 - 无外部依赖
  "slug": {
    "type": "uid",
    "unique": true,
    "config": {
      "source": "title",
      "separator": "-"
    }
  },

  // ✅ 组件 - 需要外部存储
  "coverImage": {
    "$component": {
      "name": "media",
      "config": {
        "accept": ["image/*"],
        "maxSize": 2097152
      }
    }
  }
}
```

---

## 📋 组件语法

### 简写形式

适用于简单场景，只需要一个配置值：

```json
{
  "status": {
    "$component": "dictionary:article_status"
  }
}
```

格式：`"componentName:configValue"`

### 完整形式

适用于复杂配置：

```json
{
  "coverImage": {
    "$component": {
      "name": "media",
      "config": {
        "accept": ["image/*"],
        "maxSize": 2097152,
        "storage": "oss",
        "display": {
          "mode": "auto",
          "fields": ["url", "thumbnail"]
        }
      }
    }
  }
}
```

---

## 🔑 字段说明

### $component

**类型**: `string | object`

**用途**: 引用组件，用于枚举、选项等需要外部数据源的场景

**简写形式** (`string`):
```json
"$component": "dictionary:code_value"
```

**完整形式** (`object`):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | ✅ | 组件名称（必须已注册） |
| `config` | `object` | ✅ | 组件配置（格式由组件定义） |

---

## 🎯 组件配置 (config)

### 通用配置字段（建议）

虽然每个组件可以自定义配置格式，但建议包含以下通用字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `display.mode` | `"auto" \| "always" \| "never" \| "on-demand"` | 显示信息填充模式 |
| `display.fields` | `string[]` | 需要填充的字段 |
| `display.cache` | `boolean` | 是否缓存显示信息 |

### 组件特定配置

每个组件可以定义自己的配置字段，参考对应组件文档。

---

## 📝 完整示例

### 1. 静态枚举字段

```json
{
  "priority": {
    "type": "enum",
    "label": { "zh-CN": "优先级", "en-US": "Priority" },
    "default": "medium",
    "validate": {
      "required": true,
      "enum": ["low", "medium", "high"]
    },
    "ui": {
      "widget": "radio",
      "span": 12,
      "options": [
        { "value": "low", "label": { "zh-CN": "低", "en-US": "Low" } },
        { "value": "medium", "label": { "zh-CN": "中", "en-US": "Medium" } },
        { "value": "high", "label": { "zh-CN": "高", "en-US": "High" } }
      ]
    }
  }
}
```

### 2. Dictionary 组件（动态字典）

```json
{
  "status": {
    "label": { "zh-CN": "状态", "en-US": "Status" },
    "default": "draft",
    "writable": false,
    "$component": {
      "name": "dictionary",
      "config": {
        "code": "article_status",
        "display": {
          "mode": "auto",
          "fields": ["label", "color", "icon"],
          "cache": true
        }
      }
    },
    "validate": {
      "required": true,
      "onCreate": "required",
      "onUpdate": "optional"
    },
    "ui": {
      "widget": "select",
      "span": 6,
      "showInList": true,
      "filterable": true,
      "render": "tag"
    }
  }
}
```

### 3. UID 扩展类型

```json
{
  "slug": {
    "type": "uid",
    "label": "URL Slug",
    "unique": true,
    "config": {
      "source": "title",
      "separator": "-",
      "lowercase": true,
      "maxLength": 100
    },
    "validate": {
      "required": true
    },
    "ui": {
      "span": 12,
      "readOnly": true
    }
  }
}
```

### 4. RichText 扩展类型

```json
{
  "content": {
    "type": "richText",
    "label": { "zh-CN": "内容", "en-US": "Content" },
    "config": {
      "editor": "tiptap",
      "allowedFormats": ["bold", "italic", "link", "image", "heading"],
      "maxLength": 50000,
      "uploadConfig": {
        "maxSize": 5242880,
        "allowedTypes": ["image/*"]
      }
    },
    "validate": {
      "required": true,
      "minLength": 10
    },
    "ui": {
      "span": 24,
      "showInList": false
    }
  }
}
```

### 5. Media 组件

```json
{
  "coverImage": {
    "label": { "zh-CN": "封面图", "en-US": "Cover Image" },
    "$component": {
      "name": "media",
      "config": {
        "accept": ["image/*"],
        "maxSize": 2097152,
        "storage": "oss",
        "crop": {
          "aspectRatio": 16/9,
          "minWidth": 800
        },
        "display": {
          "mode": "auto",
          "fields": ["url", "thumbnail", "alt"]
        }
      }
    },
    "ui": {
      "widget": "upload",
      "span": 12,
      "showInList": true
    }
  }
}
```

### 6. Location 组件

```json
{
  "city": {
    "label": { "zh-CN": "城市", "en-US": "City" },
    "$component": {
      "name": "location",
      "config": {
        "level": "city",
        "parentField": "province",
        "display": {
          "mode": "auto",
          "fields": ["fullPath", "name"]
        }
      }
    },
    "ui": {
      "widget": "cascader",
      "span": 12,
      "filterable": true
    }
  }
}
```

---

## 📐 与其他字段的关系

### 与 `type` 字段

- **组件不需要 type**：使用 `$component` 时，类型会自动推导
- **扩展类型需要 type**：使用 `type: "uid"` 等扩展类型时必须指定

```json
{
  // ❌ 错误：组件字段不需要 type
  "status": {
    "type": "string",
    "$component": "dictionary:article_status"
  },

  // ✅ 正确：组件自动推导类型
  "status": {
    "$component": "dictionary:article_status"
  },

  // ✅ 正确：扩展类型需要 type
  "slug": {
    "type": "uid",
    "config": { "source": "title" }
  }
}
```

### 与 `$ref` 的区别

| 特性 | `$component` | `$ref` |
|------|-------------|---------|
| **用途** | 引用组件（枚举、选项） | 引用实体（关联） |
| **存储** | 存储值（如 string） | 存储外键（UUID） |
| **数据库** | 普通字段 | 外键关系 |

**示例对比**：

```json
{
  // 使用组件（值引用）
  "status": {
    "$component": "dictionary:article_status"
  },

  // 使用实体关联（外键）
  "author": {
    "$ref": "User",
    "$relation": {
      "type": "many2One",
      "inversedBy": "articles"
    }
  }
}
```

---

## 🔄 Schema 处理流程

### 后端代码生成流程

```
Schema 文件
    ↓
解析 type/扩展类型/$component
    ↓
生成 Ent Schema（根据类型生成字段）
    ↓
生成 Service（集成组件验证）
    ↓
生成 Handler（返回 DTO with Display）
```

### 前端代码生成流程

```
Schema 文件
    ↓
解析 type/扩展类型/$component
    ↓
生成表单组件（自动调用组件 API）
    ↓
生成表格列（自动渲染 Display）
```

---

## ⚙️ 验证规则配置

### onCreate / onUpdate

控制不同操作阶段的验证策略：

```json
{
  "slug": {
    "type": "uid",
    "validate": {
      "required": true,
      "onCreate": "required",  // 创建时必填
      "onUpdate": "skip"       // 更新时跳过
    }
  }
}
```

**可选值**：
- `"required"`: 必填
- `"optional"`: 可选
- `"skip"`: 跳过验证

---

## ⚠️ 注意事项

### 1. 组件必须已注册

使用前确保组件已在后端注册：

```go
component.Register(dictionary.NewDictionaryComponent(client))
component.Register(media.NewMediaComponent(client))
component.Register(location.NewLocationComponent())
```

### 2. 配置格式验证

组件会验证 config 格式，确保必填字段存在：

```go
type DictionaryConfig struct {
    Code    string         `json:"code"` // 必填
    Display *DisplayConfig `json:"display,omitempty"`
}
```

### 3. 性能考虑

- 使用 `display.mode: "never"` 可以跳过显示信息填充
- 使用 `display.cache: true` 启用缓存，减少请求
- 前端可以缓存组件选项，减少重复加载

### 4. 向后兼容

添加新的 config 字段时，应设置默认值以保持兼容：

```go
type Config struct {
    Code    string         `json:"code"`
    Display *DisplayConfig `json:"display"` // 可选，默认 nil
}
```

### 5. 命名规范统一

使用 `$` 前缀表示特殊字段：
- `$component` - 组件引用
- `$ref` - 实体引用
- `$relation` - 关系配置（原 `x-relation`）

---

## 📚 相关文档

- [组件开发规范](./COMPONENT_SPECIFICATION.md)
- [后端使用指南](./backend/USAGE_GUIDE.md)
- [前端集成指南](./frontend/INTEGRATION_GUIDE.md)
- [Dictionary 组件示例](./examples/dictionary-component.md)

---

**版本**: v2.0
**更新日期**: 2026-01-28
**主要变更**: 引入三层类型系统，优化组件设计，统一命名规范
