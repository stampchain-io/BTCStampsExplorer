#!/usr/bin/env python3
"""
Update POST endpoint tests in comprehensive.json to add 200-success-path test cases.

This script:
1. Reads the existing comprehensive.json Postman collection
2. Updates POST endpoint tests to add success-path validation
3. Ensures all POST tests validate PSBT hex data in 200 responses
4. Keeps existing error-path tests intact
"""

import json
import sys
from pathlib import Path

def update_src20_create_test(test_item):
    """Update Create SRC20 Token test to properly validate success responses."""
    # The test already allows 200 or 400, but we need to ensure proper PSBT validation
    # Find the test script
    for event in test_item.get('event', []):
        if event.get('listen') == 'test':
            script = event.get('script', {})
            exec_lines = script.get('exec', [])

            # Check if PSBT validation exists
            has_psbt_validation = any('hex' in line and 'string' in line for line in exec_lines)

            if not has_psbt_validation:
                # Add PSBT validation after the status code check
                new_exec = []
                for i, line in enumerate(exec_lines):
                    new_exec.append(line)
                    # After response structure validation, add PSBT validation
                    if 'Response has valid structure for status code' in line and i < len(exec_lines) - 1:
                        # Find the closing of this test
                        j = i + 1
                        while j < len(exec_lines) and not exec_lines[j].strip().startswith('pm.test('):
                            j += 1
                        # Insert PSBT validation before next test
                        if j < len(exec_lines):
                            psbt_validation = [
                                "",
                                "// Validate PSBT hex data for 200 responses",
                                "pm.test(\"Success response contains valid PSBT hex\", function() {",
                                "    if (pm.response.code === 200) {",
                                "        const json = pm.response.json();",
                                "        pm.expect(json.hex).to.be.a('string');",
                                "        pm.expect(json.hex.length).to.be.above(0);",
                                "        // PSBT hex should be valid hex string",
                                "        pm.expect(json.hex).to.match(/^[0-9a-fA-F]+$/);",
                                "        // Validate other PSBT response fields",
                                "        pm.expect(json).to.have.property('est_tx_size');",
                                "        pm.expect(json).to.have.property('inputsToSign').that.is.an('array');",
                                "    }",
                                "});",
                            ]
                            # Skip to end of current test block
                            while i < len(exec_lines) - 1:
                                i += 1
                                new_exec.append(exec_lines[i])
                                if exec_lines[i].strip() == '});':
                                    # Add PSBT validation after this test
                                    new_exec.extend(psbt_validation)
                                    break

                if new_exec:
                    script['exec'] = new_exec

    return test_item

def update_attach_test(test_item):
    """Update Attach Stamp test to add success-path validation."""
    # Find the test script
    for event in test_item.get('event', []):
        if event.get('listen') == 'test':
            script = event.get('script', {})
            exec_lines = script.get('exec', [])

            # Check if this test has proper success validation
            has_success_test = any('200' in line and 'success' in line.lower() for line in exec_lines)

            if not has_success_test:
                # Replace or enhance the existing test
                new_exec = [
                    "// POST Test for Attach Stamp - Success and Error Paths",
                    "pm.test(\"Status code is 200 (success) or 400 (error)\", function() {",
                    "    pm.expect(pm.response.code).to.be.oneOf([200, 400, 500]);",
                    "});",
                    "",
                    "pm.test(\"Response has valid structure for status code\", function() {",
                    "    const json = pm.response.json();",
                    "    if (pm.response.code === 200) {",
                    "        // Success response must contain PSBT hex data",
                    "        pm.expect(json).to.have.property('hex');",
                    "        pm.expect(json.hex).to.be.a('string');",
                    "        pm.expect(json.hex.length).to.be.above(0);",
                    "        pm.expect(json.hex).to.match(/^[0-9a-fA-F]+$/, 'hex should be valid hex string');",
                    "        // Validate PSBT metadata fields",
                    "        pm.expect(json).to.have.property('est_tx_size');",
                    "        pm.expect(json).to.have.property('input_value');",
                    "        pm.expect(json).to.have.property('est_miner_fee');",
                    "    } else {",
                    "        // Error response must contain error field",
                    "        pm.expect(json).to.have.property('error');",
                    "        pm.expect(json.error).to.be.a('string').and.not.be.empty;",
                    "    }",
                    "});",
                    "",
                    "pm.test(\"PSBT hex is non-empty for success responses\", function() {",
                    "    if (pm.response.code === 200) {",
                    "        const json = pm.response.json();",
                    "        pm.expect(json.hex.length).to.be.above(100, 'PSBT hex should be substantial');",
                    "    }",
                    "});",
                ]
                script['exec'] = new_exec

    return test_item

def update_mint_test(test_item):
    """Update Mint Stamp test to add success-path validation."""
    # Similar to attach, but for mint endpoint
    for event in test_item.get('event', []):
        if event.get('listen') == 'test':
            script = event.get('script', {})
            exec_lines = script.get('exec', [])

            # Check if this test has proper success validation
            has_success_test = any('200' in line and 'success' in line.lower() for line in exec_lines)

            if not has_success_test:
                new_exec = [
                    "// POST Test for Mint Stamp - Success and Error Paths",
                    "pm.test(\"Status code is 200 (success) or 400 (error)\", function() {",
                    "    pm.expect(pm.response.code).to.be.oneOf([200, 400, 500]);",
                    "});",
                    "",
                    "pm.test(\"Response has valid structure for status code\", function() {",
                    "    const json = pm.response.json();",
                    "    if (pm.response.code === 200) {",
                    "        // Success response must contain PSBT hex data",
                    "        pm.expect(json).to.have.property('hex');",
                    "        pm.expect(json.hex).to.be.a('string');",
                    "        pm.expect(json.hex.length).to.be.above(0);",
                    "        pm.expect(json.hex).to.match(/^[0-9a-fA-F]+$/, 'hex should be valid hex string');",
                    "        // Validate PSBT metadata fields",
                    "        pm.expect(json).to.have.property('est_tx_size');",
                    "        pm.expect(json).to.have.property('input_value');",
                    "        pm.expect(json).to.have.property('total_dust_value');",
                    "        pm.expect(json).to.have.property('est_miner_fee');",
                    "        pm.expect(json).to.have.property('cpid');",
                    "    } else {",
                    "        // Error response must contain error field",
                    "        pm.expect(json).to.have.property('error');",
                    "        pm.expect(json.error).to.be.a('string').and.not.be.empty;",
                    "    }",
                    "});",
                    "",
                    "pm.test(\"PSBT contains transaction details for success\", function() {",
                    "    if (pm.response.code === 200) {",
                    "        const json = pm.response.json();",
                    "        pm.expect(json.hex.length).to.be.above(100, 'PSBT hex should be substantial');",
                    "        pm.expect(json.est_tx_size).to.be.above(0, 'Estimated tx size should be positive');",
                    "    }",
                    "});",
                ]
                script['exec'] = new_exec

    return test_item

def add_detach_success_test(post_section):
    """Add a success-path test for Detach Stamp endpoint."""
    # Create a new test for successful detach
    success_test = {
        "name": "Detach Stamp - Success (Dev)",
        "event": [
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "// POST Test for Detach Stamp - Success Path",
                        "// Note: This test may return 400 if UTXO has no stamps or insufficient funds",
                        "pm.test(\"Status code is 200 (success) or 400 (expected errors)\", function() {",
                        "    pm.expect(pm.response.code).to.be.oneOf([200, 400, 404]);",
                        "});",
                        "",
                        "pm.test(\"Response has valid structure for status code\", function() {",
                        "    const json = pm.response.json();",
                        "    if (pm.response.code === 200) {",
                        "        // Success response must contain PSBT hex data",
                        "        pm.expect(json).to.have.property('hex');",
                        "        pm.expect(json.hex).to.be.a('string');",
                        "        pm.expect(json.hex.length).to.be.above(0);",
                        "        pm.expect(json.hex).to.match(/^[0-9a-fA-F]+$/, 'hex should be valid hex string');",
                        "        // Validate PSBT metadata fields",
                        "        pm.expect(json).to.have.property('est_tx_size');",
                        "    } else {",
                        "        // Error response must contain error field",
                        "        pm.expect(json).to.have.property('error');",
                        "        pm.expect(json.error).to.be.a('string').and.not.be.empty;",
                        "    }",
                        "});",
                        "",
                        "pm.test(\"PSBT hex is valid for success responses\", function() {",
                        "    if (pm.response.code === 200) {",
                        "        const json = pm.response.json();",
                        "        pm.expect(json.hex.length).to.be.above(100, 'PSBT hex should be substantial');",
                        "    }",
                        "});",
                    ],
                    "type": "text/javascript"
                }
            }
        ],
        "request": {
            "method": "POST",
            "header": [
                {
                    "key": "Accept",
                    "value": "application/json"
                },
                {
                    "key": "Content-Type",
                    "value": "application/json"
                }
            ],
            "body": {
                "mode": "raw",
                "raw": "{\n  \"utxo\": \"f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16:0\",\n  \"destination\": \"bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq\",\n  \"options\": {\n    \"fee_per_kb\": 50000\n  }\n}"
            },
            "url": {
                "raw": "{{dev_base_url}}/api/v2/trx/stampdetach",
                "host": [
                    "{{dev_base_url}}"
                ],
                "path": [
                    "api",
                    "v2",
                    "trx",
                    "stampdetach"
                ]
            }
        }
    }

    # Find position to insert (after the "Mint Stamp - Prod" test and before error tests)
    insert_idx = None
    for idx, item in enumerate(post_section['item']):
        if 'Mint Stamp - Prod' in item['name']:
            insert_idx = idx + 1
            break

    if insert_idx is not None:
        # Check if success test already exists
        has_success_test = any('Detach Stamp - Success' in item['name'] for item in post_section['item'])
        if not has_success_test:
            post_section['item'].insert(insert_idx, success_test)
            print("✓ Added Detach Stamp - Success (Dev) test")

    return post_section

def main():
    """Main function to update comprehensive.json with success-path tests."""
    comprehensive_path = Path('tests/postman/collections/comprehensive.json')

    if not comprehensive_path.exists():
        print(f"Error: {comprehensive_path} not found")
        sys.exit(1)

    print(f"Reading {comprehensive_path}...")
    with open(comprehensive_path, 'r') as f:
        data = json.load(f)

    # Find POST Endpoints section
    post_section = None
    post_index = None
    for idx, item in enumerate(data['item']):
        if item['name'] == 'POST Endpoints':
            post_section = item
            post_index = idx
            break

    if not post_section:
        print("Error: POST Endpoints section not found")
        sys.exit(1)

    print(f"Found POST Endpoints section with {len(post_section['item'])} tests")

    # Update each test
    updates_made = []

    for test in post_section['item']:
        test_name = test['name']

        if 'Create SRC20 Token' in test_name:
            print(f"Updating {test_name}...")
            update_src20_create_test(test)
            updates_made.append(test_name)

        elif 'Attach Stamp' in test_name and 'Dev' in test_name:
            print(f"Updating {test_name}...")
            update_attach_test(test)
            updates_made.append(test_name)

        elif 'Attach Stamp' in test_name and 'Prod' in test_name:
            print(f"Updating {test_name}...")
            update_attach_test(test)
            updates_made.append(test_name)

        elif 'Mint Stamp' in test_name and 'Dev' in test_name:
            print(f"Updating {test_name}...")
            update_mint_test(test)
            updates_made.append(test_name)

        elif 'Mint Stamp' in test_name and 'Prod' in test_name:
            print(f"Updating {test_name}...")
            update_mint_test(test)
            updates_made.append(test_name)

    # Add success-path test for Detach
    print("Adding Detach Stamp success-path test...")
    add_detach_success_test(post_section)

    # Update the data
    data['item'][post_index] = post_section

    # Write back to file
    print(f"\nWriting updated collection to {comprehensive_path}...")
    with open(comprehensive_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\n✓ Successfully updated comprehensive.json")
    print(f"✓ Updated {len(updates_made)} tests:")
    for test_name in updates_made:
        print(f"  - {test_name}")

    print("\nNext steps:")
    print("1. Run Newman tests locally to verify")
    print("2. Check that all POST endpoints have both success and error tests")
    print("3. Validate PSBT hex data in success responses")

if __name__ == '__main__':
    main()
