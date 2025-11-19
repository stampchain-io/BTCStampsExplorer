#!/bin/bash
# purge-fresh-cache.sh - Emergency script to purge Cloudflare cache for Fresh build artifacts
# Usage: ./scripts/purge-fresh-cache.sh [--all]
#   --all: Purge entire cache without prompting

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
PURGE_ALL=false
if [ "$1" = "--all" ]; then
  PURGE_ALL=true
fi

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env file...${NC}"
  set -a
  source .env
  set +a
fi

# Check for required environment variables
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo -e "${RED}Error: Missing CLOUDFLARE_ZONE_ID${NC}"
  echo -e "${YELLOW}Please set CLOUDFLARE_ZONE_ID in your .env file${NC}"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ] && [ -z "$CLOUDFLARE_API_KEY" ]; then
  echo -e "${RED}Error: Missing Cloudflare authentication${NC}"
  echo -e "${YELLOW}Please set either:${NC}"
  echo -e "${YELLOW}  CLOUDFLARE_API_TOKEN (recommended - scoped token)${NC}"
  echo -e "${YELLOW}  or CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL (global key)${NC}"
  exit 1
fi

# Set auth headers based on what's available
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  AUTH_HEADERS=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")
else
  AUTH_HEADERS=(-H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}")
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Purging Fresh Build Artifacts Cache ${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to purge specific URLs
purge_specific_urls() {
  local urls=("$@")
  local json_array=$(printf '"%s",' "${urls[@]}" | sed 's/,$//')
  
  curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    "${AUTH_HEADERS[@]}" \
    -H "Content-Type: application/json" \
    --data "{\"files\": [${json_array}]}"
}

# Try prefix-based purge first (requires Business or Enterprise plan)
echo -e "${YELLOW}Attempting to purge Fresh artifacts by prefix...${NC}"
PURGE_RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  "${AUTH_HEADERS[@]}" \
  -H "Content-Type: application/json" \
  --data '{
    "prefixes": [
      "stampchain.io/_frsh/",
      "stampchain.io/_fresh/"
    ]
  }')

if echo "$PURGE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Successfully purged Fresh artifacts by prefix${NC}"
  
  # Also purge main HTML pages
  echo -e "${YELLOW}Purging HTML pages to ensure fresh references...${NC}"
  HTML_URLS=(
    "https://stampchain.io/"
    "https://stampchain.io/stamp"
    "https://stampchain.io/src20"
    "https://stampchain.io/collection"
    "https://www.stampchain.io/"
    "https://www.stampchain.io/stamp"
    "https://www.stampchain.io/src20"
    "https://www.stampchain.io/collection"
  )
  
  HTML_PURGE=$(purge_specific_urls "${HTML_URLS[@]}")
  
  if echo "$HTML_PURGE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Successfully purged HTML pages${NC}"
  else
    echo -e "${YELLOW}⚠️ HTML page purge may have failed${NC}"
  fi
  
else
  ERROR_MSG=$(echo $PURGE_RESPONSE | jq -r '.errors[0].message // "Unknown error"')
  
  # Check if it's a plan limitation
  if echo "$ERROR_MSG" | grep -qi "prefix\|plan\|enterprise\|business"; then
    echo -e "${YELLOW}⚠️ Prefix purging not available on your Cloudflare plan${NC}"
    echo -e "${YELLOW}Prefix purging requires Business or Enterprise plan${NC}"
  else
    echo -e "${YELLOW}⚠️ Prefix purge failed: ${ERROR_MSG}${NC}"
  fi
  
  # Offer to purge everything
  if [ "$PURGE_ALL" = true ]; then
    CONFIRM="y"
  else
    echo -e "${YELLOW}Would you like to purge ALL cache instead? This will:${NC}"
    echo -e "${YELLOW}  - Clear all cached content (not just Fresh artifacts)${NC}"
    echo -e "${YELLOW}  - Force re-fetch from origin for all assets${NC}"
    echo -e "${YELLOW}  - May temporarily increase origin server load${NC}"
    echo -e "${YELLOW}Purge all cache? (y/n)${NC}"
    read -p "" -n 1 -r CONFIRM
    echo
  fi
  
  if [[ $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Purging entire cache...${NC}"
    FULL_PURGE=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      "${AUTH_HEADERS[@]}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}')
    
    if echo "$FULL_PURGE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Successfully purged entire cache${NC}"
      echo -e "${GREEN}All content will be re-fetched from origin on next request${NC}"
    else
      FULL_ERROR=$(echo $FULL_PURGE | jq -r '.errors[0].message // "Unknown error"')
      echo -e "${RED}❌ Full cache purge failed: ${FULL_ERROR}${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Cache purge cancelled${NC}"
    echo -e "${YELLOW}Note: Fresh artifacts may still be cached and cause 404 errors${NC}"
    echo -e "${YELLOW}To force purge all, run: $0 --all${NC}"
  fi
fi

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Cache purge completed!${NC}"
echo -e "${GREEN}======================================${NC}"