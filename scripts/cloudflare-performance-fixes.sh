#!/bin/bash
# BTCStampsExplorer - Cloudflare Performance Fixes
# Implements critical configuration changes identified in performance investigation
# Generated: November 14, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load Cloudflare credentials from .env
if [ -f "$(dirname "$0")/../.env" ]; then
    source "$(dirname "$0")/../.env"
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Verify required environment variables
if [ -z "$CLOUDFLARE_EMAIL" ] || [ -z "$CLOUDFLARE_API_KEY" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo -e "${RED}Error: Missing required Cloudflare credentials in .env${NC}"
    echo "Required: CLOUDFLARE_EMAIL, CLOUDFLARE_API_KEY, CLOUDFLARE_ZONE_ID"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cloudflare Performance Optimization${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Zone: stampchain.io"
echo "Zone ID: $CLOUDFLARE_ZONE_ID"
echo ""

# Function to make Cloudflare API calls
cf_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    curl -s -X "$method" \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}${endpoint}" \
        -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
        -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" \
        -H "Content-Type: application/json" \
        ${data:+-d "$data"}
}

# Backup current settings
echo -e "${YELLOW}Step 1: Backing up current settings...${NC}"
mkdir -p backups
BACKUP_FILE="backups/cloudflare-settings-backup-$(date +%Y%m%d-%H%M%S).json"
cf_api "GET" "/settings" > "$BACKUP_FILE"
echo -e "${GREEN}✓ Settings backed up to: $BACKUP_FILE${NC}"
echo ""

# Critical Fix #1: Disable Browser Integrity Check
echo -e "${YELLOW}Step 2: Checking Browser Integrity Check setting...${NC}"
BROWSER_CHECK=$(cf_api "GET" "/settings/browser_check" | jq -r '.result.value')
echo "Current value: $BROWSER_CHECK"

if [ "$BROWSER_CHECK" == "on" ]; then
    echo -e "${YELLOW}⚠️  Browser Integrity Check is ON - this blocks non-browser API consumers${NC}"
    read -p "Disable Browser Integrity Check globally? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Disabling Browser Integrity Check..."
        RESULT=$(cf_api "PATCH" "/settings/browser_check" '{"value":"off"}')
        SUCCESS=$(echo "$RESULT" | jq -r '.success')
        if [ "$SUCCESS" == "true" ]; then
            echo -e "${GREEN}✓ Browser Integrity Check disabled${NC}"
        else
            echo -e "${RED}✗ Failed to disable Browser Integrity Check${NC}"
            echo "$RESULT" | jq '.'
        fi
    else
        echo -e "${YELLOW}⚠️  Skipped - Consider creating Page Rule to disable for /api/* only${NC}"
    fi
else
    echo -e "${GREEN}✓ Browser Integrity Check already OFF${NC}"
fi
echo ""

# OPTIONAL Fix: Disable Rocket Loader
echo -e "${YELLOW}Step 3: Checking Rocket Loader setting (OPTIONAL)...${NC}"
ROCKET_LOADER=$(cf_api "GET" "/settings/rocket_loader" | jq -r '.result.value')
echo "Current value: $ROCKET_LOADER"

if [ "$ROCKET_LOADER" == "on" ]; then
    echo -e "${YELLOW}ℹ️  Rocket Loader is ON${NC}"
    echo "   - Affects: Frontend website HTML pages only"
    echo "   - Does NOT affect: API endpoints (JSON responses)"
    echo "   - May interfere with Fresh framework islands hydration"
    echo "   - Currently improving your frontend performance"
    echo ""
    echo -e "${GREEN}RECOMMENDATION: Leave it ON unless you see JavaScript errors${NC}"
    echo ""
    read -p "Disable Rocket Loader? (y/N - default N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Disabling Rocket Loader..."
        RESULT=$(cf_api "PATCH" "/settings/rocket_loader" '{"value":"off"}')
        SUCCESS=$(echo "$RESULT" | jq -r '.success')
        if [ "$SUCCESS" == "true" ]; then
            echo -e "${GREEN}✓ Rocket Loader disabled${NC}"
            echo -e "${YELLOW}⚠️  Monitor frontend performance after this change${NC}"
        else
            echo -e "${RED}✗ Failed to disable Rocket Loader${NC}"
            echo "$RESULT" | jq '.'
        fi
    else
        echo -e "${GREEN}✓ Keeping Rocket Loader enabled (recommended)${NC}"
    fi
else
    echo -e "${GREEN}✓ Rocket Loader already OFF${NC}"
fi
echo ""

# Page Rules - Note: These must be created via dashboard or separate API calls
echo -e "${YELLOW}Step 4: Page Rules Configuration${NC}"
echo -e "${YELLOW}⚠️  The following Page Rules should be created manually via Cloudflare Dashboard:${NC}"
echo ""
echo "Recommended Page Rules:"
echo "1. URL: stampchain.io/api/v1/*"
echo "   Setting: Cache Level = Bypass"
echo ""
echo "2. URL: stampchain.io/api/v2/*"
echo "   Setting: Cache Level = Bypass"
echo ""
echo "3. URL: stampchain.io/api/*"
echo "   Setting: Browser Integrity Check = OFF"
echo "   (Alternative to global disable)"
echo ""

# Get current page rules
echo "Current Page Rules:"
PAGERULES=$(cf_api "GET" "/pagerules")
echo "$PAGERULES" | jq -r '.result[] | "\(.id): \(.targets[0].constraint.value) → \(.actions | map(.id) | join(", "))"'
echo ""

# DDoS Settings - Note: Advanced DDoS cannot be modified via API
echo -e "${YELLOW}Step 5: DDoS Protection Settings${NC}"
echo -e "${YELLOW}⚠️  Advanced DDoS settings cannot be modified via API${NC}"
echo "Recommendations:"
echo "1. Create Firewall Rule to bypass DDoS checks for /api/* from trusted IPs"
echo "2. Or adjust sensitivity in Dashboard → Security → DDoS"
echo ""

# Security Level
echo -e "${YELLOW}Step 6: Security Level${NC}"
SECURITY_LEVEL=$(cf_api "GET" "/settings/security_level" | jq -r '.result.value')
echo "Current Security Level: $SECURITY_LEVEL"
echo -e "${YELLOW}⚠️  Consider using Page Rule to set 'Essentially Off' for /api/*${NC}"
echo "   (API endpoints protected by INTERNAL_API_KEY middleware)"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configuration Changes Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Changes Applied:"
echo "- Browser Integrity Check: Check output above"
echo "- Rocket Loader: Check output above"
echo ""
echo "Manual Actions Required:"
echo "1. Create Page Rules for API cache bypass"
echo "2. Configure DDoS sensitivity or create bypass rules"
echo "3. Consider API-specific security level Page Rule"
echo ""
echo -e "${YELLOW}⚠️  After making changes:${NC}"
echo "1. Test API endpoints: curl -v https://stampchain.io/api/v2/stamps?limit=10"
echo "2. Monitor CloudWatch logs for errors"
echo "3. Check Cloudflare analytics for blocked requests"
echo "4. Run: npm run test:api:comprehensive"
echo ""
echo -e "${GREEN}Backup saved to: $BACKUP_FILE${NC}"
echo -e "${GREEN}Review full report: PERFORMANCE_INVESTIGATION_CLOUDFLARE_AWS.md${NC}"
echo ""
