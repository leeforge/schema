# Leeforge Schema System

A powerful schema-driven development framework designed to streamline full-stack application generation using Claude Skills. This repository serves as the single source of truth for your data models and provides the tooling to transform these definitions into production-ready code.

## 🚀 Overview

Leeforge Schema allows you to define your data models in a centralized JSON file. By leveraging specialized AI skills, you can automatically generate:

- **Backend Code**: Go (Golang) services, DTOs, controllers, and Ent database schemas.
- **Frontend Components**: React/Ant Design tables and forms.
- **Validation**: Comprehensive schema integrity checks.

## 📂 Project Structure

```text
.
├── schema.json          # The core JSON Schema definition
├── schema-rules.md      # Rules and guidelines for defining schemas
├── skills/              # Collection of Claude Skills for code generation
│   ├── backend-developer # Skill for generating Go backend architecture
│   ├── form-developer    # Skill for generating React form components
│   ├── table-developer   # Skill for generating React table components
│   └── code-detector     # Skill for code analysis and quality checks
└── LICENSE
```

## 🛠️ Usage

### 1. Schema Reference & Usage

To use this schema in your own project, reference the `schema.json` file in your entity definition files. This provides intellisense and validation in modern IDEs like VS Code.

Create a file (e.g., `entity_schema.json`) and add the `$schema` field:

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

### 2. Complete Schema Demo

Here is a comprehensive example showing various field types, validation rules, UI configuration, and relationships.

```json
{
  "$schema": "./schema.json",
  "name": "Product",
  "description": "E-commerce product entity",
  "softDelete": true,
  "ui": {
    "showReset": true,
    "submitText": "Save Product"
  },
  "properties": {
    "name": {
      "type": "string",
      "label": "Product Name",
      "ui": { "span": 12, "placeholder": "Enter product name" },
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
      "ui": { "widget": "decimal", "precision": 2, "prefix": "$" },
      "validate": { "min": 0, "positive": true }
    },
    "status": {
      "type": "enum",
      "ui": { "widget": "select" },
      "validate": { "enum": ["draft", "published", "archived"] }
    },
    "category": {
      "$ref": "Category",
      "x-relation": {
        "type": "many2One",
        "labelField": "name"
      }
    },
    "tags": {
      "$ref": "Tag",
      "x-relation": {
        "type": "many2Many",
        "labelField": "name"
      },
      "ui": { "widget": "select", "multiple": true }
    }
  },
  "indexes": [
    { "columns": ["name"], "type": "fulltext" }
  ]
}
```

### 3. Invoking Skills

Use the registered Claude Skills to generate code based on your schema.

**Backend Generation**
```text
skill: /backend-developer
```
*Generates Go structs, Ent schema, Service layer, and HTTP Controllers.*

**Frontend Generation**
```text
skill: /table-developer
skill: /form-developer
```
*Generates React Table and Form components using Ant Design.*

**Quality Check**
```text
skill: /code-detector
```
*Analyzes generated code for consistency and potential issues.*

## ✨ Features

- **Type Safety**: Automatic mapping between JSON Schema types, Go structs, and TypeScript interfaces.
- **Ent Integration**: Native support for Ent framework schema generation.
- **UI/UX Ready**: Schema supports UI annotations for controlling table columns, form widgets, and validation messages.
- **Extensible**: Modular skill architecture allows adding new generators easily.

## 📝 Documentation

- [Schema Development Rules](./schema-rules.md)
- [Backend Developer Guide](./skills/backend-developer/SKILL.md)

## 📄 License

See [LICENSE](./LICENSE) for details.
