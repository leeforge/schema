# @leeforge/schema-cli

> Command-line tool to install and manage Leeforge schema skills and rules for AI coding assistants

[![npm version](https://img.shields.io/npm/v/@leeforge/schema-cli.svg)](https://www.npmjs.com/package/@leeforge/schema-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Installation

```bash
# Global installation (recommended)
npm install -g @leeforge/schema-cli

# Or use with npx
npx @leeforge/schema-cli install
```

### Basic Usage

```bash
# Interactive installation
schema-cli install

# List available resources
schema-cli list

# Update installed resources
schema-cli update
```

## 📖 Commands

### `install`

Install skills and/or rules to your AI assistant with an interactive interface.

```bash
schema-cli install [options]

Options:
  --ai <type>       AI assistant type (claude, cursor, windsurf, cline, all)
  --type <type>     Resource type to install (skill, rule, both)
  --skills <names>  Comma-separated list of specific skills
  --rules <names>   Comma-separated list of specific rules
  --force          Overwrite existing files
```

#### Interactive Mode (Recommended)

Run without options for a fully interactive experience:

```bash
schema-cli install
```

**Interactive prompts:**
1. **Multi-select AI assistants** (auto-detects installed ones)
2. **Multi-select resource types** (skills/rules)
3. **Multi-select skills** (all selected by default)
4. **Multi-select rules** (all selected by default)
5. **Confirm force overwrite** (No by default)
6. **Review summary** and confirm installation

**Example flow:**
```
? Select AI assistants to install for:
  ◉ Claude Code (detected)
  ◯ Cursor
  ◉ Windsurf (detected)
  ◯ Cline

? What would you like to install:
  ◉ Skills
  ◉ Rules

? Select skills to install:
  ◉ schema
  ◉ code-detector
  ◯ form-developer
  ...

📋 Installation Summary:
  AI Assistants: Claude Code, Windsurf
  Skills:        schema, code-detector
  Rules:         schema-rules
  Force:         No

? Proceed with installation? Yes
```

#### Command Line Examples

```bash
# Interactive mode (recommended)
schema-cli install

# Install for specific AI
schema-cli install --ai claude

# Install only skills
schema-cli install --type skill

# Install specific skills
schema-cli install --skills schema,form-developer

# Install for all AI assistants
schema-cli install --ai all

# Force reinstall
schema-cli install --force

# Combine options
schema-cli install --ai cursor --skills schema --rules schema-rules
```

### `list`

List all available skills and rules.

```bash
schema-cli list
```

### `update`

Update installed skills and rules to the latest version.

```bash
schema-cli update [options]

Options:
  --ai <type>    AI assistant type to update
  --type <type>  Resource type to update (skill, rule, both)
```

**Examples:**

```bash
# Update all resources
schema-cli update

# Update only for Claude
schema-cli update --ai claude

# Update only skills
schema-cli update --type skill
```

### `debug`

Show debug information about repository paths (useful for troubleshooting).

```bash
schema-cli debug
```

Output:
```
🔍 Leeforge CLI Debug Information

Repository Paths:
  Root:   /path/to/leeforge_schema
  Skills: /path/to/leeforge_schema/skills
  Rules:  /path/to/leeforge_schema/.claude/rules

Path Existence:
  ✓ Root directory exists
  ✓ Skills directory exists
  ✓ Rules directory exists

Current Working Directory:
  /current/working/directory

CLI Location:
  /path/to/cli/dist

✨ All paths are valid!
```

## 🎯 Supported AI Assistants

| AI Assistant | Directory | Status |
|--------------|-----------|--------|
| **Claude Code** | `.claude` | ✅ Supported |
| **Cursor** | `.cursor` | ✅ Supported |
| **Windsurf** | `.windsurf` | ✅ Supported |
| **Cline** | `.cline` | ✅ Supported |

## 📦 Available Resources

### Skills

| Skill | Description |
|-------|-------------|
| **schema** | Design, create, and validate entity schemas |
| **code-detector** | Detect code patterns and issues |
| **form-developer** | Develop forms based on schema |
| **table-developer** | Create tables from schema |
| **backend-developer** | Generate backend code |

### Rules

| Rule | Description |
|------|-------------|
| **schema-rules** | Schema development workflow rules |

## 🏗️ Development

### Setup

```bash
# Clone the repository
git clone https://github.com/leeforge/schema.git
cd schema/cli

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

### Project Structure

```
cli/
├── src/
│   ├── commands/         # CLI commands
│   │   ├── install.ts
│   │   ├── list.ts
│   │   └── update.ts
│   ├── utils/            # Utility functions
│   │   ├── detect.ts     # AI type detection
│   │   └── copy.ts       # File operations
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── index.ts          # Entry point
├── tests/                # Unit tests
├── package.json
├── tsconfig.json
├── tsdown.config.ts      # Build configuration
└── vitest.config.ts      # Test configuration
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Build

This project uses [tsdown](https://github.com/egoist/tsdown) for building.

```bash
# Build once
npm run build

# Build and watch
npm run dev

# Type check
npm run typecheck
```

## 📝 How It Works

1. **Detection**: Automatically detects AI assistants in your project by looking for marker directories (`.claude`, `.cursor`, etc.)

2. **Installation**: Copies skills and rules from the repository to the appropriate directories in your project

3. **Directory Structure**:
   ```
   your-project/
   ├── .claude/
   │   ├── skills/
   │   │   ├── schema/
   │   │   ├── form-developer/
   │   │   └── ...
   │   └── rules/
   │       └── skill-creator-rules/
   ├── .cursor/
   │   └── ...
   └── ...
   ```

4. **Force Mode**: Use `--force` to overwrite existing files (useful for updates)

## 🔧 Configuration

The CLI requires no configuration. It automatically:
- Detects your AI assistant
- Creates necessary directories
- Copies resources from the repository

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [Leeforge Team](https://github.com/leeforge)

## 🔗 Links

- [Repository](https://github.com/leeforge/schema)
- [Issues](https://github.com/leeforge/schema/issues)
- [NPM Package](https://www.npmjs.com/package/@leeforge/schema-cli)

---

**Made with ❤️ by Leeforge Team**
