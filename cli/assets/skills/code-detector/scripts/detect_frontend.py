#!/usr/bin/env python3
"""
Frontend Code Detector
Analyzes TypeScript/React frontend code for schema compliance
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

class FrontendDetector:
    def __init__(self, frontend_dir: str, schema_path: str):
        self.frontend_dir = Path(frontend_dir)
        self.schema = self._load_schema(schema_path)
        self.issues = []
        self.warnings = []

    def _load_schema(self, path: str) -> Dict:
        with open(path, 'r') as f:
            return json.load(f)

    def analyze_entity(self, entity_name: str):
        """Analyze all frontend components for an entity"""
        print(f"\n=== Analyzing {entity_name} ===")

        self._check_types(entity_name)
        self._check_api(entity_name)
        self._check_form(entity_name)
        self._check_table(entity_name)

        self._print_results()

    def _check_types(self, entity: str):
        """Check TypeScript type definitions"""
        types_file = self.frontend_dir / 'types' / f"{entity.lower()}.ts"
        if not types_file.exists():
            self.issues.append(f"❌ Types file missing: {types_file}")
            return

        content = types_file.read_text()
        properties = self.schema.get(entity, {}).get('properties', {})

        # Check all fields are present
        for prop_name, prop_def in properties.items():
            ts_type = self._map_to_ts_type(prop_def.get('type'))
            if ts_type:
                # Check if field exists
                pattern = rf'{self._to_camel_case(prop_name)}\s*[?:]?\s*{ts_type}'
                if not re.search(pattern, content):
                    self.issues.append(f"❌ {entity} Types: Missing field '{prop_name}'")

        # Check enum types
        for prop_name, prop_def in properties.items():
            if prop_def.get('type') == 'enum':
                enum_values = prop_def.get('validate', {}).get('enum', [])
                if enum_values:
                    # Check if enum is defined
                    enum_pattern = rf'enum {self._to_pascal_case(prop_name)}'
                    if not re.search(enum_pattern, content):
                        self.warnings.append(f"⚠️  {entity} Types: Missing enum definition for '{prop_name}'")

    def _check_api(self, entity: str):
        """Check API client"""
        api_file = self.frontend_dir / 'lib' / 'api' / f"{entity.lower()}.ts"
        if not api_file.exists():
            self.issues.append(f"❌ API file missing: {api_file}")
            return

        content = api_file.read_text()

        # Check CRUD methods
        required_methods = ['create', 'get', 'update', 'delete', 'list']
        for method in required_methods:
            if f'{method}' not in content:
                self.warnings.append(f"⚠️  {entity} API: Missing {method} method")

        # Check error handling
        if 'try' not in content or 'catch' not in content:
            self.warnings.append(f"⚠️  {entity} API: Missing error handling")

        # Check response types
        if 'Promise' not in content:
            self.warnings.append(f"⚠️  {entity} API: Missing Promise return types")

    def _check_form(self, entity: str):
        """Check Form component"""
        form_file = self.frontend_dir / 'components' / f"{self._to_pascal_case(entity)}Form.tsx"
        if not form_file.exists():
            self.warnings.append(f"⚠️  {entity} Form: Component missing (optional)")
            return

        content = form_file.read_text()
        properties = self.schema.get(entity, {}).get('properties', {})

        # Check Zod schema
        if 'z.object' not in content:
            self.issues.append(f"❌ {entity} Form: Missing Zod schema")

        # Check all fields rendered
        for prop_name, prop_def in properties.items():
            if prop_def.get('validate', {}).get('required'):
                # Should be in form
                if prop_name.lower() not in content.lower():
                    self.warnings.append(f"⚠️  {entity} Form: Missing field '{prop_name}'")

        # Check validation integration
        if 'useForm' not in content:
            self.warnings.append(f"⚠️  {entity} Form: Missing React Hook Form integration")

        # Check error display
        if 'error' not in content:
            self.warnings.append(f"⚠️  {entity} Form: Missing error display")

    def _check_table(self, entity: str):
        """Check Table component"""
        table_file = self.frontend_dir / 'components' / f"{self._to_pascal_case(entity)}Table.tsx"
        if not table_file.exists():
            self.warnings.append(f"⚠️  {entity} Table: Component missing (optional)")
            return

        content = table_file.read_text()
        properties = self.schema.get(entity, {}).get('properties', {})

        # Check column definitions
        for prop_name in properties.keys():
            if prop_name.lower() not in content.lower():
                self.warnings.append(f"⚠️  {entity} Table: Missing column '{prop_name}'")

        # Check loading state
        if 'loading' not in content:
            self.warnings.append(f"⚠️  {entity} Table: Missing loading state")

        # Check empty state
        if 'empty' not in content.lower():
            self.warnings.append(f"⚠️  {entity} Table: Missing empty state")

        # Check pagination
        if 'pagination' not in content.lower():
            self.warnings.append(f"⚠️  {entity} Table: Missing pagination")

    def _print_results(self):
        """Print analysis results"""
        if self.issues:
            print("\n❌ Issues Found:")
            for issue in self.issues:
                print(f"  {issue}")

        if self.warnings:
            print("\n⚠️  Warnings:")
            for warning in self.warnings:
                print(f"  {warning}")

        if not self.issues and not self.warnings:
            print("\n✅ All checks passed!")

        # Summary
        print(f"\nSummary: {len(self.issues)} errors, {len(self.warnings)} warnings")

    def _to_camel_case(self, name: str) -> str:
        """Convert field name to camelCase"""
        words = name.split('_')
        return words[0] + ''.join(word.capitalize() for word in words[1:])

    def _to_pascal_case(self, name: str) -> str:
        """Convert field name to PascalCase"""
        return ''.join(word.capitalize() for word in name.split('_'))

    def _map_to_ts_type(self, field_type: str) -> str:
        """Map schema type to TypeScript type"""
        mapping = {
            'string': 'string',
            'text': 'string',
            'integer': 'number',
            'number': 'number',
            'boolean': 'boolean',
            'enum': 'string',
            'datetime': 'Date',
            'password': 'string',
            'uid': 'string',
            'version': 'number',
            'json': 'any',
        }
        return mapping.get(field_type, '')

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Detect frontend code issues')
    parser.add_argument('frontend_dir', help='Frontend directory path')
    parser.add_argument('--schema', required=True, help='Schema file path')
    parser.add_argument('--entity', help='Specific entity to analyze')

    args = parser.parse_args()

    detector = FrontendDetector(args.frontend_dir, args.schema)

    if args.entity:
        detector.analyze_entity(args.entity)
    else:
        # Analyze all entities
        schema = detector.schema
        for entity_name in schema.keys():
            if entity_name not in ['presets', 'features']:
                detector.analyze_entity(entity_name)
                detector.issues = []
                detector.warnings = []

if __name__ == '__main__':
    main()
