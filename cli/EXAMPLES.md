# CLI Examples

This document provides practical examples of using the @leeforge/schema-cli tool.

## Basic Usage

### First Time Setup

```bash
# Navigate to your project
cd my-awesome-project

# Run the CLI
npx @leeforge/schema-cli install

# Follow the interactive prompts:
# 1. Select AI assistant (or it will auto-detect)
# 2. Choose what to install (skills, rules, or both)
# 3. Installation completes!
```

## Common Scenarios

### Scenario 1: Install Everything for Claude Code

```bash
schema-cli install --ai claude --type both
```

**Output:**
```
🚀 Leeforge Schema Installer

✓ Claude Code: ✓ 5 skills, 1 rules installed
   Skills: schema, code-detector, form-developer, table-developer, backend-developer
   Rules: schema-rules

✨ Installation complete!
```

### Scenario 2: Install Only Schema Skill

```bash
schema-cli install --skills schema
```

This will:
- Auto-detect your AI assistant
- Install only the schema skill
- Skip other skills and rules

### Scenario 3: Multi-AI Setup

```bash
# Install for all AI assistants at once
schema-cli install --ai all

# This creates:
# .claude/skills/...
# .cursor/skills/...
# .windsurf/skills/...
# .cline/skills/...
```

### Scenario 4: Update After Schema Changes

```bash
# Update to get latest changes
schema-cli update

# Or force reinstall
schema-cli install --force
```

### Scenario 5: Custom Installation

```bash
# Install specific skills for Cursor
schema-cli install --ai cursor --type skill --skills schema,form-developer

# Install only rules for Windsurf
schema-cli install --ai windsurf --type rule
```

## Advanced Usage

### Combining Options

```bash
# Install specific resources with force
schema-cli install --ai claude --skills schema --rules skill-creator-rules --force
```

### Using with Different Package Managers

```bash
# npm
npx @leeforge/schema-cli install

# pnpm
pnpm dlx @leeforge/schema-cli install

# yarn
yarn dlx @leeforge/schema-cli install

# bun
bunx @leeforge/schema-cli install
```

## Troubleshooting

### Issue: "No AI type detected"

**Solution:**
```bash
# Explicitly specify the AI type
schema-cli install --ai claude

# Or create the directory first
mkdir .claude
schema-cli install
```

### Issue: "Files already exist"

**Solution:**
```bash
# Use force flag to overwrite
schema-cli install --force
```

### Issue: "Skill not found"

**Solution:**
```bash
# List available resources first
schema-cli list

# Then install with correct names
schema-cli install --skills schema,form-developer
```

## Workflow Examples

### Development Workflow

```bash
# 1. Initial setup
schema-cli install

# 2. Work on your project
# ...

# 3. Update when new skills are available
schema-cli update

# 4. List what's available
schema-cli list
```

### Team Onboarding

```bash
# New team member setup script
#!/bin/bash

# Install CLI globally
npm install -g @leeforge/schema-cli

# Navigate to project
cd /path/to/project

# Install all resources
schema-cli install --ai all --type both

echo "✨ Setup complete! You're ready to go."
```

### CI/CD Integration

```bash
# In your CI/CD pipeline
- name: Setup Leeforge
  run: |
    npx @leeforge/schema-cli install --ai claude --type both
```

## Tips and Tricks

### 1. Quick Check

```bash
# See what's available before installing
schema-cli list
```

### 2. Partial Updates

```bash
# Update only skills
schema-cli update --type skill

# Update only for specific AI
schema-cli update --ai cursor
```

### 3. Fresh Install

```bash
# Remove old installation
rm -rf .claude/skills .claude/rules

# Install fresh
schema-cli install --ai claude
```

### 4. Verify Installation

```bash
# Check installed files
ls -la .claude/skills
ls -la .claude/rules

# Or use tree (if installed)
tree .claude
```

## Real-World Examples

### Example 1: Full-Stack Developer Setup

```bash
# Install everything for Claude Code
schema-cli install --ai claude

# Result:
# ✓ All 5 skills installed
# ✓ Rules for skill creation installed
# ✓ Ready to generate schemas, forms, tables, and backend code
```

### Example 2: Frontend Developer Setup

```bash
# Install only frontend-related skills
schema-cli install --skills schema,form-developer,table-developer
```

### Example 3: Backend Developer Setup

```bash
# Install schema and backend skills
schema-cli install --skills schema,backend-developer
```

### Example 4: Skill Creator Setup

```bash
# Install schema and rules for creating new skills
schema-cli install --skills schema --rules schema-rules
```

## FAQ

**Q: Can I install for multiple AI assistants?**
A: Yes! Use `--ai all` to install for all detected AI assistants.

**Q: How do I uninstall?**
A: Simply delete the `.claude/skills` or `.claude/rules` directories.

**Q: Can I customize which skills are installed?**
A: Yes! Use `--skills` flag with comma-separated skill names.

**Q: Will this overwrite my custom configurations?**
A: No, unless you use `--force`. By default, it skips existing files.

**Q: How do I know what's installed?**
A: Check the `.claude/skills` and `.claude/rules` directories in your project.
