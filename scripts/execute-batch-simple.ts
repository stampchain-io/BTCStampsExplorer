#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Simple Batch Processor for Import Alias Improvements
 * 
 * Executes actual import alias improvements based on analysis results
 */

interface ImportImprovement {
  file: string;
  line: number;
  currentImport: string;
  suggestedImport: string;
  impactLevel: "high" | "medium" | "low";
  improvementType: string;
  category: string;
  priority: number;
}

interface AnalysisReport {
  totalImprovements: number;
  batchStrategy: {
    batch1: ImportImprovement[];
    batch2: ImportImprovement[];
    batch3: ImportImprovement[];
    batch4: ImportImprovement[];
  };
}

async function processBatch(batchNumber: number, dryRun = false): Promise<void> {
  console.log(`\n🚀 Processing Batch ${batchNumber}...`);
  
  // Load analysis report
  const reportContent = await Deno.readTextFile("./scripts/import-alias-analysis-report.json");
  const report: AnalysisReport = JSON.parse(reportContent);
  
  let improvements: ImportImprovement[] = [];
  switch (batchNumber) {
    case 1: improvements = report.batchStrategy.batch1; break;
    case 2: improvements = report.batchStrategy.batch2; break;
    case 3: improvements = report.batchStrategy.batch3; break;
    case 4: improvements = report.batchStrategy.batch4; break;
    default: throw new Error(`Invalid batch number: ${batchNumber}`);
  }
  
  console.log(`📁 Found ${improvements.length} improvements to process`);
  
  if (improvements.length === 0) {
    console.log("✅ No improvements needed for this batch");
    return;
  }
  
  let processed = 0;
  let failed = 0;
  
  for (const improvement of improvements) {
    try {
      await processImprovement(improvement, dryRun);
      processed++;
      console.log(`  ✓ ${improvement.file}:${improvement.line}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ ${improvement.file}:${improvement.line} - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Batch ${batchNumber} Results:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success Rate: ${Math.round((processed / improvements.length) * 100)}%`);
}

async function processImprovement(improvement: ImportImprovement, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`[DRY RUN] Would update ${improvement.file}:${improvement.line}`);
    console.log(`    ${improvement.currentImport} → ${improvement.suggestedImport}`);
    return;
  }
  
  // Read the file
  const content = await Deno.readTextFile(improvement.file);
  const lines = content.split('\n');
  
  // Verify the line matches expectations
  const targetLine = lines[improvement.line - 1];
  if (!targetLine || !targetLine.includes(improvement.currentImport)) {
    throw new Error(`Import not found: expected "${improvement.currentImport}"`);
  }
  
  // Replace the import
  const updatedLine = targetLine.replace(
    improvement.currentImport,
    improvement.suggestedImport
  );
  lines[improvement.line - 1] = updatedLine;
  
  // Write the updated content
  const updatedContent = lines.join('\n');
  await Deno.writeTextFile(improvement.file, updatedContent);
}

// Main execution
const batchArg = Deno.args.find(arg => arg.startsWith('--batch='));
const dryRunArg = Deno.args.includes('--dry-run');

if (!batchArg) {
  console.error("Usage: deno run --allow-read --allow-write scripts/execute-batch-simple.ts --batch=<1-4> [--dry-run]");
  Deno.exit(1);
}

const batchNumber = parseInt(batchArg.split('=')[1]);
if (batchNumber < 1 || batchNumber > 4) {
  console.error("Batch number must be between 1 and 4");
  Deno.exit(1);
}

try {
  await processBatch(batchNumber, dryRunArg);
  
  if (!dryRunArg) {
    console.log("\n🔍 Running TypeScript check...");
    const typeCheckCmd = new Deno.Command("deno", {
      args: ["check", "."],
      stdout: "inherit",
      stderr: "inherit"
    });
    
    const result = await typeCheckCmd.output();
    if (result.success) {
      console.log("✅ TypeScript check passed");
    } else {
      console.error("❌ TypeScript check failed - you may need to review the changes");
    }
  }
  
  console.log("🎉 Batch processing completed!");
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  Deno.exit(1);
}