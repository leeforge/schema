# Skill Creator Usage Rules

## When to Use

Invoke `skill-creator` when:

- Creating a new skill from scratch
- Updating or improving an existing skill
- Packaging a skill for distribution
- Validating a skill's structure and metadata
- Understanding skill best practices and conventions

## How to Invoke

Use skill tool:

```
skill: skill-creator
```

## Key Capabilities

The skill provides guidance for:

### Skill Structure

- Standard directory structure: `SKILL.md`, `scripts/`, `references/`, `assets/`
- Naming conventions: lowercase with hyphens
- YAML frontmatter requirements

### Resource Types

- **Scripts** (`scripts/`) - Executable code for deterministic tasks
- **References** (`references/`) - Documentation loaded as needed
- **Assets** (`assets/`) - Templates, boilerplate, brand files

### Initialization

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

### Packaging

```bash
scripts/package_skill.py <path/to/skill-folder>
scripts/quick_validate.py <skill-directory>  # Before packaging
```

## Best Practices

### Writing Style

- Use imperative/infinitive form (verb-first)
- Objective, instructional language
- **Correct**: "To accomplish X, do Y"
- **Incorrect**: "You should do X"

### Progressive Disclosure

1. **Metadata** (~100 words) - Always in context
2. **SKILL.md body** (<5k words) - When skill triggers
3. **Bundled resources** - As needed by Claude

### Keep SKILL.md Lean

Move detailed information to reference files. SKILL.md should focus on:

- Overview
- When to use the skill
- Main workflows/tasks
- References to bundled resources

## Skill Location

Skill creator: `.claude/skill/skill-creator/`

---

**Last Updated:** 2026-01-22
**Version:** 2.0
