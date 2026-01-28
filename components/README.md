# 组件系统 (Component System)

> 通用的、可复用的业务组件架构

## 📋 概述

组件系统提供了一套标准化的接口和规范，用于封装可复用的业务逻辑（如字典管理、媒体库、地理位置等），使其能够被多个模块以统一的方式使用。

### 核心思想

- **标准化接口**：所有组件实现统一的 `Component` 接口
- **松耦合设计**：组件通过注册中心管理，模块按需获取
- **Schema 驱动**：通过 `$component` 声明式使用组件
- **多端适配**：后端验证 + 前端渲染一体化
- **分层类型**：清晰分离存储类型、扩展类型和组件类型

## 🎯 三层类型系统

### 第一层：存储类型（Storage Types）
只关心数据库存储：`string`, `integer`, `number`, `boolean`, `datetime`, `text`, `json`, `array`, `object`

### 第二层：扩展类型（Extended Types）
常用业务类型，无外部依赖：`enum`, `uid`, `email`, `url`, `phone`, `decimal`, `richText`, `password`

### 第三层：组件类型（Component Types）
需要外部数据源或复杂业务逻辑：`dictionary`, `media`, `location`, `tag`

## 🔍 组件 vs 扩展类型 vs 实体关联

| 特性 | 扩展类型 | `$component` | `$ref` (实体关联) |
|------|---------|-------------|------------------|
| **用途** | 内置业务类型 | 引用可复用组件 | 引用其他实体 |
| **依赖** | 无外部依赖 | 需要外部数据源 | 关联其他实体 |
| **存储** | 基础类型 | 存储组件值（如 string） | 存储实体 ID（外键） |
| **查询** | 直接查询 | 直接查询，无 JOIN | 需要 JOIN |
| **示例** | `type: "uid"` | `$component: "dictionary:..."` | `$ref: "User"` |

## 📚 文档导航

### 通用规范
- [Schema 规范](./SCHEMA_REFERENCE.md) - **从这里开始**：类型系统与组件使用
- [组件开发规范](./COMPONENT_SPECIFICATION.md) - 组件接口定义与实现标准

### 后端文档
- [组件开发指南](./backend/DEVELOPMENT_GUIDE.md) - 如何开发新组件
- [组件使用指南](./backend/USAGE_GUIDE.md) - 在业务模块中使用组件

### 前端文档
- [前端集成指南](./frontend/INTEGRATION_GUIDE.md) - 前端如何使用组件数据

### 示例
- [字典组件示例](./examples/dictionary-component.md) - Dictionary 组件完整实现

## 🚀 快速开始

### 1. Schema 中声明组件

**简写形式**（推荐，适用于简单场景）：
```json
{
  "status": {
    "$component": "dictionary:invitation_status"
  }
}
```

**完整形式**（复杂配置）：
```json
{
  "coverImage": {
    "$component": {
      "name": "media",
      "config": {
        "accept": ["image/*"],
        "maxSize": 2097152,
        "display": {
          "mode": "auto",
          "fields": ["url", "thumbnail"]
        }
      }
    }
  }
}
```

### 2. 扩展类型使用

```json
{
  "slug": {
    "type": "uid",
    "config": {
      "source": "title",
      "separator": "-"
    }
  },
  "content": {
    "type": "richText",
    "config": {
      "maxLength": 50000
    }
  }
}
```

### 3. 后端使用组件

```go
// 获取组件
comp := component.MustGet("dictionary")

// 验证值
err := comp.Validate(ctx, config, "pending")

// 填充显示信息
displayMap, err := comp.PopulateDisplay(ctx, config, values)
```

### 4. 前端使用组件

```tsx
const { options } = useComponent('dictionary', {
  code: 'invitation_status'
});

<Select options={options} />
```

## 🎨 内置组件

| 组件名 | 用途 | 类型层级 | 状态 |
|--------|------|---------|------|
| `enum` | 静态枚举 | 扩展类型 | ✅ 内置 |
| `uid` | URL slug 生成 | 扩展类型 | ✅ 内置 |
| `richText` | 富文本编辑 | 扩展类型 | ✅ 内置 |
| `email`, `url`, `phone` | 格式验证 | 扩展类型 | ✅ 内置 |
| `dictionary` | 动态字典管理 | 组件类型 | ✅ 已实现 |
| `media` | 媒体文件管理 | 组件类型 | 🚧 规划中 |
| `location` | 地理位置选择 | 组件类型 | 🚧 规划中 |
| `tag` | 标签系统 | 组件类型 | 🚧 规划中 |

## 📖 相关文档

- [系统架构](../ARCHITECTURE.md)
- [API 响应标准](../API_RESPONSE_STANDARD.md)
- [Schema 设计规范](../.claude/skills/schema/)

---

**版本**: v2.0
**更新日期**: 2026-01-28
**主要变更**: 引入三层类型系统，优化组件使用方式

