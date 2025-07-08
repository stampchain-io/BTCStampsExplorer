#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * Type check only staged TypeScript files
 * Useful for pre-commit hooks and local development
 */

interface FileCheckResult {
  file: string;
  hasErrors: boolean;
  errorOutput: string;
}

async function getStagedTypeScriptFiles(): Promise<string[]> {
  try {
    const cmd = new Deno.Command("git", {
      args: ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
      stdout: "piped",
      stderr: "piped",
    });

    const result = await cmd.output();
    const stdout = new TextDecoder().decode(result.stdout);

    if (!result.success) {
      console.error("❌ Failed to get staged files");
      return [];
    }

    const files = stdout
      .split("\n")
      .filter((file) => file.trim() !== "")
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !/\.(test|spec)\.(ts|tsx)$/.test(file)); // Exclude test files

    return files;
  } catch (error) {
    console.error("❌ Error getting staged files:", error);
    return [];
  }
}

async function checkFile(file: string): Promise<FileCheckResult> {
  try {
    const cmd = new Deno.Command("deno", {
      args: ["check", file],
      stdout: "piped",
      stderr: "piped",
    });

    const result = await cmd.output();
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);
    const output = stderr + stdout;

    return {
      file,
      hasErrors: !result.success,
      errorOutput: output,
    };
  } catch (error) {
    return {
      file,
      hasErrors: true,
      errorOutput: `Failed to check file: ${error}`,
    };
  }
}

async function main() {
  console.log("🔍 Checking staged TypeScript files for type errors...\n");

  const stagedFiles = await getStagedTypeScriptFiles();

  if (stagedFiles.length === 0) {
    console.log("📝 No staged TypeScript files found.");
    console.log("✅ Nothing to type check!");
    return;
  }

  console.log(`📝 Found ${stagedFiles.length} staged TypeScript file(s):`);
  stagedFiles.forEach((file) => console.log(`  - ${file}`));
  console.log("");

  const results: FileCheckResult[] = [];
  let filesWithErrors = 0;
  let totalErrors = 0;

  for (const file of stagedFiles) {
    console.log(`🔍 Checking: ${file}`);
    const result = await checkFile(file);
    results.push(result);

    if (result.hasErrors) {
      filesWithErrors++;
      console.log(`  ❌ Type errors found`);

      // Count errors in this file
      const errorCount = (result.errorOutput.match(/\[ERROR\]/g) || []).length;
      totalErrors += errorCount;

      // Show first few lines of errors for context
      const lines = result.errorOutput.split("\n").slice(0, 5);
      lines.forEach((line) => {
        if (line.trim()) {
          console.log(`    ${line}`);
        }
      });

      if (result.errorOutput.split("\n").length > 5) {
        console.log(`    ... (${errorCount} total errors in this file)`);
      }
    } else {
      console.log(`  ✅ No type errors`);
    }
    console.log("");
  }

  // Summary
  console.log("📊 Type Check Summary:");
  console.log(`  - Files checked: ${stagedFiles.length}`);
  console.log(`  - Files with errors: ${filesWithErrors}`);
  console.log(
    `  - Files without errors: ${stagedFiles.length - filesWithErrors}`,
  );
  console.log(`  - Total errors found: ${totalErrors}`);
  console.log("");

  if (filesWithErrors === 0) {
    console.log("🎉 All staged files pass type checking!");
    console.log("✅ Ready to commit!");
  } else {
    console.log("⚠️  Some staged files have type errors.");
    console.log("💡 Consider fixing these errors before committing:");
    console.log("");

    results
      .filter((r) => r.hasErrors)
      .forEach((r) => {
        console.log(`   📄 ${r.file}`);
        console.log(`      Run: deno check ${r.file}`);
      });

    console.log("");
    console.log("🎯 This is informational - you can still commit if needed.");
    console.log("🚀 Gradual improvement: fix errors when convenient!");
  }

  // Exit with success regardless of errors (gradual improvement mode)
  // Uncomment the next line if you want to fail on any type errors:
  // Deno.exit(filesWithErrors > 0 ? 1 : 0);
}

if (import.meta.main) {
  await main();
}
