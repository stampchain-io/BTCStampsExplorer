#!/bin/bash

# Script to list all internal API endpoints and their security configuration
# Useful for auditing endpoint security

echo "Internal API Security Configuration"
echo "==================================="
echo ""

echo "Frontend-Accessible (InternalApiFrontendGuard):"
echo "Accepts: Browser from stampchain.io OR API key"
echo "-----------------------------------------------"
grep -l "InternalApiFrontendGuard" routes/api/internal/*.ts 2>/dev/null | while read file; do
    endpoint=$(echo $file | sed 's|routes/api/internal/||' | sed 's|.ts$||')
    echo "  ✓ /api/internal/$endpoint"
done

echo ""
echo "Backend-Only (InternalRouteGuard.requireAPIKey):"
echo "Accepts: API key ONLY"
echo "-----------------------------------------------"
grep -l "InternalRouteGuard.requireAPIKey" routes/api/internal/*.ts 2>/dev/null | while read file; do
    endpoint=$(echo $file | sed 's|routes/api/internal/||' | sed 's|.ts$||')
    echo "  🔒 /api/internal/$endpoint"
done

echo ""
echo "Unprotected Endpoints:"
echo "----------------------"
unprotected=$(grep -L "InternalApiFrontendGuard\|InternalRouteGuard" routes/api/internal/*.ts 2>/dev/null)
if [ -z "$unprotected" ]; then
    echo "  None - All endpoints are protected! ✅"
else
    echo "$unprotected" | while read file; do
        endpoint=$(echo $file | sed 's|routes/api/internal/||' | sed 's|.ts$||')
        echo "  ⚠️  /api/internal/$endpoint"
    done
fi

echo ""
echo "Security Summary:"
echo "-----------------"
frontend_count=$(grep -l "InternalApiFrontendGuard" routes/api/internal/*.ts 2>/dev/null | wc -l | tr -d ' ')
backend_count=$(grep -l "InternalRouteGuard.requireAPIKey" routes/api/internal/*.ts 2>/dev/null | wc -l | tr -d ' ')
total_count=$(ls routes/api/internal/*.ts 2>/dev/null | wc -l | tr -d ' ')

echo "Total endpoints: $total_count"
echo "Frontend-accessible: $frontend_count"
echo "Backend-only: $backend_count"
echo "Protected: $((frontend_count + backend_count))/$total_count"