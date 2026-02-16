#!/bin/bash
#
# Validate POST endpoint test updates
# This script checks that POST endpoint tests have success-path validation
#

set -e

echo "=== Validating POST Endpoint Tests ==="

COLLECTION_FILE="tests/postman/collections/comprehensive.json"

if [ ! -f "$COLLECTION_FILE" ]; then
    echo "Error: Collection file not found: $COLLECTION_FILE"
    exit 1
fi

echo "✓ Collection file found: $COLLECTION_FILE"

# Use Python to validate the test structure
python3 << 'PYTHON'
import json
import sys

success = True

with open('tests/postman/collections/comprehensive.json', 'r') as f:
    data = json.load(f)

# Find POST Endpoints section
post_section = None
for item in data['item']:
    if item['name'] == 'POST Endpoints':
        post_section = item
        break

if not post_section:
    print("✗ POST Endpoints section not found")
    sys.exit(1)

print(f"✓ POST Endpoints section found with {len(post_section['item'])} tests\n")

# Check each test
required_success_tests = [
    'Create SRC20 Token - Dev',
    'Create SRC20 Token - Prod',
    'Attach Stamp - Dev',
    'Attach Stamp - Prod',
    'Mint Stamp - Dev',
    'Mint Stamp - Prod',
    'Detach Stamp - Success (Dev)',
]

required_error_tests = [
    'Detach Stamp - No Assets (Dev)',
    'Detach Stamp - Insufficient Funds (Dev)',
    'Detach Stamp - No Assets (Prod)',
    'Detach Stamp - Insufficient Funds (Prod)',
]

print("Checking success-path tests:")
for test_name in required_success_tests:
    test = next((t for t in post_section['item'] if t['name'] == test_name), None)
    if not test:
        print(f"  ✗ {test_name} - NOT FOUND")
        success = False
        continue

    # Check for test script
    has_200_check = False
    has_hex_check = False
    has_psbt_validation = False

    for event in test.get('event', []):
        if event.get('listen') == 'test':
            script_lines = event.get('script', {}).get('exec', [])
            script_text = '\n'.join(script_lines)

            has_200_check = '200' in script_text
            has_hex_check = 'hex' in script_text and 'string' in script_text
            has_psbt_validation = 'hex' in script_text and 'match' in script_text

    if has_200_check and has_hex_check and has_psbt_validation:
        print(f"  ✓ {test_name} - Has success-path validation")
    else:
        print(f"  ✗ {test_name} - Missing validation (200:{has_200_check}, hex:{has_hex_check}, psbt:{has_psbt_validation})")
        success = False

print("\nChecking error-path tests:")
for test_name in required_error_tests:
    test = next((t for t in post_section['item'] if t['name'] == test_name), None)
    if not test:
        print(f"  ✗ {test_name} - NOT FOUND")
        success = False
        continue

    # Check for error validation
    has_400_check = False
    has_error_check = False

    for event in test.get('event', []):
        if event.get('listen') == 'test':
            script_lines = event.get('script', {}).get('exec', [])
            script_text = '\n'.join(script_lines)

            has_400_check = '400' in script_text or '404' in script_text
            has_error_check = 'error' in script_text

    if has_400_check and has_error_check:
        print(f"  ✓ {test_name} - Has error-path validation")
    else:
        print(f"  ✗ {test_name} - Missing validation (400:{has_400_check}, error:{has_error_check})")
        success = False

if success:
    print("\n✓ All POST endpoint tests have proper validation")
    sys.exit(0)
else:
    print("\n✗ Some POST endpoint tests are missing validation")
    sys.exit(1)
PYTHON

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "=== Validation Summary ==="
    echo "✓ All POST endpoint tests validated successfully"
    echo "✓ Success-path tests validate PSBT hex data"
    echo "✓ Error-path tests validate error responses"
    echo ""
    echo "Tests are ready for Newman execution"
else
    echo ""
    echo "=== Validation Failed ==="
    echo "Please review the test configuration"
    exit 1
fi
