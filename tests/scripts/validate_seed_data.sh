#!/bin/bash

# Test Seed Data Validation Script
# Validates scripts/test-seed-data.sql before committing
#
# Usage:
#   ./tests/scripts/validate_seed_data.sh
#   ./tests/scripts/validate_seed_data.sh --skip-db  # Skip database tests
#
# Exit codes:
#   0 - All validations passed
#   1 - Syntax validation failed
#   2 - Database validation failed
#   3 - File not found

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SEED_FILE="$PROJECT_ROOT/scripts/test-seed-data.sql"
SCHEMA_FILE="$PROJECT_ROOT/scripts/test-schema.sql"

# Parse arguments
SKIP_DB=0
if [[ "$1" == "--skip-db" ]]; then
  SKIP_DB=1
fi

# Print header
echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Test Seed Data Validation                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if seed data file exists
echo -e "${BLUE}▶ Checking file existence...${NC}"
if [[ ! -f "$SEED_FILE" ]]; then
  echo -e "${RED}✗ Error: File not found: $SEED_FILE${NC}"
  exit 3
fi

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo -e "${YELLOW}⚠ Warning: Schema file not found: $SCHEMA_FILE${NC}"
  echo -e "${YELLOW}  Database tests will be skipped${NC}"
  SKIP_DB=1
fi

echo -e "${GREEN}✓ Files found${NC}"
echo ""

# Quick syntax checks
echo -e "${BLUE}▶ Running quick syntax checks...${NC}"

ERRORS=0

# Check for plain INSERT statements (should use REPLACE or INSERT IGNORE)
if grep -Eq "^\s*INSERT\s+INTO\s+[^I]" "$SEED_FILE" 2>/dev/null; then
  if ! grep -Eq "^\s*INSERT\s+IGNORE\s+INTO" "$SEED_FILE" 2>/dev/null; then
    echo -e "${RED}✗ Found plain INSERT statements (should use REPLACE INTO or INSERT IGNORE)${NC}"
    grep -n "^\s*INSERT\s+INTO" "$SEED_FILE" | head -5
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check for DELETE or TRUNCATE
if grep -Eq "^\s*(DELETE|TRUNCATE)" "$SEED_FILE" 2>/dev/null; then
  echo -e "${RED}✗ Found DELETE or TRUNCATE statements (not allowed in seed data)${NC}"
  grep -n "^\s*\(DELETE\|TRUNCATE\)" "$SEED_FILE" | head -5
  ERRORS=$((ERRORS + 1))
fi

# Check for missing semicolons at end of VALUES clauses
if grep -Eq "VALUES.*[^;]\s*$" "$SEED_FILE" 2>/dev/null; then
  echo -e "${YELLOW}⚠ Warning: Some statements may be missing semicolons${NC}"
fi

# Check for UNHEX usage in collections
if grep -Eq "INTO\s+collections?\s*\(" "$SEED_FILE" 2>/dev/null; then
  if ! grep -q "UNHEX" "$SEED_FILE"; then
    echo -e "${RED}✗ Collections table found but no UNHEX() usage (required for BINARY(16) collection_id)${NC}"
    ERRORS=$((ERRORS + 1))
  else
    # Check UNHEX hex string length (should be 32 chars)
    UNHEX_STRINGS=$(grep -oE "UNHEX\(['\"][0-9A-Fa-f]+['\"]\)" "$SEED_FILE" | grep -oE "[0-9A-Fa-f]+" || true)
    while IFS= read -r hex; do
      if [[ ${#hex} -ne 32 ]]; then
        echo -e "${RED}✗ Invalid UNHEX hex string length: $hex (should be 32 characters)${NC}"
        ERRORS=$((ERRORS + 1))
      fi
    done <<< "$UNHEX_STRINGS"
  fi
fi

# Count minimum records
STAMPS_COUNT=$(grep -c "VALUES.*stamp.*cpid" "$SEED_FILE" || echo "0")
BLOCKS_COUNT=$(grep -c "VALUES.*block_index.*block_hash" "$SEED_FILE" || echo "0")

echo -e "${BLUE}  Approximate record counts:${NC}"
echo -e "    Stamps: ~${STAMPS_COUNT}"
echo -e "    Blocks: ~${BLOCKS_COUNT}"

if [[ $STAMPS_COUNT -lt 5 ]]; then
  echo -e "${YELLOW}⚠ Warning: Low stamp count (need at least 25 for pagination testing)${NC}"
fi

if [[ $BLOCKS_COUNT -lt 5 ]]; then
  echo -e "${YELLOW}⚠ Warning: Low block count (need at least 10)${NC}"
fi

if [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}✗ Quick syntax checks failed with $ERRORS errors${NC}"
  echo ""
  exit 1
else
  echo -e "${GREEN}✓ Quick syntax checks passed${NC}"
fi

echo ""

# Run unit tests (Deno required)
echo -e "${BLUE}▶ Running unit tests (SQL syntax validation)...${NC}"

if ! command -v deno &> /dev/null; then
  echo -e "${YELLOW}⚠ Deno not found, skipping unit tests${NC}"
  echo -e "${YELLOW}  Install Deno: https://deno.land/manual/getting_started/installation${NC}"
else
  UNIT_TEST_FILE="$PROJECT_ROOT/tests/unit/test_seed_data_syntax.test.ts"

  if [[ ! -f "$UNIT_TEST_FILE" ]]; then
    echo -e "${YELLOW}⚠ Unit test file not found: $UNIT_TEST_FILE${NC}"
  else
    if deno test --allow-read "$UNIT_TEST_FILE"; then
      echo -e "${GREEN}✓ Unit tests passed${NC}"
    else
      echo -e "${RED}✗ Unit tests failed${NC}"
      exit 1
    fi
  fi
fi

echo ""

# Run integration tests if database is available
if [[ $SKIP_DB -eq 1 ]]; then
  echo -e "${YELLOW}⚠ Skipping database tests (--skip-db flag or missing schema)${NC}"
else
  echo -e "${BLUE}▶ Running integration tests (database validation)...${NC}"

  # Check for MySQL
  if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠ MySQL client not found, skipping database tests${NC}"
    echo -e "${YELLOW}  Install MySQL client to run database validation${NC}"
  else
    # Check if we can connect
    DB_HOST="${TEST_DB_HOST:-localhost}"
    DB_USER="${TEST_DB_USER:-root}"
    DB_PASSWORD="${TEST_DB_PASSWORD:-}"
    DB_NAME="${TEST_DB_NAME:-btcstamps_test}"

    echo -e "${BLUE}  Testing database connection...${NC}"
    echo -e "    Host: $DB_HOST"
    echo -e "    User: $DB_USER"
    echo -e "    Database: $DB_NAME"

    if [[ -n "$DB_PASSWORD" ]]; then
      MYSQL_CMD="mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD"
    else
      MYSQL_CMD="mysql -h $DB_HOST -u $DB_USER"
    fi

    if $MYSQL_CMD -e "SELECT 1" &> /dev/null; then
      echo -e "${GREEN}  ✓ Database connection successful${NC}"

      # Run Deno integration tests if available
      if command -v deno &> /dev/null; then
        INTEGRATION_TEST_FILE="$PROJECT_ROOT/tests/integration/test_seed_data_validation.test.ts"

        if [[ -f "$INTEGRATION_TEST_FILE" ]]; then
          export TEST_DB_HOST="$DB_HOST"
          export TEST_DB_USER="$DB_USER"
          export TEST_DB_PASSWORD="$DB_PASSWORD"
          export TEST_DB_NAME="$DB_NAME"

          if deno test --allow-read --allow-env --allow-net "$INTEGRATION_TEST_FILE"; then
            echo -e "${GREEN}✓ Integration tests passed${NC}"
          else
            echo -e "${RED}✗ Integration tests failed${NC}"
            exit 2
          fi
        else
          echo -e "${YELLOW}⚠ Integration test file not found${NC}"
        fi
      fi
    else
      echo -e "${YELLOW}⚠ Cannot connect to database, skipping integration tests${NC}"
      echo -e "${YELLOW}  Set TEST_DB_HOST, TEST_DB_USER, TEST_DB_PASSWORD environment variables${NC}"
    fi
  fi
fi

echo ""

# Summary
echo -e "${BOLD}${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✓ All Validations Passed!                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}The seed data file is ready to commit.${NC}"
echo ""

exit 0
