#!/usr/bin/env node

/**
 * Test verification script
 * Checks if all test files have correct import paths
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testsDir = join(__dirname, '..', 'tests');

function getAllTestFiles(dir) {
  const files = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllTestFiles(fullPath));
    } else if (extname(item) === '.ts' && item.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkImportPaths(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const importRegex = /from ['"](.+)['"]/g;
  const issues = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Check if it's a relative import to src
    if (importPath.startsWith('../') || importPath.startsWith('../../')) {
      if (importPath.includes('/src/')) {
        // Should end with .js
        if (!importPath.endsWith('.js')) {
          issues.push({
            line: content.substring(0, match.index).split('\n').length,
            path: importPath,
            suggestion: importPath + '.js',
          });
        }
      }
    }
  }

  return issues;
}

console.log('🔍 Checking test files for correct import paths...\n');

const testFiles = getAllTestFiles(testsDir);
let hasIssues = false;

for (const file of testFiles) {
  const relativePath = file.replace(testsDir + '/', '');
  const issues = checkImportPaths(file);

  if (issues.length > 0) {
    hasIssues = true;
    console.log(`❌ ${relativePath}`);
    for (const issue of issues) {
      console.log(`   Line ${issue.line}: ${issue.path}`);
      console.log(`   Should be: ${issue.suggestion}\n`);
    }
  } else {
    console.log(`✅ ${relativePath}`);
  }
}

if (!hasIssues) {
  console.log('\n✨ All test files have correct import paths!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some test files have incorrect import paths.');
  process.exit(1);
}
