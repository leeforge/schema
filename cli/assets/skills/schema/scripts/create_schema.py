import argparse
import json
import os
import sys

def create_schema(name: str, output_path: str):
    """
    Create a new schema file from the template.
    """
    try:
        # Determine paths
        script_dir = os.path.dirname(os.path.abspath(__file__))
        template_path = os.path.join(script_dir, '../assets/templates/entity.json')

        if not os.path.exists(template_path):
            print(f"❌ Error: Template not found at {template_path}")
            return False

        # Load template
        with open(template_path, 'r', encoding='utf-8') as f:
            template = json.load(f)

        # Customize
        template['name'] = name
        template['description'] = f"Schema definition for {name}"

        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Write file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(template, f, indent=2, ensure_ascii=False)

        print(f"✅ Schema created successfully at: {output_path}")
        print(f"   Entity Name: {name}")
        return True

    except Exception as e:
        print(f"❌ Error creating schema: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new Leeforge entity schema")
    parser.add_argument("--name", required=True, help="Name of the entity (PascalCase)")
    parser.add_argument("--output", required=True, help="Output path for the JSON file")

    args = parser.parse_args()

    success = create_schema(args.name, args.output)
    sys.exit(0 if success else 1)
