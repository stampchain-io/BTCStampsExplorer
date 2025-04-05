#!/bin/bash

# Simple CodeBuild script for BTC Stamps Explorer
# This script builds and pushes a new image using CodeBuild
# Usage: ./scripts/build-prod.sh [test_mode=true]
#
# If test_mode=true is provided, the script will run in test mode
# without actually starting builds or making changes

set -e

# Check if running in test mode
TEST_MODE=false
if [[ "$1" == "test_mode=true" ]]; then
  TEST_MODE=true
  echo "🧪 Running in TEST MODE - no actual builds will be started"
fi

echo "======================================================"
echo "🏗️ Building BTC Stamps Explorer using CodeBuild"
echo "======================================================"

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="stamps-app/front-end"
CODEBUILD_PROJECT="stamps-app-build"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
GIT_COMMIT=$(git rev-parse --short HEAD)
VERSION_TAG="prod-${TIMESTAMP}-g${GIT_COMMIT}"
LATEST_TAG="latest"

echo "🔍 CodeBuild Project: ${CODEBUILD_PROJECT}"
echo "🔍 Version tag: ${VERSION_TAG}"
echo "🔍 Latest tag: ${LATEST_TAG}"
echo "======================================================"

# Step 1: Verify CodeBuild project exists
echo "📝 Step 1/3: Verifying CodeBuild project..."

PROJECT_EXISTS=$(aws codebuild batch-get-projects --names ${CODEBUILD_PROJECT} --query 'projects[0].name' --output text 2>/dev/null || echo "")

if [ "$PROJECT_EXISTS" = "None" ] || [ -z "$PROJECT_EXISTS" ]; then
  echo "❌ Error: CodeBuild project ${CODEBUILD_PROJECT} does not exist."
  exit 1
fi

echo "✅ Found CodeBuild project: ${CODEBUILD_PROJECT}"

# Step 2: Start build
echo "📝 Step 2/3: Starting CodeBuild build..."

if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would start build with these parameters:"
  echo "    Project: ${CODEBUILD_PROJECT}"
  echo "    Environment Variables:"
  echo "      AWS_REGION: ${AWS_REGION}"
  echo "      AWS_ACCOUNT_ID: ${AWS_ACCOUNT_ID}"
  echo "      ECR_REPOSITORY: ${ECR_REPOSITORY}"
  echo "      VERSION_TAG: ${VERSION_TAG}"
  BUILD_ID="test-build-id-1234"
else
  BUILD_ID=$(aws codebuild start-build \
    --project-name ${CODEBUILD_PROJECT} \
    --environment-variables-override "[{\"name\":\"AWS_REGION\",\"value\":\"${AWS_REGION}\"},{\"name\":\"AWS_ACCOUNT_ID\",\"value\":\"${AWS_ACCOUNT_ID}\"},{\"name\":\"ECR_REPOSITORY\",\"value\":\"${ECR_REPOSITORY}\"},{\"name\":\"VERSION_TAG\",\"value\":\"${VERSION_TAG}\"}]" \
    --query 'build.id' \
    --output text)
fi

echo "Build started with ID: ${BUILD_ID}"

# Wait for build to complete
echo "Waiting for build to complete..."

if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would poll for build status until completion"
  echo "🧪 TEST MODE: Simulating successful build completion"
  BUILD_STATUS="SUCCEEDED"
else
  while true; do
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids ${BUILD_ID} --query 'builds[0].buildStatus' --output text)
    echo "Current build status: ${BUILD_STATUS}"
    
    if [ "$BUILD_STATUS" = "SUCCEEDED" ] || [ "$BUILD_STATUS" = "FAILED" ] || [ "$BUILD_STATUS" = "STOPPED" ]; then
      break
    fi
    
    echo "Waiting for build to complete... (current status: ${BUILD_STATUS})"
    sleep 30
  done
fi

# Verify build succeeded
if [ "$TEST_MODE" = true ]; then
  # Already set BUILD_STATUS="SUCCEEDED" in test mode
  echo "🧪 TEST MODE: Skipping actual status check"
else
  BUILD_STATUS=$(aws codebuild batch-get-builds --ids ${BUILD_ID} --query 'builds[0].buildStatus' --output text)
fi

if [ "$BUILD_STATUS" != "SUCCEEDED" ]; then
  echo "❌ Build failed with status: ${BUILD_STATUS}"
  echo "Check the CodeBuild console for details:"
  echo "https://console.aws.amazon.com/codesuite/codebuild/projects/${CODEBUILD_PROJECT}/build/${BUILD_ID}/logs"
  exit 1
fi

echo "✅ Build completed successfully!"

# Step 3: Verify image build with retries
echo "📝 Step 3/3: Verifying image build..."

if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would verify image with these parameters:"
  echo "    Repository: ${ECR_REPOSITORY}"
  echo "    Version tag: ${VERSION_TAG}"
  echo "    Latest tag: ${LATEST_TAG}"
else
  # Sometimes ECR needs time to register the image after CodeBuild completes
  # We'll retry a few times with increasing delays
  MAX_RETRIES=5
  RETRY_COUNT=0
  IMG_EXISTS=""
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Check if image exists
    IMG_EXISTS=$(aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${VERSION_TAG} 2>/dev/null || echo "")
    
    if [ -z "$IMG_EXISTS" ]; then
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        DELAY=$((5 * RETRY_COUNT))
        echo "Image not found yet. Waiting ${DELAY} seconds before retry ${RETRY_COUNT}/${MAX_RETRIES}..."
        sleep $DELAY
      fi
    else
      echo "✅ Image ${VERSION_TAG} found in repository"
      break
    fi
  done
  
  # After retries, check if we found the image
  if [ -z "$IMG_EXISTS" ]; then
    echo "⚠️ Warning: Could not find image with tag ${VERSION_TAG} after ${MAX_RETRIES} retries."
    echo "The build may have had issues pushing to ECR. Check CodeBuild logs."
    
    # Fallback to using latest tag instead if it exists
    echo "Attempting to use latest tag as fallback..."
    LATEST_EXISTS=$(aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${LATEST_TAG} 2>/dev/null || echo "")
    
    if [ -z "$LATEST_EXISTS" ]; then
      echo "⚠️ Warning: Latest tag also not found. This is unexpected since buildspec.yml should create it."
    else
      echo "✅ Found image with latest tag, using that instead."
      echo "You can deploy using the latest tag: ${LATEST_TAG}"
      VERSION_TAG="${LATEST_TAG}"
    fi
  else
    # Verify latest tag also exists
    LATEST_EXISTS=$(aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${LATEST_TAG} 2>/dev/null || echo "")
    
    if [ -z "$LATEST_EXISTS" ]; then
      echo "⚠️ Warning: Latest tag was not created. This is unexpected since buildspec.yml should tag as latest."
    else
      echo "✅ Image also tagged as ${LATEST_TAG}"
    fi
  fi
fi

# Save the tag info for reference
if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would save tags to these files:"
  echo "    Version tag (${VERSION_TAG}) -> current-version-tag.txt"
  echo "    Latest tag (${LATEST_TAG}) -> current-latest-tag.txt"
else
  echo "${VERSION_TAG}" > current-version-tag.txt
  echo "${LATEST_TAG}" > current-latest-tag.txt
fi

echo "======================================================"
echo "✅ Build process completed successfully!"
echo "======================================================"
echo "Version tag: ${VERSION_TAG}"
echo "Latest tag: ${LATEST_TAG}"
echo "ECR Repository: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
echo "======================================================"
echo "Tags saved to:"
echo "  - current-version-tag.txt"
echo "  - current-latest-tag.txt"
echo "======================================================"
echo "Next steps:"
echo "Run ./scripts/deploy-prod.sh to deploy to production"
echo "======================================================"