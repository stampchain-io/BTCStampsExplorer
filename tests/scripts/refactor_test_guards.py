#!/usr/bin/env python3
"""
Script to refactor Postman test guard patterns from conditional to hard assertions.

This script processes comprehensive.json and removes defensive "if (json.data && ...)"
guard patterns, replacing them with unconditional hard assertions that expect valid
data in all responses.

Pattern transformations:
1. if (json.data && Array.isArray(json.data) && json.data.length > 0) { ... }
   => pm.expect(json.data).to.be.an('array').that.is.not.empty; ...

2. if (json.data && json.data.length > 0) { ... }
   => pm.expect(json.data).to.be.an('array').that.is.not.empty; ...

3. if (json.data && Array.isArray(json.data) && json.pagination?.limit) { ... }
   => pm.expect(json.data).to.be.an('array'); pm.expect(json.pagination).to.exist; ...

4. if (json.data && Array.isArray(json.data) && json.pagination && json.pagination.limit) { ... }
   => pm.expect(json.data).to.be.an('array'); pm.expect(json.pagination).to.exist; ...
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Any


class GuardPatternRefactor:
    """Refactors Postman test guard patterns to hard assertions."""

    def __init__(self, collection_path: Path):
        """Initialize refactor with path to Postman collection."""
        self.collection_path = collection_path
        self.changes_made = 0

    def load_collection(self) -> Dict[str, Any]:
        """Load the Postman collection JSON."""
        with open(self.collection_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def save_collection(self, collection: Dict[str, Any], backup: bool = True) -> None:
        """Save the modified collection, optionally creating a backup."""
        if backup:
            backup_path = self.collection_path.with_suffix('.json.backup')
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(collection, f, indent=2, ensure_ascii=False)
            print(f"✓ Backup saved to: {backup_path}")

        with open(self.collection_path, 'w', encoding='utf-8') as f:
            json.dump(collection, f, indent=2, ensure_ascii=False)
        print(f"✓ Collection updated: {self.collection_path}")

    def find_matching_brace(self, lines: List[str], start_line_idx: int) -> int:
        """
        Find the line index of the closing brace that matches the opening brace
        at the end of start_line_idx.

        Args:
            lines: List of code lines
            start_line_idx: Index of line containing the opening brace

        Returns:
            Index of line containing the matching closing brace, or -1 if not found
        """
        brace_count = 1
        for i in range(start_line_idx + 1, len(lines)):
            line = lines[i]
            # Count braces in this line
            brace_count += line.count('{')
            brace_count -= line.count('}')

            if brace_count == 0:
                return i

        return -1

    def refactor_test_script(self, script_lines: List[str]) -> List[str]:
        """
        Refactor a single test script from guard patterns to hard assertions.

        Args:
            script_lines: List of script line strings

        Returns:
            Modified list of script lines
        """
        modified_lines = script_lines.copy()
        lines_to_remove = set()
        replacements = {}  # line_idx -> new_line_content

        i = 0
        while i < len(modified_lines):
            line = modified_lines[i]

            # Pattern 1: Full guard with Array.isArray and length check
            match = re.match(r'^(\s+)if \(json\.data && Array\.isArray\(json\.data\) && json\.data\.length > 0\) \{$', line)
            if match:
                indent = match.group(1)
                closing_brace_idx = self.find_matching_brace(modified_lines, i)

                if closing_brace_idx != -1:
                    # Replace guard line with hard assertion
                    replacements[i] = f"{indent}pm.expect(json.data).to.be.an('array').that.is.not.empty;"

                    # Remove the closing brace line if it's just whitespace + }
                    if modified_lines[closing_brace_idx].strip() == '}':
                        lines_to_remove.add(closing_brace_idx)

                    # Un-indent the guarded code
                    for j in range(i + 1, closing_brace_idx):
                        # Remove 2 spaces of indentation (the if block's indent)
                        if modified_lines[j].startswith('  '):
                            modified_lines[j] = modified_lines[j][2:]

                    self.changes_made += 1
                i += 1
                continue

            # Pattern 2: Simple guard with length check only
            match = re.match(r'^(\s+)if \(json\.data && json\.data\.length > 0\) \{$', line)
            if match:
                indent = match.group(1)
                closing_brace_idx = self.find_matching_brace(modified_lines, i)

                if closing_brace_idx != -1:
                    # Replace guard line with hard assertion
                    replacements[i] = f"{indent}pm.expect(json.data).to.be.an('array').that.is.not.empty;"

                    # Remove the closing brace line if it's just whitespace + }
                    if modified_lines[closing_brace_idx].strip() == '}':
                        lines_to_remove.add(closing_brace_idx)

                    # Un-indent the guarded code
                    for j in range(i + 1, closing_brace_idx):
                        # Remove 2 spaces of indentation
                        if modified_lines[j].startswith('  '):
                            modified_lines[j] = modified_lines[j][2:]

                    self.changes_made += 1
                i += 1
                continue

            # Pattern 3: Guard with pagination check (optional chaining)
            match = re.match(r'^(\s+)if \(json\.data && Array\.isArray\(json\.data\) && json\.pagination\?\.limit\) \{$', line)
            if match:
                indent = match.group(1)
                closing_brace_idx = self.find_matching_brace(modified_lines, i)

                if closing_brace_idx != -1:
                    # Replace guard line with hard assertions
                    new_assertions = [
                        f"{indent}pm.expect(json.data).to.be.an('array');",
                        f"{indent}pm.expect(json.pagination).to.exist;",
                        f"{indent}pm.expect(json.pagination.limit).to.exist;"
                    ]
                    replacements[i] = '\n'.join(new_assertions)

                    # Remove the closing brace line if it's just whitespace + }
                    if modified_lines[closing_brace_idx].strip() == '}':
                        lines_to_remove.add(closing_brace_idx)

                    # Un-indent the guarded code
                    for j in range(i + 1, closing_brace_idx):
                        # Remove 2 spaces of indentation
                        if modified_lines[j].startswith('  '):
                            modified_lines[j] = modified_lines[j][2:]

                    self.changes_made += 1
                i += 1
                continue

            # Pattern 4: Guard with pagination check (non-optional chaining)
            match = re.match(r'^(\s+)if \(json\.data && Array\.isArray\(json\.data\) && json\.pagination && json\.pagination\.limit\) \{$', line)
            if match:
                indent = match.group(1)
                closing_brace_idx = self.find_matching_brace(modified_lines, i)

                if closing_brace_idx != -1:
                    # Replace guard line with hard assertions
                    new_assertions = [
                        f"{indent}pm.expect(json.data).to.be.an('array');",
                        f"{indent}pm.expect(json.pagination).to.exist;",
                        f"{indent}pm.expect(json.pagination.limit).to.exist;"
                    ]
                    replacements[i] = '\n'.join(new_assertions)

                    # Remove the closing brace line if it's just whitespace + }
                    if modified_lines[closing_brace_idx].strip() == '}':
                        lines_to_remove.add(closing_brace_idx)

                    # Un-indent the guarded code
                    for j in range(i + 1, closing_brace_idx):
                        # Remove 2 spaces of indentation
                        if modified_lines[j].startswith('  '):
                            modified_lines[j] = modified_lines[j][2:]

                    self.changes_made += 1
                i += 1
                continue

            i += 1

        # Apply replacements
        for line_idx, new_content in replacements.items():
            if '\n' in new_content:
                # Multi-line replacement, split it
                modified_lines[line_idx] = new_content
            else:
                modified_lines[line_idx] = new_content

        # Remove marked lines (in reverse order to preserve indices)
        for line_idx in sorted(lines_to_remove, reverse=True):
            modified_lines.pop(line_idx)

        # Handle multi-line replacements by splitting them
        final_lines = []
        for line in modified_lines:
            if '\n' in line:
                final_lines.extend(line.split('\n'))
            else:
                final_lines.append(line)

        return final_lines

    def process_item(self, item: Dict[str, Any]) -> None:
        """
        Recursively process collection items to find and refactor test scripts.

        Args:
            item: Collection item (folder or request)
        """
        # Process events (test scripts)
        if 'event' in item:
            for event in item['event']:
                if event.get('listen') == 'test' and 'script' in event:
                    script = event['script']
                    if 'exec' in script and isinstance(script['exec'], list):
                        original_lines = script['exec']
                        refactored_lines = self.refactor_test_script(original_lines)
                        script['exec'] = refactored_lines

        # Recursively process nested items
        if 'item' in item:
            for sub_item in item['item']:
                self.process_item(sub_item)

    def run(self) -> int:
        """
        Execute the refactoring process.

        Returns:
            Number of changes made
        """
        print(f"Loading collection: {self.collection_path}")
        collection = self.load_collection()

        print("Refactoring test guard patterns...")

        # Process all items in the collection
        if 'item' in collection:
            for item in collection['item']:
                self.process_item(item)

        if self.changes_made > 0:
            print(f"\n✓ Refactored {self.changes_made} guard patterns")
            self.save_collection(collection, backup=True)
        else:
            print("\nℹ No guard patterns found to refactor")

        return self.changes_made


def main():
    """Main entry point."""
    # Default path to comprehensive.json
    default_path = Path(__file__).parent.parent / 'postman' / 'collections' / 'comprehensive.json'

    # Allow override via command line
    collection_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_path

    if not collection_path.exists():
        print(f"Error: Collection file not found: {collection_path}", file=sys.stderr)
        sys.exit(1)

    print("=" * 70)
    print("Postman Test Guard Pattern Refactor")
    print("=" * 70)

    refactor = GuardPatternRefactor(collection_path)
    changes = refactor.run()

    print("\n" + "=" * 70)
    print(f"Refactoring complete: {changes} changes made")
    print("=" * 70)

    if changes > 0:
        print("\nNext steps:")
        print("1. Review the changes manually")
        print("2. Run Newman tests to verify no regressions")
        print(f"3. If issues arise, restore from: {collection_path.with_suffix('.json.backup')}")

    return 0 if changes >= 0 else 1


if __name__ == '__main__':
    sys.exit(main())
