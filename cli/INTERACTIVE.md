# Interactive Install Feature

## New Interactive Experience

The `schema-cli install` command now provides a fully interactive experience when no options are provided.

## Interactive Prompts

### 1. AI Assistant Selection (Multi-select)

```
? Select AI assistants to install for: (Press <space> to select, <a> to toggle all)
❯◉ Claude Code
 ◯ Cursor
 ◉ Windsurf
 ◯ Cline
```

- **Auto-detected assistants** are pre-selected
- **Space** to select/deselect
- **a** to toggle all
- **Enter** to confirm

### 2. Resource Type Selection (Multi-select)

```
? What would you like to install:
❯◉ Skills
 ◉ Rules
```

- Both are selected by default
- Can deselect either one

### 3. Skills Selection (Multi-select)

```
? Select skills to install:
❯◉ schema
 ◉ code-detector
 ◉ form-developer
 ◉ table-developer
 ◉ backend-developer
```

- All skills are selected by default
- Can choose specific skills or deselect all

### 4. Rules Selection (Multi-select)

```
? Select rules to install:
❯◉ schema-rules
```

- All rules are selected by default

### 5. Force Overwrite (Confirm)

```
? Overwrite existing files? (y/N)
```

- Default is **No**
- Press **y** to force overwrite

### 6. Installation Summary

```
📋 Installation Summary:
  AI Assistants: Claude Code, Windsurf
  Skills:        schema, form-developer
  Rules:         schema-rules
  Force:         No

? Proceed with installation? (Y/n)
```

- Shows all selected options
- Final confirmation before installing

## Complete Interactive Flow

```bash
$ schema-cli install

🚀 Leeforge Schema Installer

? Select AI assistants to install for:
  ◉ Claude Code
  ◯ Cursor
  ◉ Windsurf
  ◯ Cline

? What would you like to install:
  ◉ Skills
  ◉ Rules

? Select skills to install:
  ◉ schema
  ◉ code-detector
  ◯ form-developer
  ◯ table-developer
  ◯ backend-developer

? Select rules to install:
  ◉ schema-rules

? Overwrite existing files? No

📋 Installation Summary:
  AI Assistants: Claude Code, Windsurf
  Skills:        schema, code-detector
  Rules:         schema-rules
  Force:         No

? Proceed with installation? Yes

⠹ Installing for Claude Code...
✔ Claude Code: ✓ 2 skills, 1 rules installed
   Skills: schema, code-detector
   Rules: schema-rules

⠹ Installing for Windsurf...
✔ Windsurf: ✓ 2 skills, 1 rules installed
   Skills: schema, code-detector
   Rules: schema-rules

✨ Installation complete!

Next steps:
  1. Restart your AI assistant
  2. Skills are now available for use
  3. Rules will be automatically applied
```

## Command Line Options (Non-Interactive)

You can still use command-line options to skip the interactive prompts:

```bash
# Install specific skills for Claude
schema-cli install --ai claude --skills schema,form-developer

# Install all skills and rules for all AI assistants
schema-cli install --ai all --type both

# Force reinstall specific items
schema-cli install --ai cursor --skills schema --rules schema-rules --force
```

## Features

### ✨ Multi-Select Everywhere

- **AI Assistants**: Select multiple at once
- **Skills**: Choose any combination
- **Rules**: Select all or specific ones

### 🎯 Smart Defaults

- **Auto-detection**: Pre-selects detected AI assistants
- **All selected**: Skills and rules are all selected by default
- **Safe defaults**: Force is disabled by default

### 📋 Summary Review

- See all selections before installing
- Final confirmation prompt
- Clear visual feedback

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Select/deselect item |
| `a` | Toggle all items |
| `Enter` | Confirm selection |
| `↑/↓` | Navigate |
| `Ctrl+C` | Cancel |

## Cancellation Handling

The installer handles cancellations gracefully:

```bash
# If no AI selected
❌ No AI type selected. Exiting.

# If no resources selected
❌ No resource type selected. Exiting.

# If deselected all skills
? No skills selected. Continue without installing skills? No
❌ Installation cancelled.

# If user cancels at summary
⚠️  Installation cancelled.
```

## Examples

### Example 1: Install Everything

```bash
$ schema-cli install
# Press Enter on all prompts (accept defaults)
# Installs all skills and rules for all detected AI assistants
```

### Example 2: Selective Installation

```bash
$ schema-cli install
# Select: Claude Code, Cursor
# Select: Skills only
# Select: schema, form-developer
# Installs only 2 skills for 2 AI assistants
```

### Example 3: Rules Only

```bash
$ schema-cli install
# Select: All AI assistants
# Deselect: Skills
# Select: Rules only
# Installs only rules for all AI assistants
```

### Example 4: Mix Interactive and CLI

```bash
$ schema-cli install --ai claude
# Still prompts for: resources, skills, rules, force
# But skips AI selection
```

## Benefits

1. **Faster workflow**: Multi-select is faster than multiple single selections
2. **Less repetition**: Select multiple AI assistants at once
3. **Better visibility**: See all options before choosing
4. **Mistake prevention**: Summary review before installation
5. **Flexibility**: Can still use CLI options for automation
