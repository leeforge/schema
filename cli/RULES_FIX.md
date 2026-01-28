# Rules Installation Fix

## Problem

Rules were not being installed successfully. The issue was:

1. `AVAILABLE_RULES` was set to `['skill-creator-rules']`
2. `RULES_DIR` was pointing to `.claude/rules/` directory
3. But the actual rule file is `schema-rules.md` at the repository root

## Root Cause

The CLI was looking for rules in the wrong location:
```typescript
// ❌ Before
const RULES_DIR = join(REPO_ROOT, '.claude', 'rules');
const AVAILABLE_RULES = ['skill-creator-rules'];
```

This expected a directory structure like:
```
.claude/
  rules/
    skill-creator-rules/
```

But the actual structure is:
```
schema-rules.md  (at repository root)
```

## Solution

Updated the rules handling to work with markdown files at the repository root:

### 1. Updated RULES_DIR

```typescript
// ✅ After
const RULES_DIR = REPO_ROOT; // Rules are at the repository root
```

### 2. Updated AVAILABLE_RULES

```typescript
// ✅ After
export const AVAILABLE_RULES = [
  'schema-rules',  // Without .md extension
] as const;
```

### 3. Updated copyRules() Function

The function now:
- Looks for `{ruleName}.md` files at the repository root
- Copies them to the target AI's rules directory
- Example: `schema-rules.md` → `.claude/rules/schema-rules.md`

```typescript
export async function copyRules(
  aiType: Exclude<AIType, 'all'>,
  targetDir: string,
  ruleNames?: string[],
  force: boolean = false
): Promise<string[]> {
  const copied: string[] = [];
  const targetPath = join(targetDir, RULES_MAPPING[aiType]);

  await mkdir(targetPath, { recursive: true });

  const rulesToCopy = ruleNames || [...AVAILABLE_RULES];

  for (const ruleName of rulesToCopy) {
    // Rules are .md files at the repository root
    const sourceFileName = `${ruleName}.md`;
    const sourcePath = join(RULES_DIR, sourceFileName);
    const destPath = join(targetPath, sourceFileName);

    if (!existsSync(sourcePath)) {
      console.warn(`⚠️  Rule '${ruleName}' not found at ${sourcePath}`);
      continue;
    }

    if (existsSync(destPath) && !force) {
      console.warn(`⚠️  Rule '${ruleName}' already exists, use --force to overwrite`);
      continue;
    }

    try {
      await cp(sourcePath, destPath, { force: force });
      copied.push(ruleName);
    } catch (error) {
      console.error(`❌ Failed to copy rule '${ruleName}':`, error);
    }
  }

  return copied;
}
```

## File Structure

### Repository Structure
```
leeforge_schema/
├── skills/                    # Skills directories
│   ├── schema/
│   ├── form-developer/
│   └── ...
├── schema-rules.md           # ✅ Rules file (root level)
└── cli/
    └── dist/
        └── index.cjs
```

### Installation Result
```
your-project/
├── .claude/
│   ├── skills/
│   │   ├── schema/
│   │   ├── form-developer/
│   │   └── ...
│   └── rules/
│       └── schema-rules.md   # ✅ Installed here
```

## Testing

```bash
# 1. Rebuild
cd /Users/jsonlee/Projects/leeforge_schema/cli
npm run build

# 2. Link
npm link

# 3. Test debug command
schema-cli debug

# 4. Test list command
schema-cli list
# Should show: schema-rules (not skill-creator-rules)

# 5. Test installation
cd /Users/jsonlee/Projects/leeforge_schema
schema-cli install --ai claude

# 6. Verify installation
ls -la .claude/rules/
# Should contain: schema-rules.md
```

## Updated Files

1. ✅ `src/types/index.ts` - Updated AVAILABLE_RULES
2. ✅ `src/utils/copy.ts` - Updated RULES_DIR and copyRules()
3. ✅ `tests/types.test.ts` - Updated test expectations
4. ✅ `tests/commands/list.test.ts` - Updated test expectations
5. ✅ `README.md` - Updated documentation
6. ✅ `CHANGELOG.md` - Updated changelog
7. ✅ `EXAMPLES.md` - Updated examples
8. ✅ `RULES_FIX.md` - This documentation

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Rules Location | `.claude/rules/` directory | Repository root |
| Rules Format | Directory-based | Markdown files |
| Rule Name | `skill-creator-rules` | `schema-rules` |
| Source File | `.claude/rules/skill-creator-rules/...` | `schema-rules.md` |
| Target File | `.claude/rules/skill-creator-rules/...` | `.claude/rules/schema-rules.md` |

## Adding More Rules

To add new rules in the future:

1. Create a markdown file at repository root: `{rule-name}.md`
2. Add to `AVAILABLE_RULES` in `src/types/index.ts`:
   ```typescript
   export const AVAILABLE_RULES = [
     'schema-rules',
     'new-rule-name',  // Add here (without .md)
   ] as const;
   ```
3. Rebuild and test

The CLI will automatically find and copy the new rule file.
