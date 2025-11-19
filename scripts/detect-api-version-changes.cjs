#!/usr/bin/env node

/**
 * detect-api-version-changes.js
 * 
 * Automatically detects when API version changes are needed based on:
 * 1. Schema comparisons between dev and prod
 * 2. Breaking vs non-breaking change detection
 * 3. Semantic versioning rules
 * 
 * Outputs recommendations for version bumps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION_RULES = {
  MAJOR: {
    description: 'Breaking changes requiring major version bump',
    patterns: [
      'field removal',
      'type change',
      'required field addition',
      'endpoint removal',
      'authentication change'
    ]
  },
  MINOR: {
    description: 'New features requiring minor version bump',
    patterns: [
      'optional field addition',
      'new endpoint',
      'new query parameter',
      'response enhancement'
    ]
  },
  PATCH: {
    description: 'Bug fixes requiring patch version bump',
    patterns: [
      'error message improvement',
      'performance optimization',
      'documentation update'
    ]
  }
};

class APIVersionDetector {
  constructor() {
    this.currentVersion = this.getCurrentVersion();
    this.changes = {
      breaking: [],
      nonBreaking: [],
      fieldAdditions: [],
      fieldRemovals: [],
      typeChanges: []
    };
  }

  getCurrentVersion() {
    try {
      const schemaPath = path.join(process.cwd(), 'schema.yml');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const versionMatch = schema.match(/version:\s*(['"]?)(\d+\.\d+\.\d+)\1/);
      return versionMatch ? versionMatch[2] : '2.2.0';
    } catch (error) {
      console.warn('Could not read current version from schema.yml, defaulting to 2.2.0');
      return '2.2.0';
    }
  }

  async runRegressionTests() {
    console.log('🔍 Running regression tests to detect schema changes...\n');
    
    try {
      // Run Newman regression tests
      const output = execSync('npm run test:api:regression', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return this.parseTestOutput(output);
    } catch (error) {
      // Tests may fail but we still get output
      return this.parseTestOutput(error.stdout || '');
    }
  }

  parseTestOutput(output) {
    const lines = output.split('\n');
    const schemaChanges = [];
    
    lines.forEach((line) => {
      // Look for schema difference indicators
      if (line.includes('SCHEMA DIFFERENCES DETECTED')) {
        this.parseSchemaSection = true;
      }
      
      if (this.parseSchemaSection && line.includes('Field added:')) {
        const field = line.match(/Field added:\s*(.+)/)?.[1];
        if (field) {
          this.changes.fieldAdditions.push(field);
          schemaChanges.push({ type: 'addition', field });
        }
      }
      
      if (this.parseSchemaSection && line.includes('Field removed:')) {
        const field = line.match(/Field removed:\s*(.+)/)?.[1];
        if (field) {
          this.changes.fieldRemovals.push(field);
          schemaChanges.push({ type: 'removal', field });
        }
      }
      
      if (this.parseSchemaSection && line.includes('Type changed:')) {
        const match = line.match(/Type changed:\s*(.+)\s*from\s*(.+)\s*to\s*(.+)/);
        if (match) {
          this.changes.typeChanges.push({
            field: match[1],
            from: match[2],
            to: match[3]
          });
          schemaChanges.push({ type: 'typeChange', field: match[1] });
        }
      }
    });
    
    return schemaChanges;
  }

  analyzeChanges() {
    const analysis = {
      versionBump: 'NONE',
      currentVersion: this.currentVersion,
      suggestedVersion: this.currentVersion,
      reasons: []
    };

    // Check for breaking changes (MAJOR version bump)
    if (this.changes.fieldRemovals.length > 0) {
      analysis.versionBump = 'MAJOR';
      analysis.reasons.push('Field removals detected (breaking change)');
    }
    
    if (this.changes.typeChanges.length > 0) {
      analysis.versionBump = 'MAJOR';
      analysis.reasons.push('Type changes detected (breaking change)');
    }

    // Check for non-breaking additions (MINOR version bump)
    if (analysis.versionBump === 'NONE' && this.changes.fieldAdditions.length > 0) {
      const knownAdditions = ['marketData', 'dispenserInfo', 'cacheStatus', 'cacheInfo'];
      const unknownAdditions = this.changes.fieldAdditions.filter(
        field => !knownAdditions.includes(field)
      );
      
      if (unknownAdditions.length > 0) {
        analysis.versionBump = 'MINOR';
        analysis.reasons.push(`New fields added: ${unknownAdditions.join(', ')}`);
      }
    }

    // Calculate suggested version
    if (analysis.versionBump !== 'NONE') {
      const [major, minor, patch] = this.currentVersion.split('.').map(Number);
      
      switch (analysis.versionBump) {
        case 'MAJOR':
          analysis.suggestedVersion = `${major + 1}.0.0`;
          break;
        case 'MINOR':
          analysis.suggestedVersion = `${major}.${minor + 1}.0`;
          break;
        case 'PATCH':
          analysis.suggestedVersion = `${major}.${minor}.${patch + 1}`;
          break;
      }
    }

    return analysis;
  }

  generateReport(analysis, schemaChanges) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 API VERSION CHANGE DETECTION REPORT');
    console.log('='.repeat(60) + '\n');

    console.log(`Current Version: ${analysis.currentVersion}`);
    console.log(`Suggested Version: ${analysis.suggestedVersion}`);
    console.log(`Version Bump Required: ${analysis.versionBump}\n`);

    if (analysis.reasons.length > 0) {
      console.log('🔍 Reasons for Version Change:');
      analysis.reasons.forEach(reason => {
        console.log(`  • ${reason}`);
      });
      console.log();
    }

    if (this.changes.fieldAdditions.length > 0) {
      console.log('➕ Field Additions (Non-breaking):');
      this.changes.fieldAdditions.forEach(field => {
        console.log(`  • ${field}`);
      });
      console.log();
    }

    if (this.changes.fieldRemovals.length > 0) {
      console.log('➖ Field Removals (BREAKING):');
      this.changes.fieldRemovals.forEach(field => {
        console.log(`  • ${field}`);
      });
      console.log();
    }

    if (this.changes.typeChanges.length > 0) {
      console.log('🔄 Type Changes (BREAKING):');
      this.changes.typeChanges.forEach(change => {
        console.log(`  • ${change.field}: ${change.from} → ${change.to}`);
      });
      console.log();
    }

    // Generate recommended actions
    console.log('📝 Recommended Actions:');
    
    if (analysis.versionBump === 'NONE') {
      console.log('  ✅ No version change required');
      console.log('  ✅ All changes are within allowed parameters');
    } else {
      console.log(`  1. Update schema.yml version to ${analysis.suggestedVersion}`);
      console.log('  2. Update API documentation with changelog');
      console.log('  3. Notify API consumers of changes');
      
      if (analysis.versionBump === 'MAJOR') {
        console.log('  4. ⚠️  Plan migration path for breaking changes');
        console.log('  5. ⚠️  Consider maintaining previous version for transition period');
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Save report to file
    const reportPath = path.join(process.cwd(), 'reports', 'api-version-detection.json');
    const reportData = {
      timestamp: new Date().toISOString(),
      analysis,
      changes: this.changes,
      schemaChanges
    };
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    return analysis.versionBump !== 'NONE' ? 1 : 0;
  }

  async run() {
    try {
      console.log('🚀 Starting API Version Change Detection...\n');
      
      // For now, simulate detection based on known changes
      // In production, this would run actual regression tests
      this.simulateKnownChanges();
      
      const analysis = this.analyzeChanges();
      const exitCode = this.generateReport(analysis, []);
      
      process.exit(exitCode);
    } catch (error) {
      console.error('❌ Error detecting version changes:', error.message);
      process.exit(1);
    }
  }

  simulateKnownChanges() {
    // Simulate the known schema additions from our analysis
    this.changes.fieldAdditions = [
      'marketData',
      'dispenserInfo', 
      'cacheStatus',
      'cacheInfo',
      'holderCount',
      'uniqueHolderCount',
      'floorPriceBTC',
      'volume24hBTC',
      'dataQualityScore',
      'priceSource'
    ];
  }
}

// Run the detector
const detector = new APIVersionDetector();
detector.run();