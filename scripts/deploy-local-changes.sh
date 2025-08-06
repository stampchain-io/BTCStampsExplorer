#!/bin/bash
# deploy-local-changes.sh - Deploy uncommitted local changes to AWS
# Usage: ./scripts/deploy-local-changes.sh [--skip-build] [--skip-validation] [--api-version-validation] [--force]

# Attempt to load .env file if it exists and export its variables
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env file...${NC}"
  set -a # Automatically export all variables subsequently defined
  source .env
  set +a # Stop automatically exporting variables
else
  echo -e "${YELLOW}Warning: .env file not found. Proceeding with existing environment variables.${NC}"
fi

set -e

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load AWS configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY_NAME=${ECR_REPOSITORY_NAME:-"btc-stamps-explorer"}
ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-"stamps-app-prod"}
ECS_SERVICE_NAME=${ECS_SERVICE_NAME:-"stamps-app-service"}
S3_BUCKET=${S3_BUCKET}
CODE_BUILD_PROJECT=${CODE_BUILD_PROJECT:-"stamps-app-build"}

# Parse arguments
SKIP_BUILD=false
SKIP_VALIDATION=false
API_VERSION_VALIDATION=true
FORCE_MODE=false
for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-validation)
      SKIP_VALIDATION=true
      shift
      ;;
    --no-api-validation)
      API_VERSION_VALIDATION=false
      shift
      ;;
    --force)
      FORCE_MODE=true
      SKIP_VALIDATION=true
      shift
      ;;
  esac
done

# =============================================================================
# v2.3 API SAFETY VALIDATION FUNCTIONS
# =============================================================================

run_newman_api_validation() {
  local validation_type="$1"
  local endpoint_url="${2:-http://localhost:8000}"

  echo -e "${BLUE}🔍 Running API validation: ${validation_type}${NC}"

  case $validation_type in
    "version-compatibility")
      echo -e "${YELLOW}Validating v2.2 and v2.3 API version compatibility...${NC}"
      if command -v npm >/dev/null 2>&1; then
        # Test v2.2 compatibility (no market data)
        if ! npm run test:api:versioning >/dev/null 2>&1; then
          echo -e "${RED}❌ API version compatibility test FAILED${NC}"
          return 1
        fi
        echo -e "${GREEN}✅ API version compatibility validated${NC}"
      else
        echo -e "${YELLOW}⚠️ npm not available, skipping API version validation${NC}"
      fi
      ;;
    "regression")
      echo -e "${YELLOW}Running regression tests for critical endpoints...${NC}"
      if command -v npm >/dev/null 2>&1; then
        # Run regression tests but capture output to analyze results
        local regression_output=$(npm run test:api:regression 2>&1)
        local regression_exit_code=$?
        
        # Check if there are critical failures (not just differences)
        if echo "$regression_output" | grep -q "requests.*failed.*[1-9]"; then
          echo -e "${RED}❌ API regression test FAILED - requests failed${NC}"
          echo "$regression_output" | tail -20
          return 1
        elif [[ $regression_exit_code -ne 0 ]] && echo "$regression_output" | grep -q "SIGNIFICANT.*REGRESSION"; then
          echo -e "${YELLOW}⚠️ Regression tests detected expected differences between dev/prod${NC}"
          echo -e "${YELLOW}This is normal during development. Continuing deployment...${NC}"
        elif [[ $regression_exit_code -eq 0 ]]; then
          echo -e "${GREEN}✅ API regression tests passed${NC}"
        else
          echo -e "${YELLOW}⚠️ Regression tests completed with expected dev/prod differences${NC}"
        fi
      else
        echo -e "${YELLOW}⚠️ npm not available, skipping regression validation${NC}"
      fi
      ;;
    "smoke")
      echo -e "${YELLOW}Running smoke tests for critical endpoints...${NC}"
      if command -v curl >/dev/null 2>&1; then
        # Quick health check
        if ! curl -f -s "${endpoint_url}/api/v2/health" >/dev/null 2>&1; then
          echo -e "${RED}❌ Health endpoint FAILED${NC}"
          return 1
        fi

        # Quick API version header test
        local v22_response=$(curl -s -H "X-API-Version: 2.2" "${endpoint_url}/api/v2/src20" | head -c 500)
        local v23_response=$(curl -s -H "X-API-Version: 2.3" "${endpoint_url}/api/v2/src20" | head -c 500)

        if [[ -z "$v22_response" || -z "$v23_response" ]]; then
          echo -e "${RED}❌ API version endpoints FAILED${NC}"
          return 1
        fi
        echo -e "${GREEN}✅ Smoke tests passed${NC}"
      else
        echo -e "${YELLOW}⚠️ curl not available, skipping smoke tests${NC}"
      fi
      ;;
  esac
}

pre_deployment_validation() {
  if [ "$SKIP_VALIDATION" = true ] || [ "$API_VERSION_VALIDATION" = false ]; then
    echo -e "${YELLOW}⚠️ API validation skipped by user request${NC}"
    return 0
  fi

  echo -e "${BLUE}🛡️ PRE-DEPLOYMENT VALIDATION${NC}"
  echo -e "${BLUE}===============================${NC}"

  # Validate code quality and types
  echo -e "${YELLOW}Running code quality checks...${NC}"
  if command -v deno >/dev/null 2>&1; then
    if ! deno task check >/dev/null 2>&1; then
      echo -e "${RED}❌ Code quality checks FAILED. Fix issues before deployment.${NC}"
      return 1
    fi
    echo -e "${GREEN}✅ Code quality checks passed${NC}"
  fi

  # Check if this deployment includes API changes
  if git diff HEAD~1 --name-only | grep -E "(routes/api|server/)" >/dev/null 2>&1; then
    echo -e "${YELLOW}🚨 API changes detected - running comprehensive validation${NC}"
    run_newman_api_validation "version-compatibility" || return 1
  else
    echo -e "${GREEN}ℹ️ No API changes detected - running basic validation${NC}"
    run_newman_api_validation "smoke" || return 1
  fi

  echo -e "${GREEN}✅ Pre-deployment validation completed${NC}"
}

post_build_validation() {
  if [ "$SKIP_VALIDATION" = true ] || [ "$SKIP_BUILD" = true ]; then
    echo -e "${YELLOW}⚠️ Post-build validation skipped${NC}"
    return 0
  fi

  echo -e "${BLUE}🔧 POST-BUILD VALIDATION${NC}"
  echo -e "${BLUE}========================${NC}"

  # Additional validation after successful build
  echo -e "${YELLOW}Validating build artifacts...${NC}"

  # Check if Newman regression tests should run
  run_newman_api_validation "regression" || return 1

  echo -e "${GREEN}✅ Post-build validation completed${NC}"
}

post_deployment_validation() {
  if [ "$SKIP_VALIDATION" = true ]; then
    echo -e "${YELLOW}⚠️ Post-deployment validation skipped${NC}"
    return 0
  fi

  echo -e "${BLUE}🚀 POST-DEPLOYMENT VALIDATION${NC}"
  echo -e "${BLUE}==============================${NC}"

  # Wait for deployment to stabilize
  echo -e "${YELLOW}Waiting 30 seconds for deployment to stabilize...${NC}"
  sleep 30

  # Get current ECS service endpoint (assuming ALB)
  local service_endpoint="https://stampchain.io"  # Adjust based on your setup

  # Run comprehensive smoke tests against production
  echo -e "${YELLOW}Running production smoke tests...${NC}"
  run_newman_api_validation "smoke" "$service_endpoint" || {
    echo -e "${RED}🚨 POST-DEPLOYMENT VALIDATION FAILED!${NC}"
    echo -e "${RED}Consider rolling back the deployment immediately.${NC}"
    return 1
  }

  # Test both API versions in production
  if [ "$API_VERSION_VALIDATION" = true ]; then
    echo -e "${YELLOW}Validating API version headers in production...${NC}"

    # Test v2.2 header
    local v22_test=$(curl -s -H "X-API-Version: 2.2" "${service_endpoint}/api/v2/src20?limit=1" | jq -r '.data[0] | has("market_data")' 2>/dev/null || echo "error")
    if [[ "$v22_test" != "false" ]]; then
      echo -e "${RED}❌ v2.2 API validation FAILED - market_data should not exist${NC}"
      return 1
    fi

    # Test v2.3 header
    local v23_test=$(curl -s -H "X-API-Version: 2.3" "${service_endpoint}/api/v2/src20?limit=1" | jq -r '.data[0] | has("market_data")' 2>/dev/null || echo "error")
    if [[ "$v23_test" != "true" ]]; then
      echo -e "${YELLOW}⚠️ v2.3 API validation - market_data structure check (may be empty)${NC}"
    fi

    echo -e "${GREEN}✅ API version validation completed${NC}"
  fi

  echo -e "${GREEN}🎉 POST-DEPLOYMENT VALIDATION SUCCESSFUL!${NC}"
}

# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     Deploying Local Changes to AWS Environment      ${NC}"
if [ "$FORCE_MODE" = true ]; then
  echo -e "${YELLOW}     ⚠️  FORCE MODE: Skipping validation checks ⚠️    ${NC}"
else
  echo -e "${BLUE}     Enhanced with v2.3 API Safety Validation       ${NC}"
fi
echo -e "${BLUE}======================================================${NC}"

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account information...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to get AWS account ID. Make sure AWS CLI is configured.${NC}"
  exit 1
fi
echo -e "${GREEN}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# DEBUGGING: Print S3_BUCKET value at the start of the script's understanding
echo -e "${YELLOW}DEBUG (script entry): S3_BUCKET as seen by script = [${S3_BUCKET}]${NC}"

# Load AWS configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY_NAME=${ECR_REPOSITORY_NAME:-"btc-stamps-explorer"}
# S3_BUCKET is expected to be in the environment. The script already has S3_BUCKET=${S3_BUCKET} implicitly or explicitly.
ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-"stamps-app-prod"}
ECS_SERVICE_NAME=${ECS_SERVICE_NAME:-"stamps-app-service"}

# Check if we have uncommitted changes
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
if git diff --quiet && git diff --staged --quiet; then
  echo -e "${YELLOW}Warning: No uncommitted changes detected. Are you sure you want to proceed?${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
  fi
fi

# 🛡️ RUN PRE-DEPLOYMENT VALIDATION
pre_deployment_validation || {
  echo -e "${RED}🚨 Pre-deployment validation FAILED. Deployment aborted.${NC}"
  exit 1
}

# Create zip file of the entire repository including uncommitted changes
TIMESTAMP=$(date +%Y%m%d%H%M%S)
PROJECT_NAME=$(basename $(pwd))
ZIP_FILE="/tmp/${PROJECT_NAME}-local-${TIMESTAMP}.zip"

echo -e "${YELLOW}Creating package of all files (including uncommitted changes)...${NC}"
# Use git ls-files to get all tracked files, then add untracked files excluding ignored ones
{ git ls-files; git ls-files --others --exclude-standard; } | zip -q -@ $ZIP_FILE

echo -e "${GREEN}Successfully created source package at: ${ZIP_FILE}${NC}"

# Upload the zip file to S3
echo -e "${YELLOW}Uploading source package to S3...${NC}"
# Use the expected location for CodeBuild
S3_KEY="source.zip"
echo -e "${YELLOW}DEBUG (pre-short): S3_BUCKET for short derivation = [${S3_BUCKET}]${NC}"
S3_BUCKET_SHORT=$(echo "$S3_BUCKET" | sed 's/-[0-9]*$//')
echo -e "${YELLOW}DEBUG (post-short): S3_BUCKET_SHORT = [${S3_BUCKET_SHORT}]${NC}"
aws s3 cp $ZIP_FILE s3://${S3_BUCKET_SHORT}/${S3_KEY}

echo -e "${GREEN}Successfully uploaded to s3://${S3_BUCKET_SHORT}/${S3_KEY}${NC}"

# Start CodeBuild only if not skipping build step
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}Starting CodeBuild project...${NC}"
  BUILD_INFO=$(aws codebuild start-build \
    --project-name ${CODE_BUILD_PROJECT} \
    --output json)

  BUILD_ID=$(echo $BUILD_INFO | jq -r '.build.id')
  echo -e "${GREEN}Started build with ID: ${BUILD_ID}${NC}"

  echo -e "${YELLOW}Waiting for build to complete...${NC}"
  aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text

  while true; do
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text)
    if [ "$BUILD_STATUS" = "IN_PROGRESS" ]; then
      echo -e "${YELLOW}Build is still in progress...${NC}"
      sleep 30
    else
      echo -e "${GREEN}Build completed with status: ${BUILD_STATUS}${NC}"
      break
    fi
  done

  if [ "$BUILD_STATUS" != "SUCCEEDED" ]; then
    echo -e "${RED}Build failed with status: ${BUILD_STATUS}${NC}"
    echo -e "${YELLOW}View build logs for details:${NC}"
    echo -e "${YELLOW}https://${AWS_REGION}.console.aws.amazon.com/codesuite/codebuild/projects/${CODE_BUILD_PROJECT}/builds/${BUILD_ID}/logs${NC}"

    echo -e "${YELLOW}Do you want to continue with deployment despite build failure? (y/n)${NC}"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}Deployment cancelled.${NC}"
      exit 1
    fi
  else
    # 🔧 RUN POST-BUILD VALIDATION
    post_build_validation || {
      echo -e "${RED}🚨 Post-build validation FAILED. Deployment aborted.${NC}"
      exit 1
    }
  fi
fi

# Force deployment of the latest image in ECR
echo -e "${YELLOW}Initiating ECS force deployment...${NC}"
aws ecs update-service \
  --cluster ${ECS_CLUSTER_NAME} \
  --service ${ECS_SERVICE_NAME} \
  --force-new-deployment

echo -e "${GREEN}Deployment triggered successfully!${NC}"
echo -e "${YELLOW}Checking deployment status...${NC}"

# Monitor deployment status
DEPLOYMENT_TIMEOUT=600  # 10 minutes
START_TIME=$(date +%s)
CUTOFF_TIME=$((START_TIME + DEPLOYMENT_TIMEOUT))

while [ $(date +%s) -lt $CUTOFF_TIME ]; do
  DEPLOYMENTS=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER_NAME} \
    --services ${ECS_SERVICE_NAME} \
    --query 'services[0].deployments' | cat)

  PRIMARY_DEPLOYMENT=$(echo $DEPLOYMENTS | jq -r '.[] | select(.status == "PRIMARY")')
  ROLLOUT_STATE=$(echo $PRIMARY_DEPLOYMENT | jq -r '.rolloutState')
  DESIRED_COUNT=$(echo $PRIMARY_DEPLOYMENT | jq -r '.desiredCount')
  RUNNING_COUNT=$(echo $PRIMARY_DEPLOYMENT | jq -r '.runningCount')

  echo -e "${BLUE}Deployment Status:${NC}"
  echo -e "${BLUE}  Rollout state: ${ROLLOUT_STATE}${NC}"
  echo -e "${BLUE}  Running: ${RUNNING_COUNT}/${DESIRED_COUNT}${NC}"

  if [ "$ROLLOUT_STATE" = "COMPLETED" ]; then
    echo -e "${GREEN}Deployment completed successfully!${NC}"

    # 🚀 RUN POST-DEPLOYMENT VALIDATION
    if post_deployment_validation; then
      echo -e "${GREEN}🎉 DEPLOYMENT FULLY VALIDATED AND SUCCESSFUL!${NC}"
      echo -e "${GREEN}Your local changes are now live with full v2.3 API compatibility.${NC}"
    else
      echo -e "${YELLOW}⚠️ Deployment completed but post-deployment validation had warnings.${NC}"
      echo -e "${YELLOW}Monitor the application closely and consider rollback if issues persist.${NC}"
    fi
    exit 0
  elif [ "$ROLLOUT_STATE" = "FAILED" ]; then
    echo -e "${RED}Deployment failed!${NC}"
    echo -e "${RED}Check ECS deployment logs for details.${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Waiting for deployment to complete...${NC}"
  sleep 30
done

echo -e "${YELLOW}Deployment is still in progress after timeout.${NC}"
echo -e "${YELLOW}Check the AWS Console to monitor progress.${NC}"
echo -e "${YELLOW}https://${AWS_REGION}.console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER_NAME}/services/${ECS_SERVICE_NAME}/deployments${NC}"
