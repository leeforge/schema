#!/usr/bin/env python3
"""
Full Stack Code Analyzer
Analyzes both backend and frontend code for schema compliance
"""

import json
import os
import sys
from pathlib import Path
from detect_backend import BackendDetector
from detect_frontend import FrontendDetector

def analyze_all(backend_dir: str, frontend_dir: str, schema_path: str, entity: str = None):
    """Analyze both backend and frontend"""

    print("=" * 60)
    print("FULL STACK CODE ANALYSIS")
    print("=" * 60)

    # Load schema
    with open(schema_path, 'r') as f:
        schema = json.load(f)

    entities = [entity] if entity else [k for k in schema.keys() if k not in ['presets', 'features']]

    total_issues = 0
    total_warnings = 0

    for entity_name in entities:
        print(f"\n{'='*60}")
        print(f"ENTITY: {entity_name}")
        print(f"{'='*60}")

        # Backend analysis
        print("\n--- BACKEND ---")
        backend_detector = BackendDetector(backend_dir, schema_path)
        backend_detector.analyze_entity(entity_name)

        # Frontend analysis
        print("\n--- FRONTEND ---")
        frontend_detector = FrontendDetector(frontend_dir, schema_path)
        frontend_detector.analyze_entity(entity_name)

        total_issues += len(backend_detector.issues) + len(frontend_detector.issues)
        total_warnings += len(backend_detector.warnings) + len(frontend_detector.warnings)

    # Final summary
    print(f"\n{'='*60}")
    print("FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"Total Errors: {total_issues}")
    print(f"Total Warnings: {total_warnings}")

    if total_issues > 0:
        print("\n❌ Code quality checks FAILED")
        sys.exit(1)
    elif total_warnings > 0:
        print("\n⚠️  Code quality checks PASSED with warnings")
        sys.exit(0)
    else:
        print("\n✅ Code quality checks PASSED")
        sys.exit(0)

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Full stack code analyzer')
    parser.add_argument('backend_dir', help='Backend directory path')
    parser.add_argument('frontend_dir', help='Frontend directory path')
    parser.add_argument('--schema', required=True, help='Schema file path')
    parser.add_argument('--entity', help='Specific entity to analyze')

    args = parser.parse_args()

    analyze_all(args.backend_dir, args.frontend_dir, args.schema, args.entity)

if __name__ == '__main__':
    main()
