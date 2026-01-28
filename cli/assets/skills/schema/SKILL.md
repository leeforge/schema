---
name: schema
description: Design, create, and validate entity schemas for the Leeforge system
---

# Schema Designer

## Overview
This skill helps you design, create, and validate entity schemas that comply with the Leeforge Schema specification. Use this skill when you need to define new data models or verify existing ones before generating code.

## Quick Start

```bash
# Create a new schema
python skills/schema/scripts/create_schema.py --name User --output ./schema/user.json

# Validate a schema
python skills/schema/scripts/validate_schema.py ./schema/user.json
```

## Core Capabilities

### 1. Create New Schemas
Generate boilerplate schema files with best practices pre-configured.

### 2. Validate Schemas
Ensure your schema complies with the strict Leeforge specification, checking for:
- Required fields (name, type)
- Valid property types
- Correct relationship definitions
- UI configuration validity

### 3. Schema Reference
Access documentation about available field types, validation rules, and UI options.

## Schema Structure

A valid Leeforge schema looks like this:

```json
{
  "$schema": "https://raw.githubusercontent.com/leeforge/schema/main/schema.json",
  "name": "EntityName",
  "properties": {
    "fieldName": {
      "type": "string",
      "validate": { "required": true }
    }
  }
}
```

## Resources

- **Scripts**:
  - `create_schema.py`: Interactive CLI to generate a new schema
  - `validate_schema.py`: Validate a JSON file against the master schema
- **Templates**: `assets/templates/`
- **References**: `references/`
