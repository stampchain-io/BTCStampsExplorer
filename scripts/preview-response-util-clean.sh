#!/bin/bash
# Preview ResponseUtil to ApiResponseUtil Migration Changes (DRY RUN)
# Usage: ./scripts/preview-response-util-clean.sh

echo "🔍 PREVIEW: ResponseUtil to ApiResponseUtil migration changes"
echo "============================================================"
echo ""

# Count how many files would be migrated
total_files=0
would_migrate=0
already_migrated=0
no_import=0

# List of API files that would be migrated
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

echo "Checking ${#files[@]} files..."
echo ""

for file in "${files[@]}"; do
  total_files=$((total_files + 1))

  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    continue
  fi

  # Check if file already uses ApiResponseUtil
  if grep -q "import.*ApiResponseUtil.*from.*apiResponseUtil" "$file"; then
    echo "✅ Already migrated: $file"
    already_migrated=$((already_migrated + 1))
    continue
  fi

  # Check if file uses ResponseUtil
  if ! grep -q "import.*ResponseUtil.*from.*responseUtil" "$file"; then
    echo "⏭️  No ResponseUtil import: $file"
    no_import=$((no_import + 1))
    continue
  fi

  would_migrate=$((would_migrate + 1))
  echo "🔄 Would migrate: $file"

  # Show what would change
  echo "   Import line would change from:"
  grep "import.*ResponseUtil.*from.*responseUtil" "$file" | sed 's/^/     /'
  echo "   To:"
  echo "     import { ApiResponseUtil } from \"\$lib/utils/apiResponseUtil.ts\";"

  # Show ResponseUtil method calls that would change
  method_calls=$(grep -n "ResponseUtil\." "$file" | wc -l)
  if [ $method_calls -gt 0 ]; then
    echo "   Method calls to change ($method_calls found):"
    grep -n "ResponseUtil\." "$file" | head -3 | sed 's/^/     /' | sed 's/ResponseUtil\./ApiResponseUtil./g'
    if [ $method_calls -gt 3 ]; then
      echo "     ... and $((method_calls - 3)) more"
    fi
  fi
  echo ""
done

echo "📊 SUMMARY:"
echo "   Total files checked: $total_files"
echo "   Would migrate: $would_migrate"
echo "   Already migrated: $already_migrated"
echo "   No ResponseUtil import: $no_import"
echo ""

if [ $would_migrate -gt 0 ]; then
  echo "🚀 Ready to migrate $would_migrate files!"
  echo "   Run: ./scripts/migrate-response-util-clean.sh"
else
  echo "✅ All files are already migrated or don't need migration!"
fi
