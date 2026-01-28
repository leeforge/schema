# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-28

### Added

- Initial release of @leeforge/schema-cli
- `install` command for installing skills and rules
- `list` command for listing available resources
- `update` command for updating installed resources
- Auto-detection of AI assistants (Claude, Cursor, Windsurf, Cline)
- Interactive CLI with prompts
- Support for installing specific skills/rules
- Force flag for overwriting existing files
- Comprehensive unit tests
- Built with tsdown for optimal bundling

### Features

- **AI Detection**: Automatically detects AI assistant in your project
- **Batch Installation**: Install for all AI assistants with `--ai all`
- **Selective Installation**: Choose specific skills or rules
- **Interactive Mode**: User-friendly prompts when no options provided
- **Force Mode**: Overwrite existing files with `--force` flag

### Supported AI Assistants

- Claude Code (`.claude`)
- Cursor (`.cursor`)
- Windsurf (`.windsurf`)
- Cline (`.cline`)

### Available Resources

#### Skills

- schema - Design, create, and validate entity schemas
- code-detector - Detect code patterns and issues
- form-developer - Develop forms based on schema
- table-developer - Create tables from schema
- backend-developer - Generate backend code

#### Rules

- schema-rules - Schema development workflow rules

### Development

- TypeScript with strict mode
- Vitest for testing
- tsdown for building
- Full test coverage for utilities and commands
