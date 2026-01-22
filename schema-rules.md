# Schema Development Rules

## When to Use

When any of the following tasks involve schema-driven development, invoke the `/schema` skill:

- **Backend Development**: Generate Go backend code (DTOs, services, controllers, Ent schemas) from entity schemas
- **Frontend Development**: Generate React table components, form components, and API clients from entity schemas
- **Schema Validation**: Analyze and validate generated code against schema definitions

## How to Invoke

Use the skill tool:

```
skill: /schema
```

The skill contains complete instructions for:

- Schema specification and structure
- Code generation workflows (backend/frontend)
- Validation and quality checks
- Common patterns and best practices

## Available Sub-skills

The `/schema` skill orchestrates the following specialized skills:

- `backend-developer` - Go backend code generation
- `table-developer` - React table components
- `form-developer` - React form components
- `code-detector` - Code quality analysis

## Schema Location

Entity schemas are typically located at:

- `.claude/skill/schema/entity_schema.json`

---

**Last Updated:** 2026-01-22
**Version:** 3.0
