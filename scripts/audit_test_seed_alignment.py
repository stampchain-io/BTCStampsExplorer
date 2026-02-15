#!/usr/bin/env python3
"""
Audit script to verify test variables vs seed data alignment for all Newman requests.

This script:
1. Parses comprehensive.json to extract all test requests and their variables
2. Parses test-seed-data.sql to extract seeded data
3. Cross-references each test request against seed data
4. Generates a gap analysis report in CSV and JSON formats
"""

import json
import re
import csv
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict


class SeedDataParser:
    """Parse test-seed-data.sql to extract seeded entities."""

    def __init__(self, sql_path: Path):
        self.sql_path = sql_path
        self.seed_data = {
            'cpids': set(),
            'ticks': set(),
            'block_indexes': set(),
            'tx_hashes': set(),
            'addresses': set(),
            'stamp_numbers': set(),
            'creator_names': set(),
            'collections': set(),
            'src20_ticks': set(),
            'src101_ticks': set(),
            'tokenid': set(),
            'deploy_hash': set(),
        }
        self.test_variables = {}  # Map of variable names to their values
        self._parse()
        self._parse_header_variables()

    def _parse(self):
        """Parse SQL file and extract all seeded values."""
        content = self.sql_path.read_text()

        # Extract INSERT/REPLACE statements - match both INSERT INTO and REPLACE INTO
        insert_pattern = r"(?:INSERT|REPLACE) INTO `?(\w+)`?\s*\((.*?)\)\s*VALUES\s+(.*?);"

        for match in re.finditer(insert_pattern, content, re.DOTALL | re.IGNORECASE):
            table_name = match.group(1)
            columns_str = match.group(2)
            values_str = match.group(3)

            # Parse column names - handle backticks
            columns = [col.strip().strip('`').strip('"') for col in columns_str.split(',')]

            # Parse multi-row VALUES
            value_rows = self._parse_values(values_str)

            for row_values in value_rows:
                self._extract_from_row(table_name, columns, row_values)

    def _parse_header_variables(self):
        """Parse test variable definitions from SQL header comments."""
        content = self.sql_path.read_text()
        lines = content.split('\n')[:30]  # Check first 30 lines for header

        for line in lines:
            # Look for pattern: --   test_variable = value
            if line.strip().startswith('--') and '=' in line:
                parts = line.strip()[2:].strip().split('=', 1)
                if len(parts) == 2:
                    var_name = parts[0].strip()
                    var_value = parts[1].strip()
                    if var_name.startswith('test_'):
                        self.test_variables[var_name] = var_value

    def _parse_values(self, values_str: str) -> List[List[str]]:
        """Parse VALUES clause which may contain multiple rows."""
        rows = []
        current_row = []
        in_string = False
        escape_next = False
        paren_depth = 0
        current_value = []

        for char in values_str:
            if escape_next:
                current_value.append(char)
                escape_next = False
                continue

            if char == '\\':
                escape_next = True
                current_value.append(char)
                continue

            if char == "'" and not escape_next:
                in_string = not in_string
                current_value.append(char)
                continue

            if in_string:
                current_value.append(char)
                continue

            if char == '(':
                paren_depth += 1
                if paren_depth == 1:
                    # Start of new row
                    continue
                current_value.append(char)
            elif char == ')':
                paren_depth -= 1
                if paren_depth == 0:
                    # End of row - save current value and row
                    val = ''.join(current_value).strip()
                    if val:
                        current_row.append(val)
                    current_value = []
                    if current_row:
                        rows.append(current_row)
                        current_row = []
                else:
                    current_value.append(char)
            elif char == ',' and paren_depth == 1:
                # End of value within row
                val = ''.join(current_value).strip()
                current_row.append(val)
                current_value = []
            elif paren_depth > 0:
                # Only accumulate chars when inside parentheses
                current_value.append(char)

        return rows

    def _extract_from_row(self, table: str, columns: List[str], values: List[str]):
        """Extract relevant data from a single row."""
        if len(columns) != len(values):
            # Skip rows with mismatched columns/values
            return

        row_dict = dict(zip(columns, values))

        # Clean values (remove quotes and handle NULL)
        for key in row_dict:
            val = row_dict[key].strip()
            if val.upper() == 'NULL':
                row_dict[key] = None
            elif val.startswith("'") and val.endswith("'"):
                row_dict[key] = val[1:-1]
            else:
                row_dict[key] = val

        # Extract based on table - handle various table names
        table_lower = table.lower()

        if table_lower in ['stamptablev4', 'stamps']:
            if 'cpid' in row_dict and row_dict['cpid']:
                self.seed_data['cpids'].add(row_dict['cpid'])
            if 'tick' in row_dict and row_dict['tick']:
                self.seed_data['ticks'].add(row_dict['tick'])
            if 'block_index' in row_dict and row_dict['block_index']:
                self.seed_data['block_indexes'].add(str(row_dict['block_index']))
            if 'tx_hash' in row_dict and row_dict['tx_hash']:
                self.seed_data['tx_hashes'].add(row_dict['tx_hash'])
            if 'creator' in row_dict and row_dict['creator']:
                self.seed_data['addresses'].add(row_dict['creator'])
            if 'stamp' in row_dict and row_dict['stamp']:
                self.seed_data['stamp_numbers'].add(str(row_dict['stamp']))

        elif table_lower == 'creator':
            if 'creator' in row_dict and row_dict['creator']:
                self.seed_data['creator_names'].add(row_dict['creator'])
            if 'address' in row_dict and row_dict['address']:
                self.seed_data['addresses'].add(row_dict['address'])

        elif table_lower in ['src20valid', 'src20']:
            if 'tick' in row_dict and row_dict['tick']:
                self.seed_data['src20_ticks'].add(row_dict['tick'])
            if 'creator' in row_dict and row_dict['creator']:
                self.seed_data['addresses'].add(row_dict['creator'])
            if 'destination' in row_dict and row_dict['destination']:
                self.seed_data['addresses'].add(row_dict['destination'])
            if 'tx_hash' in row_dict and row_dict['tx_hash']:
                self.seed_data['tx_hashes'].add(row_dict['tx_hash'])
            if 'block_index' in row_dict and row_dict['block_index']:
                self.seed_data['block_indexes'].add(str(row_dict['block_index']))

        elif table_lower in ['src101valid', 'src101']:
            if 'tick' in row_dict and row_dict['tick']:
                self.seed_data['src101_ticks'].add(row_dict['tick'])
            if 'creator' in row_dict and row_dict['creator']:
                self.seed_data['addresses'].add(row_dict['creator'])
            if 'owner' in row_dict and row_dict['owner']:
                self.seed_data['addresses'].add(row_dict['owner'])
            if 'destination' in row_dict and row_dict['destination']:
                self.seed_data['addresses'].add(row_dict['destination'])
            if 'tx_hash' in row_dict and row_dict['tx_hash']:
                self.seed_data['tx_hashes'].add(row_dict['tx_hash'])
            if 'tokenid' in row_dict and row_dict['tokenid']:
                # Store tokenid for SRC-101 tests
                if 'tokenid' not in self.seed_data:
                    self.seed_data['tokenid'] = set()
                self.seed_data['tokenid'].add(row_dict['tokenid'])
            if 'deploy_hash' in row_dict and row_dict['deploy_hash']:
                if 'deploy_hash' not in self.seed_data:
                    self.seed_data['deploy_hash'] = set()
                self.seed_data['deploy_hash'].add(row_dict['deploy_hash'])

        elif table_lower == 'blocks':
            if 'block_index' in row_dict and row_dict['block_index']:
                self.seed_data['block_indexes'].add(str(row_dict['block_index']))

        elif table_lower == 'transactions':
            if 'tx_hash' in row_dict and row_dict['tx_hash']:
                self.seed_data['tx_hashes'].add(row_dict['tx_hash'])
            if 'source' in row_dict and row_dict['source']:
                self.seed_data['addresses'].add(row_dict['source'])
            if 'destination' in row_dict and row_dict['destination']:
                self.seed_data['addresses'].add(row_dict['destination'])

        elif table_lower == 'collections':
            if 'collection_id' in row_dict and row_dict['collection_id']:
                if 'collections' not in self.seed_data:
                    self.seed_data['collections'] = set()
                self.seed_data['collections'].add(str(row_dict['collection_id']))


class PostmanCollectionParser:
    """Parse comprehensive.json to extract test requests and variables."""

    def __init__(self, collection_path: Path):
        self.collection_path = collection_path
        self.requests = []
        self._parse()

    def _parse(self):
        """Parse Postman collection JSON."""
        with open(self.collection_path) as f:
            data = json.load(f)

        # Recursively find all requests
        self._extract_requests(data.get('item', []))

    def _extract_requests(self, items: List[Dict], folder_path: str = ""):
        """Recursively extract all request items."""
        for item in items:
            if 'item' in item:
                # This is a folder
                folder_name = item.get('name', 'Unnamed')
                new_path = f"{folder_path}/{folder_name}" if folder_path else folder_name
                self._extract_requests(item['item'], new_path)
            elif 'request' in item:
                # This is a request
                request_info = self._parse_request(item, folder_path)
                self.requests.append(request_info)

    def _parse_request(self, item: Dict, folder_path: str) -> Dict:
        """Parse a single request item."""
        request = item.get('request', {})
        name = item.get('name', 'Unnamed')

        # Extract URL
        url = request.get('url', {})
        if isinstance(url, str):
            url_str = url
        else:
            url_str = url.get('raw', '')

        # Extract variables from URL
        variables = self._extract_variables(url_str)

        # Extract variables from request body
        body = request.get('body', {})
        if body:
            body_raw = body.get('raw', '')
            variables.update(self._extract_variables(body_raw))

        # Extract method
        method = request.get('method', 'GET')

        # Extract expected status from test script
        expected_status = self._extract_expected_status(item)

        return {
            'name': name,
            'folder': folder_path,
            'method': method,
            'url': url_str,
            'variables': sorted(list(variables)),
            'expected_status': expected_status,
        }

    def _extract_variables(self, text: str) -> Set[str]:
        """Extract all {{variable}} patterns from text."""
        pattern = r'\{\{([^}]+)\}\}'
        matches = re.findall(pattern, text)
        return set(matches)

    def _extract_expected_status(self, item: Dict) -> str:
        """Extract expected status codes from test scripts."""
        event = item.get('event', [])
        for evt in event:
            if evt.get('listen') == 'test':
                script = evt.get('script', {})
                exec_lines = script.get('exec', [])
                script_text = '\n'.join(exec_lines)

                # Look for "200 or 400" pattern in test description
                if re.search(r'200\s+or\s+400', script_text, re.IGNORECASE):
                    return "200/400"

                # Look for pm.expect([200, 400]).to.include pattern
                if re.search(r'pm\.expect\(\[200,\s*400\]\)', script_text):
                    return "200/400"

                # Look for oneOf pattern with multiple status codes
                if 'oneOf' in script_text and '200' in script_text and '400' in script_text:
                    return "200/400"

                # Look for individual status patterns
                for line in exec_lines:
                    if 'pm.response.to.have.status' in line or 'pm.expect(pm.response.code)' in line:
                        # Extract status codes
                        status_match = re.search(r'\b(200|201|400|404|500)\b', line)
                        if status_match:
                            return status_match.group(1)

        return "unknown"


class GapAnalyzer:
    """Analyze gaps between test requests and seed data."""

    def __init__(self, requests: List[Dict], seed_data: Dict, test_variables: Dict):
        self.requests = requests
        self.seed_data = seed_data
        self.test_variables = test_variables
        self.results = []

    def analyze(self):
        """Perform gap analysis for all requests."""
        for req in self.requests:
            result = {
                'request_name': req['name'],
                'folder': req['folder'],
                'method': req['method'],
                'endpoint': self._extract_endpoint(req['url']),
                'variables': ', '.join(req['variables']),
                'expected_status': req['expected_status'],
                'seed_status': '',
                'notes': []
            }

            # Check each variable
            missing_vars = []
            matched_vars = []

            for var in req['variables']:
                if self._is_variable_seeded(var):
                    matched_vars.append(var)
                else:
                    missing_vars.append(var)

            # Determine overall status
            if not req['variables']:
                result['seed_status'] = 'NO_VARS'
                result['notes'].append('No variables used in this request')
            elif missing_vars:
                result['seed_status'] = 'MISSING'
                result['notes'].append(f"Missing seed data for: {', '.join(missing_vars)}")
            else:
                result['seed_status'] = 'MATCHED'
                result['notes'].append('All variables have matching seed data')

            # Special notes for SRC-101 and status codes
            if req['expected_status'] == '200/400':
                result['notes'].append('⚠️  Accepts both 200 and 400 status codes')

            if 'src-101' in req['folder'].lower() or 'src101' in req['folder'].lower():
                result['notes'].append('SRC-101 endpoint')

            # Check for guard patterns
            if '?' in req['url'] or 'page=' in req['url'] or 'limit=' in req['url']:
                result['notes'].append('Uses pagination/filtering parameters')

            self.results.append(result)

    def _extract_endpoint(self, url: str) -> str:
        """Extract the endpoint path from full URL."""
        # Remove baseUrl variable
        url = url.replace('{{baseUrl}}', '')
        # Remove query parameters for cleaner display
        if '?' in url:
            url = url.split('?')[0]
        return url

    def _is_variable_seeded(self, var: str) -> bool:
        """Check if a variable has corresponding seed data."""
        var_lower = var.lower()

        # Environment/configuration variables that don't need seed data
        if any(x in var_lower for x in ['base_url', 'baseurl', 'dev_', 'prod_']):
            return True
        if var_lower in ['limit', 'page', 'offset', 'sort', 'order']:
            return True

        # Check if this is a documented test variable
        if var in self.test_variables:
            # Variable is documented - verify its value exists in seed data
            test_value = self.test_variables[var]

            # Map to appropriate seed data set
            if 'cpid' in var_lower:
                return test_value in self.seed_data['cpids']
            elif 'block' in var_lower:
                return test_value in self.seed_data['block_indexes']
            elif 'stamp' in var_lower and 'id' in var_lower:
                return test_value in self.seed_data['stamp_numbers']
            elif 'address' in var_lower:
                return test_value in self.seed_data['addresses']
            elif 'tx' in var_lower and 'hash' in var_lower:
                return test_value in self.seed_data['tx_hashes']
            elif 'src20' in var_lower and 'tick' in var_lower:
                return test_value in self.seed_data['src20_ticks']
            elif 'cursed' in var_lower:
                # Cursed IDs are negative stamp numbers
                return True  # We have stamp data
            elif 'deploy' in var_lower and 'hash' in var_lower:
                return test_value in self.seed_data['deploy_hash']
            elif 'tokenid' in var_lower:
                return test_value in self.seed_data['tokenid']
            elif 'tick' in var_lower:
                return test_value in self.seed_data['src20_ticks'] or test_value in self.seed_data['src101_ticks']
            elif 'index' in var_lower or 'number' in var_lower:
                # Generic index/number - assume available
                return True

        # Generic variable name matching (for undocumented variables)
        if 'cpid' in var_lower:
            return bool(self.seed_data['cpids'])
        elif 'tokenid' in var_lower:
            return bool(self.seed_data['tokenid'])
        elif 'deploy' in var_lower and 'hash' in var_lower:
            return bool(self.seed_data['deploy_hash'])
        elif 'tick' in var_lower:
            if 'src20' in var_lower:
                return bool(self.seed_data['src20_ticks'])
            elif 'src101' in var_lower or 'src-101' in var_lower:
                return bool(self.seed_data['src101_ticks'])
            else:
                return bool(self.seed_data['ticks'] or self.seed_data['src20_ticks'] or self.seed_data['src101_ticks'])
        elif 'block' in var_lower:
            return bool(self.seed_data['block_indexes'])
        elif 'tx' in var_lower and 'hash' in var_lower:
            return bool(self.seed_data['tx_hashes'])
        elif 'address' in var_lower:
            return bool(self.seed_data['addresses'])
        elif 'creator' in var_lower:
            if 'name' in var_lower:
                return bool(self.seed_data['creator_names'])
            else:
                return bool(self.seed_data['addresses'])
        elif 'stamp' in var_lower:
            return bool(self.seed_data['stamp_numbers'])
        elif 'collection' in var_lower:
            return bool(self.seed_data.get('collections', set()))
        elif 'cursed' in var_lower:
            return True  # Cursed data available

        # Unknown variable - mark as missing
        return False

    def generate_report_csv(self, output_path: Path):
        """Generate CSV gap analysis report."""
        with open(output_path, 'w', newline='') as f:
            fieldnames = ['request_name', 'folder', 'method', 'endpoint', 'variables',
                         'expected_status', 'seed_status', 'notes']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for result in self.results:
                row = result.copy()
                row['notes'] = ' | '.join(result['notes'])
                writer.writerow(row)

    def generate_report_json(self, output_path: Path):
        """Generate JSON gap analysis report."""
        summary = self._generate_summary()

        report = {
            'audit_metadata': {
                'generated_at': '2026-02-15',
                'collection_file': 'comprehensive.json',
                'seed_data_file': 'test-seed-data.sql',
                'total_requests_analyzed': len(self.results),
            },
            'executive_summary': {
                'overall_alignment': f"{summary['match_percentage']}% of requests have matching seed data",
                'requests_with_gaps': summary['missing'],
                'missing_variables': summary['missing_variables'],
                'special_attention_needed': [
                    f"{summary['src101_200_400_tests']} requests accept both 200 and 400 status codes",
                    f"{summary['requests_with_pagination']} requests use pagination/filtering",
                ],
            },
            'summary': summary,
            'details': self.results
        }

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

    def _generate_summary(self) -> Dict:
        """Generate summary statistics."""
        status_counts = defaultdict(int)
        method_counts = defaultdict(int)
        folder_counts = defaultdict(int)

        for result in self.results:
            status_counts[result['seed_status']] += 1
            method_counts[result['method']] += 1
            if result['folder']:
                folder_counts[result['folder']] += 1

        # Find missing variables
        missing_vars = set()
        for result in self.results:
            if result['seed_status'] == 'MISSING':
                for note in result['notes']:
                    if 'Missing seed data for:' in note:
                        vars_str = note.replace('Missing seed data for:', '').strip()
                        for var in vars_str.split(','):
                            missing_vars.add(var.strip())

        return {
            'total_requests': len(self.results),
            'matched': status_counts['MATCHED'],
            'missing': status_counts['MISSING'],
            'no_variables': status_counts['NO_VARS'],
            'match_percentage': round((status_counts['MATCHED'] / len(self.results)) * 100, 1) if self.results else 0,
            'src101_200_400_tests': sum(1 for r in self.results if '200/400' in r['expected_status']),
            'requests_with_pagination': sum(1 for r in self.results if 'pagination' in str(r['notes']).lower()),
            'method_breakdown': dict(method_counts),
            'folder_breakdown': dict(folder_counts),
            'missing_variables': sorted(list(missing_vars)),
            'requests_by_status_code': {
                '200': sum(1 for r in self.results if r['expected_status'] == '200'),
                '200/400': sum(1 for r in self.results if r['expected_status'] == '200/400'),
                'unknown': sum(1 for r in self.results if r['expected_status'] == 'unknown'),
            }
        }

    def print_summary(self):
        """Print summary to console."""
        summary = self._generate_summary()
        print("\n" + "="*80)
        print("GAP ANALYSIS SUMMARY")
        print("="*80)
        print(f"Total requests analyzed: {summary['total_requests']}")
        print(f"  - ✓ Matched (all vars have seed data): {summary['matched']} ({summary['match_percentage']}%)")
        print(f"  - ✗ Missing (some vars lack seed data): {summary['missing']}")
        print(f"  - ○ No variables used: {summary['no_variables']}")

        if summary['missing_variables']:
            print(f"\nMissing variables that need seed data:")
            for var in summary['missing_variables']:
                print(f"  • {var}")

        print(f"\nRequest breakdown by method:")
        for method, count in sorted(summary['method_breakdown'].items()):
            print(f"  - {method}: {count}")

        print(f"\nRequest breakdown by expected status:")
        for status, count in sorted(summary['requests_by_status_code'].items()):
            print(f"  - {status}: {count}")

        print(f"\nSpecial cases:")
        print(f"  - Tests accepting 200/400 status: {summary['src101_200_400_tests']}")
        print(f"  - Requests with pagination/filtering: {summary['requests_with_pagination']}")
        print("="*80)


def main():
    """Main execution function."""
    base_path = Path('/home/StampchainWorkspace/BTCStampsExplorer')

    collection_path = base_path / 'tests/postman/collections/comprehensive.json'
    seed_path = base_path / 'scripts/test-seed-data.sql'
    output_csv = base_path / 'tests/postman/gap-analysis.csv'
    output_json = base_path / 'tests/postman/gap-analysis.json'

    print("Starting gap analysis...")
    print(f"Collection: {collection_path}")
    print(f"Seed data: {seed_path}")

    # Parse seed data
    print("\n[1/4] Parsing seed data SQL...")
    seed_parser = SeedDataParser(seed_path)
    print(f"  Found {len(seed_parser.seed_data['cpids'])} CPIDs")
    if seed_parser.seed_data['cpids']:
        print(f"    Examples: {list(seed_parser.seed_data['cpids'])[:3]}")
    print(f"  Found {len(seed_parser.seed_data['ticks'])} ticks")
    if seed_parser.seed_data['ticks']:
        print(f"    Examples: {list(seed_parser.seed_data['ticks'])[:3]}")
    print(f"  Found {len(seed_parser.seed_data['block_indexes'])} block indexes")
    if seed_parser.seed_data['block_indexes']:
        print(f"    Examples: {list(seed_parser.seed_data['block_indexes'])[:3]}")
    print(f"  Found {len(seed_parser.seed_data['tx_hashes'])} tx hashes")
    print(f"  Found {len(seed_parser.seed_data['addresses'])} addresses")
    print(f"  Found {len(seed_parser.seed_data['stamp_numbers'])} stamp numbers")
    print(f"  Found {len(seed_parser.seed_data['src20_ticks'])} SRC-20 ticks")
    if seed_parser.seed_data['src20_ticks']:
        print(f"    Examples: {list(seed_parser.seed_data['src20_ticks'])[:3]}")
    print(f"  Found {len(seed_parser.seed_data['src101_ticks'])} SRC-101 ticks")
    if seed_parser.seed_data['src101_ticks']:
        print(f"    Examples: {list(seed_parser.seed_data['src101_ticks'])[:3]}")
    print(f"  Found {len(seed_parser.seed_data['tokenid'])} SRC-101 token IDs")
    print(f"  Found {len(seed_parser.seed_data['deploy_hash'])} deploy hashes")

    # Parse collection
    print("\n[2/4] Parsing Postman collection...")
    collection_parser = PostmanCollectionParser(collection_path)
    print(f"  Found {len(collection_parser.requests)} test requests")

    # Display test variables
    print(f"\n  Test variables found: {len(seed_parser.test_variables)}")
    for var_name, var_value in sorted(seed_parser.test_variables.items()):
        print(f"    {var_name} = {var_value}")

    # Analyze gaps
    print("\n[3/4] Analyzing gaps...")
    analyzer = GapAnalyzer(collection_parser.requests, seed_parser.seed_data, seed_parser.test_variables)
    analyzer.analyze()

    # Generate reports
    print("\n[4/4] Generating reports...")
    analyzer.generate_report_csv(output_csv)
    print(f"  CSV report: {output_csv}")

    analyzer.generate_report_json(output_json)
    print(f"  JSON report: {output_json}")

    # Print summary
    analyzer.print_summary()

    print("\n✓ Gap analysis complete!")


if __name__ == '__main__':
    main()
