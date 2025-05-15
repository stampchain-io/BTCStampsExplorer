#!/bin/bash
# deploy-local-changes.sh - Deploy uncommitted local changes to AWS
# Usage: ./scripts/deploy-local-changes.sh [--skip-build]

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
for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
  esac
done

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     Deploying Local Changes to AWS Environment      ${NC}"
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
    echo -e "${GREEN}Your local changes are now live.${NC}"
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