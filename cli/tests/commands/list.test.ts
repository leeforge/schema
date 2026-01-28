import { describe, it, expect } from 'vitest';
import { listCommand } from '../../src/commands/list.js';

describe('list command', () => {
  it('should run without errors', async () => {
    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    await listCommand();

    // Restore console.log
    console.log = originalLog;

    // Check that output was generated
    expect(logs.length).toBeGreaterThan(0);

    // Check for expected content
    const output = logs.join('\n');
    expect(output).toContain('Skills');
    expect(output).toContain('Rules');
    expect(output).toContain('schema');
    expect(output).toContain('schema-rules');
  });
});
