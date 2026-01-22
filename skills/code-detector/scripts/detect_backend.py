#!/usr/bin/env python3
"""
Backend Code Detector
Analyzes Go backend code for schema compliance
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

class BackendDetector:
    def __init__(self, backend_dir: str, schema_path: str):
        self.backend_dir = Path(backend_dir)
        self.schema = self._load_schema(schema_path)
        self.issues = []
        self.warnings = []

    def _load_schema(self, path: str) -> Dict:
        with open(path, 'r') as f:
            return json.load(f)

    def analyze_entity(self, entity_name: str):
        """Analyze all components for an entity"""
        print(f"\n=== Analyzing {entity_name} ===")

        self._check_dto(entity_name)
        self._check_service(entity_name)
        self._check_controller(entity_name)
        self._check_module(entity_name)
        self._check_schema(entity_name)

        self._print_results()

    def _check_dto(self, entity: str):
        """Check DTO file"""
        dto_file = self.backend_dir / entity.lower() / "dto.go"
        if not dto_file.exists():
            self.issues.append(f"❌ DTO file missing: {dto_file}")
            return

        content = dto_file.read_text()
        properties = self.schema.get(entity, {}).get('properties', {})

        # Check CreateDTO
        for prop_name, prop_def in properties.items():
            if prop_def.get('validate', {}).get('required'):
                # Check if field exists in CreateDTO
                pattern = rf'{self._to_pascal_case(prop_name)}\s+[\w\*]+'
                if not re.search(pattern, content):
                    self.issues.append(f"❌ {entity} DTO: Missing required field '{prop_name}'")

        # Check validation tags
        for prop_name, prop_def in properties.items():
            validations = prop_def.get('validate', {})
            if 'email' in validations or prop_name.lower() == 'email':
                if 'validate:"email"' not in content:
                    self.warnings.append(f"⚠️  {entity} DTO: Missing email validation for '{prop_name}'")

        # Check password hashing
        if any('password' in k.lower() for k in properties.keys()):
            if 'Sensitive()' not in content:
                self.warnings.append(f"⚠️  {entity} DTO: Password field should be marked sensitive")

    def _check_service(self, entity: str):
        """Check Service implementation"""
        service_file = self.backend_dir / entity.lower() / "service.go"
        if not service_file.exists():
            self.issues.append(f"❌ Service file missing: {service_file}")
            return

        content = service_file.read_text()
        properties = self.schema.get(entity, {}).get('properties', {})

        # Check password hashing
        if any('password' in k.lower() for k in properties.keys()):
            if 'bcrypt.GenerateFromPassword' not in content:
                self.issues.append(f"❌ {entity} Service: Missing password hashing")

        # Check optional field handling
        for prop_name, prop_def in properties.items():
            if not prop_def.get('validate', {}).get('required'):
                # Should check before setting
                pattern = rf'Set{self._to_pascal_case prop_name)}\(dto\.{self._to_pascal_case(prop_name)}\)'
                if re.search(pattern, content):
                    # Check if there's a condition
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if pattern in line:
                            # Check previous line for condition
                            if i > 0 and 'if' not in lines[i-1]:
                                self.warnings.append(f"⚠️  {entity} Service: Optional field '{prop_name}' should be checked before setting")

        # Check relationships
        for prop_name, prop_def in properties.items():
            if '$ref' in prop_def:
                rel_type = prop_def.get('x-relation', {}).get('type', '')
                if rel_type == 'many2One':
                    if f'Set{self._to_pascal_case(prop_name)}ID' not in content:
                        self.warnings.append(f"⚠️  {entity} Service: Missing relationship handling for '{prop_name}'")
                elif rel_type == 'many2Many':
                    if f'Add{self._to_pascal_case(prop_name)}IDs' not in content:
                        self.warnings.append(f"⚠️  {entity} Service: Missing many2many relationship for '{prop_name}'")

    def _check_controller(self, entity: str):
        """Check Controller implementation"""
        controller_file = self.backend_dir / entity.lower() / "controller.go"
        if not controller_file.exists():
            self.issues.append(f"❌ Controller file missing: {controller_file}")
            return

        content = controller_file.read_text()

        # Check error handling
        if 'res.WriteError' not in content:
            self.warnings.append(f"⚠️  {entity} Controller: Missing proper error handling")

        # Check JSON binding
        if 'binding.JSON' not in content:
            self.issues.append(f"❌ {entity} Controller: Missing JSON binding validation")

        # Check CRUD endpoints
        required_endpoints = ['Create', 'Get', 'Update', 'Delete', 'List']
        for endpoint in required_endpoints:
            if f'func (c *Controller) {endpoint}' not in content:
                self.warnings.append(f"⚠️  {entity} Controller: Missing {endpoint} endpoint")

    def _check_module(self, entity: str):
        """Check Module file"""
        module_file = self.backend_dir / entity.lower() / "module.go"
        if not module_file.exists():
            self.warnings.append(f"⚠️  {entity} Module: File missing (optional)")
            return

        content = module_file.read_text()

        # Check route registration
        if 'r.Route' not in content:
            self.warnings.append(f"⚠️  {entity} Module: Missing route registration")

    def _check_schema(self, entity: str):
        """Check Ent schema file"""
        schema_file = self.backend_dir / entity.lower() / "schema.go"
        if not schema_file.exists():
            self.warnings.append(f"⚠️  {entity} Schema: File missing (optional)")
            return

        content = schema_file.read_text()
        properties = self.schema.get(entity, {}).get('properties', {})

        # Check field definitions
        for prop_name, prop_def in properties.items():
            field_type = prop_def.get('type')
            if field_type:
                expected = self._map_to_ent_type(field_type)
                if expected and expected not in content:
                    self.warnings.append(f"⚠️  {entity} Schema: Field '{prop_name}' type mismatch")

        # Check soft delete
        if self.schema.get(entity, {}).get('softDelete'):
            if 'deleted_at' not in content:
                self.warnings.append(f"⚠️  {entity} Schema: Missing soft delete field")

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

    def _to_pascal_case(self, name: str) -> str:
        """Convert field name to PascalCase"""
        return ''.join(word.capitalize() for word in name.split('_'))

    def _map_to_ent_type(self, field_type: str) -> str:
        """Map schema type to Ent type"""
        mapping = {
            'string': 'field.String',
            'text': 'field.Text',
            'integer': 'field.Int',
            'number': 'field.Float',
            'boolean': 'field.Bool',
            'enum': 'field.Enum',
            'datetime': 'field.Time',
            'password': 'field.String',
            'uid': 'field.String',
            'version': 'field.Int',
            'json': 'field.JSON',
        }
        return mapping.get(field_type, '')

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Detect backend code issues')
    parser.add_argument('backend_dir', help='Backend directory path')
    parser.add_argument('--schema', required=True, help='Schema file path')
    parser.add_argument('--entity', help='Specific entity to analyze')

    args = parser.parse_args()

    detector = BackendDetector(args.backend_dir, args.schema)

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
