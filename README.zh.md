# Leeforge Schema System (Leeforge 架构系统)

一个强大的架构驱动开发框架，旨在利用 Claude Skills 简化全栈应用程序的生成。本仓库作为数据模型的单一真实来源（Single Source of Truth），并提供工具将这些定义转换为生产级代码。

## 🚀 概览

Leeforge Schema 允许您在集中的 `schema.json` 文件中定义数据模型。通过利用专门的 AI 技能（Skills），您可以自动生成：

- **后端代码**：Go (Golang) 服务、DTO、控制器和 Ent 数据库架构。
- **前端组件**：React/Ant Design 表格和表单。
- **验证**：全面的架构完整性检查。

## 📂 项目结构

```text
.
├── schema.json          # 核心 JSON Schema 定义文件
├── schema-rules.md      # 定义架构的规则和指南
├── skills/              # 用于代码生成的 Claude Skills 集合
│   ├── backend-developer # 生成 Go 后端架构的技能
│   ├── form-developer    # 生成 React 表单组件的技能
│   ├── table-developer   # 生成 React 表格组件的技能
│   └── code-detector     # 代码分析和质量检查技能
└── LICENSE
```

## 🛠️ 使用方法

### 1. Schema 引用与使用

要在您的项目中使用此 Schema，请在您的实体定义文件中引用 `schema.json`。这能在 VS Code 等现代 IDE 中提供智能提示和实时验证。

创建一个文件（例如 `entity_schema.json`），并添加 `$schema` 字段指向本库的 schema 文件：

```json
{
  "$schema": "https://raw.githubusercontent.com/leeforge/schema/main/schema.json",
  "name": "Article",
  "properties": {
    "title": {
      "type": "string",
      "validate": { "required": true, "maxLength": 100 }
    }
  }
}
```

### 2. 完整 Schema 示例

这是一个综合示例，展示了各种字段类型、验证规则、UI 配置以及关系定义（Relations）。

```json
{
  "$schema": "./schema.json",
  "name": "Product",
  "description": "电商商品实体",
  "softDelete": true,
  "ui": {
    "showReset": true,
    "submitText": "保存商品"
  },
  "properties": {
    "name": {
      "type": "string",
      "label": "商品名称",
      "ui": { "span": 12, "placeholder": "请输入商品名称" },
      "validate": { "required": true, "minLength": 3 }
    },
    "sku": {
      "type": "string",
      "unique": true,
      "ui": { "span": 12 },
      "validate": { "format": "uuid" }
    },
    "price": {
      "type": "number",
      "label": "价格",
      "ui": { "widget": "decimal", "precision": 2, "prefix": "¥" },
      "validate": { "min": 0, "positive": true }
    },
    "status": {
      "type": "enum",
      "label": "状态",
      "ui": { "widget": "select" },
      "validate": { "enum": ["draft", "published", "archived"] }
    },
    "category": {
      "$ref": "Category",
      "x-relation": {
        "type": "many2One",
        "labelField": "name"
      },
      "label": "所属分类"
    },
    "tags": {
      "$ref": "Tag",
      "x-relation": {
        "type": "many2Many",
        "labelField": "name"
      },
      "ui": { "widget": "select", "multiple": true },
      "label": "标签"
    }
  },
  "indexes": [
    { "columns": ["name"], "type": "fulltext" }
  ]
}
```

### 3. 调用技能 (Invoking Skills)

使用注册的 Claude Skills 根据您的架构生成代码。在 Claude 交互界面中输入以下指令：

**后端生成**
生成 Go 结构体、Ent Schema、Service 层和 HTTP 控制器。
```text
skill: /backend-developer
```

**前端生成**
使用 Ant Design 生成 React 表格和表单组件。
```text
skill: /table-developer  # 生成列表页/表格
skill: /form-developer   # 生成编辑页/表单
```

**质量检查**
分析生成的代码，检查一致性和潜在问题。
```text
skill: /code-detector
```

## ✨ 特性

- **类型安全**：自动映射 JSON Schema 类型、Go 结构体和 TypeScript 接口。
- **Ent 集成**：原生支持 Ent 框架架构生成。
- **UI/UX 就绪**：架构支持 UI 注解，用于控制表格列、表单小部件和验证消息。
- **可扩展**：模块化技能架构允许轻松添加新的生成器。

## 📝 文档

- [架构开发规则](./schema-rules.md)
- [后端开发指南](./skills/backend-developer/SKILL.md)

## 📄 许可证

详情请参阅 [LICENSE](./LICENSE)。
