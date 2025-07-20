#!/bin/bash
# Clean ResponseUtil to ApiResponseUtil Migration Script
# Usage: ./scripts/migrate-response-util-clean.sh

echo "🔄 Starting clean ResponseUtil to ApiResponseUtil migration..."
echo ""

# Count how many files we're migrating
total_files=0
migrated_files=0
skipped_files=0

# List of API files that need migration
files=(
  "routes/api/internal/debug-headers.ts"
  "routes/api/internal/creatorName.ts"
  "routes/api/v2/stamps/recentSales.ts"
  "routes/api/v2/stamps/ident/[ident].ts"
  "routes/api/v2/src20/balance/snapshot/[tick].ts"
  "routes/api/v2/src20/balance/[address]/[tick].ts"
  "routes/api/v2/src20/tx/[tx_hash].ts"
  "routes/api/v2/src20/[...op].ts"
  "routes/api/v2/src20/index.ts"
  "routes/api/v2/src20/create.ts"
  "routes/api/v2/src20/block/[block_index]/index.ts"
  "routes/api/v2/src20/tick/[tick]/index.ts"
  "routes/api/v2/src20/tick/[tick]/deploy.ts"
  "routes/api/v2/src20/tick/index.ts"
  "routes/api/v2/src101/balance/[address].ts"
  "routes/api/v2/src101/tokenids/[address].ts"
  "routes/api/v2/src101/deploy/[tick].ts"
  "routes/api/v2/src101/count/index.ts"
  "routes/api/v2/src101/index.ts"
  "routes/api/v2/src101/owners/[tick].ts"
  "routes/api/v2/stamps/balance/[address].ts"
  "routes/api/v2/stamps/supply/index.ts"
  "routes/api/v2/stamps/count/index.ts"
  "routes/api/v2/stamps/index.ts"
  "routes/api/v2/stamps/ident/[ident]/tokenids.ts"
  "routes/api/v2/create/send.ts"
  "routes/api/v2/create/deploy.ts"
  "routes/api/v2/create/mint.ts"
  "routes/api/v2/create/transfer.ts"
  "routes/api/v2/trx/stampattach.ts"
  "routes/api/v2/trx/stampdetach.ts"
  "routes/api/v2/blocks/index.ts"
  "routes/api/v2/versions/index.ts"
  "routes/api/v2/versions/changelog.ts"
)

echo "Files to migrate: ${#files[@]}"
echo ""

for file in "${files[@]}"; do
  total_files=$((total_files + 1))

  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    continue
  fi

  # Check if file already uses ApiResponseUtil
  if grep -q "import.*ApiResponseUtil.*from.*apiResponseUtil" "$file"; then
    echo "⏭️  Already migrated: $file"
    skipped_files=$((skipped_files + 1))
    continue
  fi

  # Check if file uses ResponseUtil
  if ! grep -q "import.*ResponseUtil.*from.*responseUtil" "$file"; then
    echo "⏭️  No ResponseUtil import: $file"
    skipped_files=$((skipped_files + 1))
    continue
  fi

  echo "🔄 Migrating: $file"

  # Create temporary file for the migration
  temp_file="${file}.tmp"

  # Perform the replacements
  sed 's|import { ResponseUtil } from "\$lib/utils/responseUtil\.ts";|import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";|g' "$file" | \
  sed 's|import.*{ ResponseUtil }.*from.*".*responseUtil\.ts";|import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";|g' | \
  sed 's|ResponseUtil\.|ApiResponseUtil.|g' > "$temp_file"

  # Replace original file with migrated version
  mv "$temp_file" "$file"

  migrated_files=$((migrated_files + 1))
  echo "✅ Migrated: $file"
done

echo ""
echo "🎉 Migration complete!"
echo "   Total files: $total_files"
echo "   Migrated: $migrated_files"
echo "   Skipped: $skipped_files"
echo ""
echo "Next steps:"
echo "1. Test your API endpoints to make sure everything works"
echo "2. Run 'deno task check:lint' to verify code quality"
echo "3. Run 'deno task check:fmt' to check formatting"
