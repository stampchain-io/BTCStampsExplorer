#!/usr/bin/env python3
"""
Validate comprehensive.json test coverage and structure.
Ensures all requests have test scripts and validates test patterns.
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Tuple

COLLECTION_PATH = Path('/home/StampchainWorkspace/BTCStampsExplorer/tests/postman/collections/comprehensive.json')


def load_collection() -> dict:
    """Load the Postman collection."""
    with open(COLLECTION_PATH) as f:
        return json.load(f)


def find_all_requests(items: list, path: str = "") -> List[Dict]:
    """Recursively find all requests in collection."""
    requests = []
    for item in items:
        current_path = f"{path}/{item['name']}" if path else item['name']

        if 'request' in item:
            # This is a request
            requests.append({
                'path': current_path,
                'name': item['name'],
                'item': item
            })
        elif 'item' in item:
            # This is a folder
            requests.extend(find_all_requests(item['item'], current_path))

    return requests


def validate_test_script(request_item: dict) -> Tuple[bool, List[str]]:
    """Validate that a request has a proper test script."""
    issues = []

    # Check for event array
    if 'event' not in request_item:
        return False, ['No event array found']

    # Check for test event
    test_events = [e for e in request_item['event'] if e.get('listen') == 'test']
    if not test_events:
        return False, ['No test event found']

    test_event = test_events[0]

    # Check for script
    if 'script' not in test_event:
        return False, ['Test event has no script']

    script = test_event['script']

    # Check for exec array
    if 'exec' not in script or not isinstance(script['exec'], list):
        return False, ['Test script has no exec array']

    # Check if script is empty
    if len(script['exec']) == 0:
        return False, ['Test script is empty']

    # Check for basic test patterns
    script_text = '\n'.join(script['exec'])

    if 'pm.test' not in script_text:
        issues.append('Warning: No pm.test() calls found')

    if 'pm.response' not in script_text and 'pm.expect' not in script_text:
        issues.append('Warning: No assertions found')

    return True, issues


def analyze_error_scenarios(data: dict) -> Dict:
    """Analyze Error Scenarios folder structure."""
    error_folder = None
    for folder in data['item']:
        if folder['name'] == 'Error Scenarios':
            error_folder = folder
            break

    if not error_folder:
        return {'found': False, 'tests': []}

    tests = []
    for test in error_folder['item']:
        url = test.get('request', {}).get('url', {})
        path_parts = url.get('path', []) if isinstance(url, dict) else []
        query = url.get('query', []) if isinstance(url, dict) else []

        # Get expected status from test script
        expected_status = None
        for event in test.get('event', []):
            if event.get('listen') == 'test':
                script_text = '\n'.join(event.get('script', {}).get('exec', []))
                # Try to extract status code
                if '404' in script_text:
                    expected_status = 404
                elif '400' in script_text:
                    expected_status = 400

        tests.append({
            'name': test['name'],
            'path': '/' + '/'.join(path_parts),
            'query': query,
            'expected_status': expected_status
        })

    return {
        'found': True,
        'count': len(tests),
        'tests': tests
    }


def find_recent_sales_requests(all_requests: List[Dict]) -> Dict:
    """Find and categorize Recent Sales requests."""
    recent_sales = [r for r in all_requests if 'Recent Sales' in r['name']]

    dev_requests = [r for r in recent_sales if ' - Dev ' in r['name']]
    prod_requests = [r for r in recent_sales if ' - Prod ' in r['name']]

    return {
        'total': len(recent_sales),
        'dev': len(dev_requests),
        'prod': len(prod_requests),
        'dev_requests': dev_requests,
        'prod_requests': prod_requests
    }


def main():
    print("=" * 70)
    print("BTC Stamps Explorer - Test Coverage Validation")
    print("=" * 70)
    print()

    # Load collection
    print(f"Loading collection from: {COLLECTION_PATH}")
    data = load_collection()
    print(f"✓ Collection loaded: {data['info']['name']}")
    print(f"  Version: {data['info']['version']}")
    print()

    # Find all requests
    all_requests = find_all_requests(data['item'])
    print(f"Total requests found: {len(all_requests)}")
    print()

    # Validate test coverage
    print("=" * 70)
    print("TEST COVERAGE VALIDATION")
    print("=" * 70)
    print()

    tested_requests = []
    untested_requests = []
    requests_with_issues = []

    for req in all_requests:
        has_test, issues = validate_test_script(req['item'])

        if has_test:
            tested_requests.append(req)
            if issues:
                requests_with_issues.append((req, issues))
        else:
            untested_requests.append((req, issues))

    print(f"Tested requests: {len(tested_requests)}/{len(all_requests)}")
    print(f"Untested requests: {len(untested_requests)}")
    print(f"Requests with warnings: {len(requests_with_issues)}")
    print()

    # Show untested requests
    if untested_requests:
        print("UNTESTED REQUESTS:")
        for req, issues in untested_requests:
            print(f"  ✗ {req['path']}")
            for issue in issues:
                print(f"    - {issue}")
        print()
    else:
        print("✓ All requests have test scripts!")
        print()

    # Show warnings
    if requests_with_issues:
        print(f"REQUESTS WITH WARNINGS ({len(requests_with_issues)}):")
        for req, issues in requests_with_issues[:5]:  # Show first 5
            print(f"  ⚠ {req['name']}")
            for issue in issues:
                print(f"    - {issue}")
        if len(requests_with_issues) > 5:
            print(f"  ... and {len(requests_with_issues) - 5} more")
        print()

    # Validate Recent Sales requests
    print("=" * 70)
    print("RECENT SALES REQUESTS VALIDATION")
    print("=" * 70)
    print()

    recent_sales = find_recent_sales_requests(all_requests)
    print(f"Total Recent Sales requests: {recent_sales['total']}")
    print(f"  Dev requests: {recent_sales['dev']}")
    print(f"  Prod requests: {recent_sales['prod']}")
    print()

    # Check the 6 previously untested Prod requests
    target_prod_requests = [
        'Get Recent Sales - Prod (Custom day_range)',
        'Get Recent Sales - Prod (full_details=true)',
        'Get Recent Sales - Prod (Pagination)',
        'Get Recent Sales - Prod (Boundary day_range)',
        'Get Recent Sales - Prod (Large day_range)',
        'Get Recent Sales - Prod (Combined Parameters)',
    ]

    print("Previously Untested Prod Requests (now should have tests):")
    all_tested = True
    for target_name in target_prod_requests:
        req = next((r for r in recent_sales['prod_requests'] if r['name'] == target_name), None)
        if req:
            has_test, issues = validate_test_script(req['item'])
            status = "✓" if has_test else "✗"
            print(f"  {status} {target_name}")
            if not has_test:
                all_tested = False
        else:
            print(f"  ✗ NOT FOUND: {target_name}")
            all_tested = False
    print()

    # Validate Error Scenarios
    print("=" * 70)
    print("ERROR SCENARIOS VALIDATION")
    print("=" * 70)
    print()

    error_scenarios = analyze_error_scenarios(data)

    if not error_scenarios['found']:
        print("✗ Error Scenarios folder not found!")
        return 1

    print(f"✓ Error Scenarios folder found with {error_scenarios['count']} tests")
    print()

    # Check for the 5 new negative tests
    new_negative_tests = [
        'Invalid Block Number - Dev',
        'Invalid SRC-101 Token ID - Dev',
        'Invalid Pagination Limit - Dev',
        'Invalid CPID Format - Dev',
        'Invalid SRC-20 Holder Address - Dev',
    ]

    print("New Negative Tests (should be present):")
    all_found = True
    for target_name in new_negative_tests:
        test = next((t for t in error_scenarios['tests'] if t['name'] == target_name), None)
        if test:
            print(f"  ✓ {target_name}")
            print(f"    Path: {test['path']}")
            if test['expected_status']:
                print(f"    Expected Status: {test['expected_status']}")
        else:
            print(f"  ✗ NOT FOUND: {target_name}")
            all_found = False
    print()

    print("All Error Scenarios tests:")
    for test in error_scenarios['tests']:
        print(f"  - {test['name']}")
    print()

    # Final summary
    print("=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print()

    success = True

    if untested_requests:
        print(f"✗ {len(untested_requests)} requests still need test scripts")
        success = False
    else:
        print("✓ All requests have test scripts (122/122)")

    if all_tested:
        print("✓ All 6 Recent Sales Prod requests now have test scripts")
    else:
        print("✗ Some Recent Sales Prod requests still missing tests")
        success = False

    if all_found:
        print("✓ All 5 new negative tests are present")
    else:
        print("✗ Some new negative tests are missing")
        success = False

    if error_scenarios['count'] >= 10:
        print(f"✓ Error Scenarios folder has {error_scenarios['count']} tests (expected >= 10)")
    else:
        print(f"✗ Error Scenarios folder has only {error_scenarios['count']} tests (expected >= 10)")
        success = False

    print()

    if success:
        print("=" * 70)
        print("✓ VALIDATION PASSED - All test requirements met!")
        print("=" * 70)
        return 0
    else:
        print("=" * 70)
        print("✗ VALIDATION FAILED - Some requirements not met")
        print("=" * 70)
        return 1


if __name__ == '__main__':
    sys.exit(main())
