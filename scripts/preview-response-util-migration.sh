#!/bin/bash
# Preview ResponseUtil to ApiResponseUtil Migration Changes
# Usage: ./scripts/preview-response-util-migration.sh

echo "🔍 PREVIEW: ResponseUtil to ApiResponseUtil migration changes"
echo "============================================================"
echo ""

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

would_migrate=0
already_migrated=0
not_found=0
total=${#files[@]}

echo "📊 Analysis Results:"
echo ""

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ $file (FILE NOT FOUND)"
    ((not_found++))
    continue
  fi

  # Check if file imports ResponseUtil from responseUtil.ts
  if grep -q 'import.*ResponseUtil.*from.*responseUtil' "$file"; then
    echo "🔄 $file"
    echo "   WOULD CHANGE:"
    echo "   📥 Import: ResponseUtil → ApiResponseUtil"

    # Count and show ResponseUtil method calls
    response_calls=$(grep -c 'ResponseUtil\.' "$file" 2>/dev/null || echo "0")
    echo "   🔧 Method calls: $response_calls ResponseUtil.* → ApiResponseUtil.*"

    # Show specific method calls being changed
    if [ "$response_calls" -gt 0 ]; then
      echo "   📋 Methods found:"
      grep -n 'ResponseUtil\.' "$file" | head -5 | while read -r line; do
        echo "      ${line}"
      done
      if [ "$response_calls" -gt 5 ]; then
        echo "      ... and $((response_calls - 5)) more"
      fi
    fi

    ((would_migrate++))
    echo ""
  else
    echo "✅ $file (already migrated or doesn't use ResponseUtil)"
    ((already_migrated++))
  fi
done

echo ""
echo "📈 MIGRATION SUMMARY:"
echo "   🔄 Would migrate: $would_migrate files"
echo "   ✅ Already migrated: $already_migrated files"
echo "   ❌ Not found: $not_found files"
echo "   📊 Total analyzed: $total files"
echo ""

if [ $would_migrate -gt 0 ]; then
  echo "🚀 TO PROCEED WITH MIGRATION:"
  echo "   ./scripts/migrate-response-util.sh"
  echo ""
  echo "📋 SAMPLE DIFF PREVIEW:"
  echo "   -import { ResponseUtil } from \"\$lib/utils/responseUtil.ts\";"
  echo "   +import { ApiResponseUtil } from \"\$lib/utils/apiResponseUtil.ts\";"
  echo "   -return ResponseUtil.badRequest(\"message\");"
  echo "   +return ApiResponseUtil.badRequest(\"message\");"
else
  echo "✨ All files are already migrated!"
fi

echo ""
echo "🔍 CURRENT STATUS:"
echo "   API files using ResponseUtil: $(find routes/api -name "*.ts" -exec grep -l "ResponseUtil" {} \; 2>/dev/null | wc -l)"
echo "   API files using ApiResponseUtil: $(find routes/api -name "*.ts" -exec grep -l "ApiResponseUtil" {} \; 2>/dev/null | wc -l)"
