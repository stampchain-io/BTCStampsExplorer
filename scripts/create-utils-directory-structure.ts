#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Create the new lib/utils directory structure
 * Task 22.2: Create New Subdirectory Structure with Proper Organization
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";

const baseDir = "./lib/utils";

// Directory structure based on refined categorization
const directories = [
  // Security
  "security",
  
  // UI with subdirectories
  "ui",
  "ui/accessibility",
  "ui/formatting", 
  "ui/media",
  "ui/notifications",
  "ui/rendering",
  
  // Bitcoin with subdirectories
  "bitcoin",
  "bitcoin/calculations",
  "bitcoin/minting",
  "bitcoin/minting/olga",
  "bitcoin/network",
  "bitcoin/scripts",
  "bitcoin/src20",
  "bitcoin/stamps",
  "bitcoin/transactions",
  "bitcoin/utxo",
  
  // API with subdirectories
  "api",
  "api/adapters",
  "api/headers",
  "api/responses",
  "api/versioning",
  
  // Data with subdirectories
  "data",
  "data/binary",
  "data/filtering",
  "data/identifiers",
  "data/numbers",
  "data/pagination",
  "data/processing",
  "data/protocols",
  "data/sorting",
  
  // Navigation
  "navigation",
  
  // Monitoring with subdirectories
  "monitoring",
  "monitoring/errors",
  "monitoring/logging",
  "monitoring/metrics",
  "monitoring/notifications",
  
  // Performance with subdirectories
  "performance",
  "performance/fees",
  "performance/signals",
  "performance/storage",
  
  // Shared for cross-cutting concerns
  "shared"
];

// README content for each main category
const readmeContents: Record<string, string> = {
  "security": `# Security Utilities

This directory contains security-related utilities for the application.

## Contents

- Authentication utilities
- Encryption and cryptography utilities
- Security headers configuration
- Client-side security utilities

## Usage

Import security utilities using:
\`\`\`typescript
import { securityUtils } from "$lib/utils/security";
\`\`\`
`,

  "ui": `# UI Utilities

This directory contains user interface and formatting utilities.

## Subdirectories

- **accessibility/** - Accessibility utilities
- **formatting/** - Text and data formatting utilities
- **media/** - Image and media handling utilities
- **notifications/** - Toast and notification utilities
- **rendering/** - HTML, SVG, and rendering utilities

## Usage

Import UI utilities using:
\`\`\`typescript
import { formatUtils } from "$lib/utils/ui/formatting";
import { imageUtils } from "$lib/utils/ui/media";
\`\`\`
`,

  "bitcoin": `# Bitcoin Utilities

This directory contains Bitcoin and blockchain-related utilities.

## Subdirectories

- **calculations/** - Bitcoin calculation utilities
- **minting/** - Transaction minting and construction utilities
- **network/** - Network and mempool utilities
- **scripts/** - Bitcoin script utilities
- **src20/** - SRC20 token utilities
- **stamps/** - Bitcoin stamps utilities
- **transactions/** - Transaction utilities
- **utxo/** - UTXO management utilities

## Usage

Import Bitcoin utilities using:
\`\`\`typescript
import { btcCalculations } from "$lib/utils/bitcoin/calculations";
import { utxoUtils } from "$lib/utils/bitcoin/utxo";
\`\`\`
`,

  "api": `# API Utilities

This directory contains API and network communication utilities.

## Subdirectories

- **adapters/** - API endpoint adapters
- **headers/** - HTTP header utilities
- **responses/** - Response handling utilities
- **versioning/** - API versioning utilities

## Usage

Import API utilities using:
\`\`\`typescript
import { apiResponseUtil } from "$lib/utils/api/responses";
import { headerUtils } from "$lib/utils/api/headers";
\`\`\`
`,

  "data": `# Data Processing Utilities

This directory contains data processing and manipulation utilities.

## Subdirectories

- **binary/** - Binary and encoding utilities
- **filtering/** - Data filtering utilities
- **identifiers/** - Identifier utilities
- **numbers/** - Number manipulation utilities
- **pagination/** - Pagination utilities
- **processing/** - General data processing utilities
- **protocols/** - Protocol utilities
- **sorting/** - Sorting utilities and state management

## Usage

Import data utilities using:
\`\`\`typescript
import { paginationUtils } from "$lib/utils/data/pagination";
import { sortingConstants } from "$lib/utils/data/sorting";
\`\`\`
`,

  "navigation": `# Navigation Utilities

This directory contains navigation and routing utilities.

## Contents

- Fresh framework navigation utilities
- Route management utilities

## Usage

Import navigation utilities using:
\`\`\`typescript
import { freshNavigationUtils } from "$lib/utils/navigation";
\`\`\`
`,

  "monitoring": `# Monitoring Utilities

This directory contains monitoring, logging, and error handling utilities.

## Subdirectories

- **errors/** - Error handling utilities
- **logging/** - Logging utilities
- **metrics/** - Monitoring and metrics utilities
- **notifications/** - User notification utilities

## Usage

Import monitoring utilities using:
\`\`\`typescript
import { logger } from "$lib/utils/monitoring/logging";
import { errorHandlingUtils } from "$lib/utils/monitoring/errors";
\`\`\`
`,

  "performance": `# Performance Utilities

This directory contains performance optimization utilities.

## Subdirectories

- **fees/** - Fee estimation utilities
- **signals/** - Signal management utilities
- **storage/** - Storage utilities (localStorage, etc.)

## Contents

- Debounce utilities
- Performance optimization utilities

## Usage

Import performance utilities using:
\`\`\`typescript
import { debounce } from "$lib/utils/performance";
import { feeSignal } from "$lib/utils/performance/signals";
\`\`\`
`,

  "shared": `# Shared Utilities

This directory contains cross-cutting utilities that don't fit into a single category.

## Contents

Utilities that are used across multiple categories or have mixed responsibilities.

## Usage

Import shared utilities using:
\`\`\`typescript
import { sharedUtil } from "$lib/utils/shared";
\`\`\`
`
};

async function createDirectoryStructure() {
  console.log("🏗️  Creating lib/utils directory structure...\n");
  
  // Create all directories
  for (const dir of directories) {
    const fullPath = join(baseDir, dir);
    await ensureDir(fullPath);
    console.log(`✅ Created: ${fullPath}`);
  }
  
  console.log("\n📝 Creating README files...\n");
  
  // Create README files for main categories
  for (const [category, content] of Object.entries(readmeContents)) {
    const readmePath = join(baseDir, category, "README.md");
    await Deno.writeTextFile(readmePath, content);
    console.log(`✅ Created README: ${readmePath}`);
  }
  
  // Create .gitkeep files for empty directories
  console.log("\n📄 Creating .gitkeep files for empty directories...\n");
  
  const emptyDirs = [
    "shared", // Will be empty initially
  ];
  
  for (const dir of emptyDirs) {
    const gitkeepPath = join(baseDir, dir, ".gitkeep");
    await Deno.writeTextFile(gitkeepPath, "");
    console.log(`✅ Created .gitkeep: ${gitkeepPath}`);
  }
  
  console.log("\n✨ Directory structure created successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Created ${directories.length} directories`);
  console.log(`- Created ${Object.keys(readmeContents).length} README files`);
  console.log(`- Created ${emptyDirs.length} .gitkeep files`);
}

// Run the script
if (import.meta.main) {
  await createDirectoryStructure();
}