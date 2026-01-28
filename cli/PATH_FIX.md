# Path Resolution Fix

## Problem

After building the CLI, running it from the repository root failed to find skills and rules directories.

## Root Cause

The original code used static path calculation:
```typescript
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
```

This worked in development but failed after building because:
- In dev: `__dirname` = `cli/src/utils/`
- After build: `__dirname` = `cli/dist/`
- The number of `..` needed changes depending on the build output structure

## Solution

Implemented dynamic repository root discovery:

```typescript
function findRepoRoot(): string {
  let currentDir = __dirname;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    // Check if this directory contains the markers we expect
    const skillsDir = join(currentDir, 'skills');
    const claudeDir = join(currentDir, '.claude');

    if (existsSync(skillsDir) && existsSync(claudeDir)) {
      return currentDir;
    }

    // Go up one level
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
    depth++;
  }

  // Fallback
  return resolve(__dirname, '..', '..');
}
```

This function:
1. Starts from the CLI's location (`__dirname`)
2. Walks up the directory tree
3. Looks for markers (`skills/` and `.claude/` directories)
4. Returns the first directory containing both markers
5. Falls back to a reasonable default if nothing is found

## New Features

### 1. Debug Command

Added `schema-cli debug` to diagnose path issues:

```bash
schema-cli debug
```

Output:
```
🔍 Leeforge CLI Debug Information

Repository Paths:
  Root:   /Users/jsonlee/Projects/leeforge_schema
  Skills: /Users/jsonlee/Projects/leeforge_schema/skills
  Rules:  /Users/jsonlee/Projects/leeforge_schema/.claude/rules

Path Existence:
  ✓ Root directory exists
  ✓ Skills directory exists
  ✓ Rules directory exists

Current Working Directory:
  /Users/jsonlee/Projects/some-project

CLI Location:
  /Users/jsonlee/Projects/leeforge_schema/cli/dist

✨ All paths are valid!
```

### 2. Better Error Messages

Updated copy functions to show the attempted paths when resources are not found:

```
⚠️  Skill 'schema' not found at /path/to/skills/schema
⚠️  Repository root: /path/to/leeforge_schema
```

## How to Use

### Step 1: Rebuild the CLI

```bash
cd /Users/jsonlee/Projects/leeforge_schema/cli
npm run build
```

### Step 2: Link for local testing

```bash
npm link
```

### Step 3: Test path resolution

```bash
# From anywhere, run debug command
schema-cli debug
```

### Step 4: Install from repository root

```bash
cd /Users/jsonlee/Projects/leeforge_schema
schema-cli install
```

### Step 5: Install from a different directory

The CLI should still find the repository by walking up the tree:

```bash
cd /Users/jsonlee/Projects/some-other-project
schema-cli install
```

**Note**: This will only work if you run it from within or near the repository. For production use (after publishing to npm), you'll want to bundle the skills/rules with the package.

## For Production (Publishing to npm)

When publishing to npm, you have two options:

### Option 1: Bundle Resources

Update `package.json`:
```json
{
  "files": [
    "dist",
    "../../skills",
    "../../.claude/rules"
  ]
}
```

This includes skills and rules in the npm package.

### Option 2: Download from GitHub

Implement a GitHub release download mechanism (like the uipro-cli example) to fetch resources at install time.

## Testing Checklist

- [ ] Build: `npm run build`
- [ ] Link: `npm link`
- [ ] Debug: `schema-cli debug`
- [ ] Install from repo root: Works ✓
- [ ] Install from subdirectory: Works ✓
- [ ] Install from outside repo: Shows error ✗ (expected)
- [ ] List command: Works ✓
- [ ] Update command: Works ✓

## Updated Files

1. `src/utils/copy.ts` - Dynamic path resolution
2. `src/commands/debug.ts` - New debug command
3. `src/index.ts` - Added debug command
4. `PATH_FIX.md` - This documentation
