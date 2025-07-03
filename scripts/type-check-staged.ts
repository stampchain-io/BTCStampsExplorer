#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * Advanced TypeScript checking for staged files
 * Used by pre-commit hooks and CI for incremental type safety
 */

interface TypeCheckResult {
  file: string;
  errors: string[];
  isCritical: boolean;
}

// Critical files that should have stricter type checking
const CRITICAL_FILES = [
  "server/database/",
  "server/services/",
  "server/controller/",
  "lib/utils/",
  "routes/api/",
];

// Files that can have more lenient type checking
const LENIENT_FILES = [
  "islands/",
  "components/",
  "tests/",
  "scripts/",
];

async function getStagedTypeScriptFiles(): Promise<string[]> {
  const cmd = new Deno.Command("git", {
    args: ["diff", "--cached", "--name-only"],
    stdout: "piped",
  });

  const result = await cmd.output();
  const output = new TextDecoder().decode(result.stdout);

  return output
    .split("\n")
    .filter((file) => file.match(/\.(ts|tsx)$/))
    .filter((file) => !file.match(/\.(test|spec)\.(ts|tsx)$/))
    .filter((file) => file.trim().length > 0);
}

function isCriticalFile(file: string): boolean {
  return CRITICAL_FILES.some((pattern) => file.startsWith(pattern));
}

function isLenientFile(file: string): boolean {
  return LENIENT_FILES.some((pattern) => file.startsWith(pattern));
}

async function checkFile(file: string): Promise<TypeCheckResult> {
  try {
    const cmd = new Deno.Command("deno", {
      args: ["check", file],
      stdout: "piped",
      stderr: "piped",
    });

    const result = await cmd.output();
    const stderr = new TextDecoder().decode(result.stderr);

    const errors = stderr
      .split("\n")
      .filter((line) => line.includes("[ERROR]"))
      .map((line) => line.trim());

    return {
      file,
      errors,
      isCritical: isCriticalFile(file),
    };
  } catch (error) {
    return {
      file,
      errors: [
        `Failed to check file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      isCritical: isCriticalFile(file),
    };
  }
}

async function main() {
  console.log("🔍 Checking TypeScript types for staged files...");

  const stagedFiles = await getStagedTypeScriptFiles();

  if (stagedFiles.length === 0) {
    console.log("📝 No TypeScript files staged for commit");
    return;
  }

  console.log(`📝 Found ${stagedFiles.length} staged TypeScript files:`);
  stagedFiles.forEach((file) => {
    const status = isCriticalFile(file)
      ? "🔥 CRITICAL"
      : isLenientFile(file)
      ? "💡 LENIENT"
      : "📋 NORMAL";
    console.log(`   ${status}: ${file}`);
  });

  console.log("\n🔍 Running type checks...");

  const results = await Promise.all(stagedFiles.map(checkFile));

  let totalErrors = 0;
  let criticalErrors = 0;
  let hasBlockingErrors = false;

  for (const result of results) {
    if (result.errors.length > 0) {
      totalErrors += result.errors.length;

      if (result.isCritical) {
        criticalErrors += result.errors.length;
        console.log(`\n❌ CRITICAL FILE: ${result.file}`);
        result.errors.forEach((error) => console.log(`   ${error}`));

        // Block commit for critical files with many errors
        if (result.errors.length > 5) {
          hasBlockingErrors = true;
        }
      } else {
        console.log(`\n⚠️  ${result.file}:`);
        result.errors.slice(0, 3).forEach((error) =>
          console.log(`   ${error}`)
        );
        if (result.errors.length > 3) {
          console.log(`   ... and ${result.errors.length - 3} more errors`);
        }
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files checked: ${stagedFiles.length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Critical file errors: ${criticalErrors}`);

  if (hasBlockingErrors) {
    console.log(
      `\n❌ COMMIT BLOCKED: Critical files have too many type errors`,
    );
    console.log(`💡 Please fix critical errors before committing:`);
    console.log(
      `   - Focus on files in server/database/, server/services/, etc.`,
    );
    console.log(`   - Use 'deno check <file>' to see detailed errors`);
    console.log(`   - Consider fixing a few errors at a time`);
    Deno.exit(1);
  } else if (totalErrors > 0) {
    console.log(
      `\n⚠️  Type errors found but commit allowed (gradual improvement mode)`,
    );
    console.log(`💡 Consider fixing these errors when convenient:`);
    console.log(`   - Run 'deno task analyze:types' to see all project errors`);
    console.log(`   - Focus on MISSING_TYPE and IMPLICIT_ANY errors first`);
    console.log(`   - Use 'deno check <file>' to check individual files`);
  } else {
    console.log(`\n✅ No TypeScript errors in staged files!`);
  }

  console.log(`\n🎉 Type check completed`);
}

if (import.meta.main) {
  await main();
}
