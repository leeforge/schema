# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/types.test.ts
```

## Test Structure

```
tests/
├── commands/
│   └── list.test.ts         # List command tests
├── utils/
│   ├── detect.test.ts       # AI detection tests
│   └── copy.test.ts         # File copy tests
└── types.test.ts            # Type definitions tests
```

## Important Notes

### Module Resolution

Tests use ES modules with `.js` extensions in import paths (as per TypeScript ES module spec):

```typescript
// Correct
import { listCommand } from '../../src/commands/list.js';

// Incorrect
import { listCommand } from '../../src/commands/list';
```

Vitest is configured to resolve these correctly via `vitest.config.ts`.

### Test Environment

- All tests run in Node.js environment
- File system operations use temporary directories
- Console methods (warn, error, log) are mocked in relevant tests

### Coverage

Coverage reports are generated in `coverage/` directory with:
- Text output in terminal
- HTML report for browser viewing
- JSON for CI/CD integration

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { yourFunction } from '../../src/utils/yourModule.js';

describe('yourModule', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('yourFunction', () => {
    it('should do something', () => {
      const result = yourFunction();
      expect(result).toBe(expected);
    });
  });
});
```

### Testing Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up temporary files/directories
3. **Mocking**: Mock console methods to avoid test output noise
4. **Descriptive**: Use clear test and assertion descriptions

### Common Test Patterns

#### Testing File Operations

```typescript
const testDir = join(process.cwd(), 'test-temp-xxx');

beforeEach(() => {
  if (existsSync(testDir)) {
    rmdirSync(testDir, { recursive: true });
  }
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmdirSync(testDir, { recursive: true });
  }
});
```

#### Mocking Console

```typescript
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Troubleshooting

### "Cannot find module" Error

Make sure:
1. Import paths use `.js` extension
2. Import paths are relative from test file location
3. `tsconfig.json` includes both `src` and `tests` directories

### "process.exit unexpectedly called"

Don't import the main CLI entry point (`src/index.ts`) in tests as it executes `program.parse()`.

### Tests Pass Locally But Fail in CI

Check:
1. Node.js version matches CI environment
2. All dependencies are installed
3. File permissions for test directories
