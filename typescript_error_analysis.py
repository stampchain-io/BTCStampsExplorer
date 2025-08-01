#!/usr/bin/env python3
"""
TypeScript Error Analysis Script
Analyzes the TypeScript compilation errors from deno check output
"""

import re
from collections import defaultdict, Counter
from pathlib import Path

def parse_error_log(log_content):
    """Parse the TypeScript error log into structured data"""
    errors = []
    lines = log_content.split('\n')
    
    current_error = None
    for line in lines:
        # Match error lines like: [0m[1mTS2304 [0m[ERROR]: Cannot find name 'Wallet'.
        error_match = re.search(r'TS(\d+).*?ERROR.*?: (.+)', line)
        if error_match:
            if current_error:
                errors.append(current_error)
            
            current_error = {
                'code': 'TS' + error_match.group(1),
                'message': error_match.group(2),
                'file': None,
                'line': None,
                'column': None,
                'context': []
            }
        
        # Match file location lines like: at [0m[36mfile:///path/to/file.ts[0m:[0m[33m123[0m:[0m[33m45[0m
        location_match = re.search(r'at.*file://([^:]+):(\d+):(\d+)', line)
        if location_match and current_error:
            current_error['file'] = location_match.group(1)
            current_error['line'] = int(location_match.group(2))
            current_error['column'] = int(location_match.group(3))
        
        # Collect context lines (lines with colored text that aren't error headers)
        if current_error and not error_match and not location_match and line.strip():
            # Clean up ANSI codes
            clean_line = re.sub(r'\[0m\[31m|\[0m\[36m|\[0m\[33m|\[0m', '', line)
            if clean_line.strip() and 'Check file://' not in clean_line:
                current_error['context'].append(clean_line.strip())
    
    if current_error:
        errors.append(current_error)
    
    return errors

def analyze_errors(errors):
    """Analyze the parsed errors and generate insights"""
    analysis = {
        'total_errors': len(errors),
        'by_code': Counter(),
        'by_file': Counter(),
        'by_directory': Counter(),
        'patterns': defaultdict(list),
        'critical_files': [],
        'error_categories': {
            'type_imports': [],
            'missing_exports': [],
            'unused_declarations': [],
            'missing_types': [],
            'namespace_errors': [],
            'argument_errors': [],
            'other': []
        }
    }
    
    for error in errors:
        code = error['code']
        file_path = error['file'] if error['file'] else 'unknown'
        
        analysis['by_code'][code] += 1
        analysis['by_file'][file_path] += 1
        
        # Extract directory
        if file_path != 'unknown':
            directory = '/'.join(file_path.split('/')[:-1])
            analysis['by_directory'][directory] += 1
        
        # Categorize errors
        if code == 'TS2459':  # Module declares locally but not exported
            analysis['error_categories']['missing_exports'].append(error)
        elif code == 'TS2304':  # Cannot find name
            analysis['error_categories']['missing_types'].append(error)
        elif code == 'TS6133' or code == 'TS6192':  # Unused declarations
            analysis['error_categories']['unused_declarations'].append(error)
        elif code == 'TS2305':  # Module has no exported member
            analysis['error_categories']['missing_exports'].append(error)
        elif code == 'TS2303':  # Cannot find namespace
            analysis['error_categories']['namespace_errors'].append(error)
        elif code == 'TS1361':  # Cannot be used as value (import type issue)
            analysis['error_categories']['type_imports'].append(error)
        elif code == 'TS2554':  # Expected N arguments, but got M
            analysis['error_categories']['argument_errors'].append(error)
        else:
            analysis['error_categories']['other'].append(error)
    
    # Find files with most errors
    analysis['critical_files'] = analysis['by_file'].most_common(20)
    
    return analysis

def generate_report(analysis):
    """Generate a comprehensive analysis report"""
    report = []
    
    report.append("# TypeScript Compilation Error Analysis")
    report.append(f"## Summary: {analysis['total_errors']} total errors found\n")
    
    # Error code breakdown
    report.append("## Error Code Breakdown")
    report.append("| Error Code | Count | Description |")
    report.append("|------------|-------|-------------|")
    
    error_descriptions = {
        'TS2554': 'Expected X arguments, but got Y',
        'TS7006': 'Parameter implicitly has any type',
        'TS18046': 'Expression is of type unknown',
        'TS1361': 'Cannot be used as value (import type issue)',
        'TS18048': 'Possibly undefined',
        'TS6133': 'Declared but never read',
        'TS2353': 'Object literal property issues',
        'TS6192': 'All imports unused',
        'TS1194': 'Export declarations not permitted in namespace',
        'TS2459': 'Module declares locally but not exported',
        'TS2304': 'Cannot find name',
        'TS2724': 'No exported member (with suggestion)',
        'TS2305': 'Module has no exported member',
        'TS2503': 'Cannot find namespace',
        'TS2687': 'All declarations must have identical modifiers',
        'TS2614': 'Module has no exported member',
        'TS2561': 'Object literal property issues',
        'TS2428': 'All declarations must have identical type parameters',
        'TS2395': 'Individual declarations must be all exported or all local',
        'TS2339': 'Property does not exist on type',
        'TS2300': 'Duplicate identifier',
        'TS7053': 'Element implicitly has any type',
        'TS7030': 'Not all code paths return a value',
        'TS6196': 'Declared but never used',
        'TS1183': 'Implementation cannot be declared in ambient contexts'
    }
    
    for code, count in analysis['by_code'].most_common():
        description = error_descriptions.get(code, 'Unknown error type')
        report.append(f"| {code} | {count} | {description} |")
    
    report.append("")
    
    # Files with most errors
    report.append("## Files with Most Errors")
    report.append("| File | Error Count |")
    report.append("|------|-------------|")
    
    for file_path, count in analysis['critical_files']:
        short_path = file_path.split('/')[-3:] if len(file_path.split('/')) > 3 else [file_path]
        report.append(f"| {'.../' + '/'.join(short_path) if len(file_path.split('/')) > 3 else file_path} | {count} |")
    
    report.append("")
    
    # Error categories
    report.append("## Error Categories and Impact")
    
    categories = [
        ('Missing Type Exports (TS2459, TS2305)', 'missing_exports', 'HIGH'),
        ('Missing Type Definitions (TS2304)', 'missing_types', 'HIGH'),
        ('Type Import Issues (TS1361)', 'type_imports', 'MEDIUM'),
        ('Unused Declarations (TS6133, TS6192)', 'unused_declarations', 'LOW'),
        ('Namespace Errors (TS2303)', 'namespace_errors', 'MEDIUM'),
        ('Argument Errors (TS2554)', 'argument_errors', 'MEDIUM'),
    ]
    
    for category_name, category_key, priority in categories:
        errors = analysis['error_categories'][category_key]
        report.append(f"### {category_name} - Priority: {priority}")
        report.append(f"**Count:** {len(errors)} errors")
        
        if errors:
            # Show common patterns
            file_patterns = Counter()
            message_patterns = Counter()
            
            for error in errors[:10]:  # Limit to first 10 for patterns
                if error['file']:
                    file_patterns[error['file']] += 1
                message_patterns[error['message']] += 1
            
            if file_patterns:
                report.append("**Most affected files:**")
                for file_path, count in file_patterns.most_common(5):
                    short_path = '/'.join(file_path.split('/')[-2:])
                    report.append(f"- {short_path}: {count} errors")
            
            if message_patterns:
                report.append("**Common error messages:**")
                for message, count in message_patterns.most_common(3):
                    report.append(f"- {message} ({count} occurrences)")
        
        report.append("")
    
    # Priority recommendations
    report.append("## Fix Priority Recommendations")
    report.append("")
    report.append("### 1. HIGH PRIORITY - Type Export Issues")
    report.append("- Fix TS2459 errors: Export locally declared types")
    report.append("- Fix TS2305 errors: Add missing type exports to modules")
    report.append("- Impact: These break type imports across the codebase")
    report.append("")
    
    report.append("### 2. HIGH PRIORITY - Missing Type Definitions") 
    report.append("- Fix TS2304 errors: Import or define missing types")
    report.append("- Common missing types: StampRow, SRC20Row, SendRow, etc.")
    report.append("- Impact: Core functionality cannot be properly typed")
    report.append("")
    
    report.append("### 3. MEDIUM PRIORITY - Type Import Issues")
    report.append("- Fix TS1361 errors: Use proper import syntax for types vs values")
    report.append("- Change import type to regular import for runtime values")
    report.append("- Impact: Runtime errors when types are used as values")
    report.append("")
    
    report.append("### 4. LOW PRIORITY - Cleanup")
    report.append("- Fix TS6133/TS6192 errors: Remove unused imports and declarations")
    report.append("- Impact: Code clarity and bundle size")
    report.append("")
    
    # Most problematic modules
    missing_export_files = Counter()
    for error in analysis['error_categories']['missing_exports']:
        if 'Module' in error['message'] and 'declares' in error['message']:
            # Extract module path from error message
            match = re.search(r'"([^"]+)"', error['message'])
            if match:
                missing_export_files[match.group(1)] += 1
    
    if missing_export_files:
        report.append("## Critical Files Needing Export Fixes")
        report.append("These files declare types locally but don't export them:")
        report.append("")
        for file_path, count in missing_export_files.most_common(10):
            short_path = '/'.join(file_path.split('/')[-2:])
            report.append(f"- **{short_path}**: {count} missing exports")
    
    return '\n'.join(report)

def main():
    # Read the error log
    with open('typescript_errors.log', 'r') as f:
        log_content = f.read()
    
    # Parse and analyze
    errors = parse_error_log(log_content)
    analysis = analyze_errors(errors)
    
    # Generate report
    report = generate_report(analysis)
    
    # Write report
    with open('typescript_error_analysis_report.md', 'w') as f:
        f.write(report)
    
    print("Analysis complete! Report saved to typescript_error_analysis_report.md")
    print(f"\nQuick Summary:")
    print(f"- Total errors: {analysis['total_errors']}")
    if analysis['by_code']:
        most_common = analysis['by_code'].most_common(1)[0]
        print(f"- Most common error: {most_common[0]} ({most_common[1]} occurrences)")
    if analysis['critical_files']:
        top_file = analysis['critical_files'][0]
        print(f"- Files with most errors: {top_file[1]} errors in {top_file[0].split('/')[-1]}")

if __name__ == "__main__":
    main()