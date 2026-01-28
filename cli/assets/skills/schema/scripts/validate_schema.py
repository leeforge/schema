import argparse
import json
import os
import sys
import urllib.request
from typing import Dict, Any

def load_json(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_schema(schema_path: str, master_schema_path: str = None):
    """
    Validate a schema file against the Leeforge master schema.
    """
    try:
        # Load the schema to be validated
        if not os.path.exists(schema_path):
            print(f"❌ Error: Schema file not found: {schema_path}")
            return False

        instance = load_json(schema_path)

        # Determine master schema path
        if master_schema_path is None:
            # Try to find schema.json in project root
            # Script is in skills/schema/scripts/
            # Root is ../../../
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.abspath(os.path.join(script_dir, '../../../'))
            default_master = os.path.join(project_root, 'schema.json')

            if os.path.exists(default_master):
                master_schema_path = default_master
            else:
                # Fallback to remote if local not found
                print("⚠️  Local master schema.json not found, using remote...")
                master_schema_path = "https://raw.githubusercontent.com/leeforge/schema/main/schema.json"

        # Load master schema
        if master_schema_path.startswith('http'):
            with urllib.request.urlopen(master_schema_path) as url:
                schema = json.loads(url.read().decode())
        else:
            schema = load_json(master_schema_path)

        # Try to import jsonschema for strict validation
        try:
            from jsonschema import validate
            from jsonschema.exceptions import ValidationError

            validate(instance=instance, schema=schema)
            print(f"✅ Schema '{schema_path}' is valid!")
            return True

        except ImportError:
            print("⚠️  'jsonschema' library not found. Performing basic validation...")
            # Basic validation fallback
            if "name" not in instance:
                print("❌ Error: Missing required field 'name'")
                return False
            if "properties" not in instance:
                print("❌ Error: Missing required field 'properties'")
                return False
            print(f"✅ Schema '{schema_path}' appears valid (basic check). Install 'jsonschema' for full validation.")
            return True

        except ValidationError as e:
            print(f"❌ Validation Error: {e.message}")
            if e.path:
                print(f"   at path: {' -> '.join(str(p) for p in e.path)}")
            return False

    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a Leeforge entity schema")
    parser.add_argument("path", help="Path to the schema file to validate")
    parser.add_argument("--master", help="Path or URL to the master schema.json", default=None)

    args = parser.parse_args()

    success = validate_schema(args.path, args.master)
    sys.exit(0 if success else 1)
