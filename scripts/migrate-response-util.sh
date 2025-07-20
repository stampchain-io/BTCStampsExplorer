#!/bin/bash
# Safe ResponseUtil to ApiResponseUtil Migration Script
# Usage: ./scripts/migrate-response-util.sh

set -e  # Exit on any error

echo "🔄 Starting SAFE ResponseUtil to ApiResponseUtil migration..."
echo ""

# Check if git is clean
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  WARNING: You have uncommitted changes!"
    echo "   Please commit or stash your changes first."
    echo "   Run: git status"
    exit 1
fi

# Backup current state
echo "📦 Creating backup branch..."
git branch "backup-before-response-util-migration-$(date +%Y%m%d-%H%M%S)" || true

# List of API files that need migration (verified safe)
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
  "routes/api/v2/src101/tx/[tx_hash].ts"
  "routes/api/v2/src101/tx/index.ts"
  "routes/api/v2/src101/index/[deploy_hash]/[index].ts"
  "routes/api/v2/src101/[deploy_hash]/[tokenid].ts"
  "routes/api/v2/src101/[deploy_hash]/total.ts"
  "routes/api/v2/src101/[deploy_hash]/address/[address_btc].ts"
  "routes/api/v2/src101/[deploy_hash]/index.ts"
  "routes/api/v2/src101/[deploy_hash]/deploy.ts"
  "routes/api/v2/src101/index.ts"
  "routes/api/v2/src101/create.ts"
  "routes/api/v2/fairmint/compose.ts"
  "routes/api/v2/fairmint/index.ts"
  "routes/api/v2/balance/getStampsBalance.ts"
  "routes/api/v2/utxo/ancestors/[address].ts"
  "routes/api/v2/docs.ts"
  "routes/api/v2/trx/stampattach.ts"
  "routes/api/v2/error.ts"
  "routes/api/v2/collections/creator/[creator].ts"
  "routes/api/v2/block/block_count/[...number].ts"
)

migrated=0
skipped=0
total=${#files[@]}

echo "🎯 Target: $total files to migrate"
echo ""

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    ((skipped++))
    continue
  fi

  # Check if file actually imports ResponseUtil from responseUtil.ts
  if ! grep -q 'import.*ResponseUtil.*from.*responseUtil' "$file"; then
    echo "⏭️  Skipping $file (already migrated or doesn't use ResponseUtil)"
    ((skipped++))
    continue
  fi

  echo "🔧 Migrating $file..."

  # Create backup
  cp "$file" "$file.backup"

  # Replace the import statement - more precise pattern
  sed -i.tmp 's/import { ResponseUtil } from "\$lib\/utils\/responseUtil\.ts";/import { ApiResponseUtil } from "\$lib\/utils\/apiResponseUtil.ts";/g' "$file"

  # Replace method calls
  sed -i.tmp 's/ResponseUtil\./ApiResponseUtil./g' "$file"

  # Clean up temp file
  rm "$file.tmp" 2>/dev/null || true

  # Verify the change worked
  if grep -q 'ApiResponseUtil' "$file" && ! grep -q 'ResponseUtil' "$file"; then
    rm "$file.backup"  # Remove backup if successful
    ((migrated++))
    echo "✅ Migrated $file ($migrated/$total)"
  else
    # Restore backup if something went wrong
    mv "$file.backup" "$file"
    echo "❌ Failed to migrate $file - restored from backup"
  fi
done

echo ""
echo "🎉 Migration Summary:"
echo "   ✅ Migrated: $migrated files"
echo "   ⏭️  Skipped: $skipped files"
echo "   🎯 Total: $total files"
echo ""

if [ $migrated -gt 0 ]; then
  echo "🧪 NEXT STEPS:"
  echo "   1. Review changes: git diff"
  echo "   2. Test the application: deno task dev"
  echo "   3. Run tests: deno task test"
  echo "   4. If everything works: git add . && git commit -m 'Migrate API routes from ResponseUtil to ApiResponseUtil'"
  echo ""
  echo "🔍 Quick verification:"
  echo "   - Files still using ResponseUtil: $(find routes/api -name "*.ts" -exec grep -l "ResponseUtil" {} \; | wc -l)"
  echo "   - Files now using ApiResponseUtil: $(find routes/api -name "*.ts" -exec grep -l "ApiResponseUtil" {} \; | wc -l)"
else
  echo "ℹ️  No files were migrated. All target files may already be migrated."
fi

echo ""
echo "⚠️  IMPORTANT: Review all changes before committing!"
