#!/bin/bash
# deploy-local.sh - Local Docker build and deployment to AWS ECR/ECS
# Builds linux/arm64 images for Graviton-based ECS Fargate
# Usage: ./scripts/deploy-local.sh [--yes] [--skip-monitor] [test_mode=true]

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse flags
AUTO_YES=false
SKIP_MONITOR=false
TEST_MODE=false
for arg in "$@"; do
  case "$arg" in
    --yes|-y) AUTO_YES=true ;;
    --skip-monitor) SKIP_MONITOR=true ;;
    test_mode=true) TEST_MODE=true ;;
  esac
done

PLATFORM=$(uname -s)
ARCH=$(uname -m)

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Local Docker Build & Deploy (${PLATFORM}/${ARCH})   ${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ "$TEST_MODE" = true ]; then
  echo -e "${YELLOW}Running in TEST MODE - no actual changes will be made${NC}"
fi

# Load environment
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env file...${NC}"
  set -a
  source .env
  set +a
else
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# AWS Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null)}
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO_NAME="btc-stamps-explorer"
ECR_REPOSITORY="${ECR_REGISTRY}/${ECR_REPO_NAME}"
IMAGE_TAG=${AWS_DOCKER_IMAGE_TAG:-"latest"}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION_TAG="prod-${TIMESTAMP}-g${GIT_COMMIT}"
ECS_CLUSTER_NAME=${AWS_ECS_CLUSTER_NAME:-"stamps-app-prod"}
ECS_SERVICE_NAME=${AWS_ECS_SERVICE_NAME:-"stamps-app-service"}

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Platform:       ${PLATFORM}/${ARCH}"
echo -e "  ECR Repository: ${ECR_REPOSITORY}"
echo -e "  Image Tag:      ${IMAGE_TAG}"
echo -e "  Version Tag:    ${VERSION_TAG}"
echo -e "  Git Commit:     ${GIT_COMMIT}"
echo -e "  ECS Cluster:    ${ECS_CLUSTER_NAME}"
echo -e "  ECS Service:    ${ECS_SERVICE_NAME}"

# Validate AWS credentials
echo -e "${YELLOW}Validating AWS credentials...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo -e "${RED}Error: AWS credentials not configured. Run 'aws configure' first.${NC}"
  exit 1
fi
echo -e "${GREEN}AWS credentials valid${NC}"

# Check for uncommitted changes (informational only)
echo -e "${YELLOW}Checking git status...${NC}"
if ! git diff --quiet 2>/dev/null || ! git diff --staged --quiet 2>/dev/null; then
  echo -e "${YELLOW}Note: Uncommitted changes detected. Building from current working tree.${NC}"
fi
echo -e "  Branch: $(git branch --show-current 2>/dev/null || echo 'detached')"
echo -e "  Commit: ${GIT_COMMIT}"

# Validate Docker is running
echo -e "${YELLOW}Validating Docker...${NC}"
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running.${NC}"
  if [ "$PLATFORM" = "Darwin" ]; then
    echo -e "${RED}Please start Docker Desktop.${NC}"
  else
    echo -e "${RED}Please start the Docker daemon: sudo systemctl start docker${NC}"
  fi
  exit 1
fi
echo -e "${GREEN}Docker is running${NC}"

# Confirm deployment
if [ "$AUTO_YES" = false ] && [ "$TEST_MODE" = false ]; then
  echo ""
  echo -e "${YELLOW}Ready to build and deploy to production.${NC}"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
  fi
fi

# Setup buildx for builds
# ECS Fargate runs on Graviton (ARM64) - build natively on ARM64 hosts
echo -e "${YELLOW}Setting up Docker buildx...${NC}"
BUILDER_NAME="stamps-builder"
if ! docker buildx ls 2>/dev/null | grep -q "${BUILDER_NAME}"; then
  if [ "$TEST_MODE" = true ]; then
    echo -e "  TEST MODE: Would create buildx builder '${BUILDER_NAME}'"
  else
    docker buildx create --name "${BUILDER_NAME}" --driver docker-container --use
    docker buildx inspect --bootstrap
  fi
else
  if [ "$TEST_MODE" = false ]; then
    docker buildx use "${BUILDER_NAME}"
  fi
fi
echo -e "${GREEN}Buildx ready${NC}"

# ECR Login
echo -e "${YELLOW}Logging into ECR...${NC}"
if [ "$TEST_MODE" = true ]; then
  echo -e "  TEST MODE: Would authenticate with ECR"
else
  aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}
fi

# Build for linux/arm64 (ECS Fargate runs on Graviton ARM64)
echo -e "${YELLOW}Building Docker image for linux/arm64...${NC}"
echo -e "${BLUE}Using buildx with registry layer caching...${NC}"
echo -e "${BLUE}This may take 3-8 minutes on first build...${NC}"

if [ "$TEST_MODE" = true ]; then
  echo -e "  TEST MODE: Would build with:"
  echo -e "    Platform: linux/arm64"
  echo -e "    Tags: ${ECR_REPOSITORY}:${IMAGE_TAG}, ${ECR_REPOSITORY}:${VERSION_TAG}"
  echo -e "    Cache: registry-based"
else
  docker buildx build \
    --platform linux/arm64 \
    --tag ${ECR_REPOSITORY}:${IMAGE_TAG} \
    --tag ${ECR_REPOSITORY}:${VERSION_TAG} \
    --cache-from type=registry,ref=${ECR_REPOSITORY}:buildcache \
    --cache-to type=registry,ref=${ECR_REPOSITORY}:buildcache,mode=max \
    --push \
    --progress=plain \
    .
fi

echo -e "${GREEN}Docker image built and pushed to ECR${NC}"

# Save tag info
echo "${VERSION_TAG}" > current-version-tag.txt
echo "${IMAGE_TAG}" > current-latest-tag.txt

# Force ECS deployment
echo -e "${YELLOW}Triggering ECS deployment...${NC}"
if [ "$TEST_MODE" = true ]; then
  echo -e "  TEST MODE: Would trigger force deployment on ${ECS_CLUSTER_NAME}/${ECS_SERVICE_NAME}"
else
  aws ecs update-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service ${ECS_SERVICE_NAME} \
    --force-new-deployment \
    --region ${AWS_REGION} \
    --query 'service.deployments[0].{status:status,desired:desiredCount,running:runningCount}' \
    --output table
fi

echo -e "${GREEN}Deployment triggered${NC}"

# Monitor deployment
if [ "$SKIP_MONITOR" = true ]; then
  echo -e "${YELLOW}Skipping deployment monitoring (--skip-monitor)${NC}"
  echo -e "${YELLOW}Monitor at: https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER_NAME}/services/${ECS_SERVICE_NAME}${NC}"
  exit 0
fi

if [ "$TEST_MODE" = true ]; then
  echo -e "  TEST MODE: Would monitor deployment for up to 10 minutes"
  echo -e "${GREEN}TEST MODE: Deployment simulation complete${NC}"
  echo "======================================================"
  echo "Version tag: ${VERSION_TAG}"
  echo "Image tag: ${IMAGE_TAG}"
  echo "======================================================"
  exit 0
fi

echo -e "${YELLOW}Monitoring deployment status (timeout: 10 minutes)...${NC}"
DEPLOYMENT_TIMEOUT=600
START_TIME=$(date +%s)
CUTOFF_TIME=$((START_TIME + DEPLOYMENT_TIMEOUT))

while [ $(date +%s) -lt $CUTOFF_TIME ]; do
  DEPLOYMENTS=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER_NAME} \
    --services ${ECS_SERVICE_NAME} \
    --region ${AWS_REGION} \
    --query 'services[0].deployments' \
    --output json 2>/dev/null)

  PRIMARY_DEPLOYMENT=$(echo "$DEPLOYMENTS" | jq -r '.[] | select(.status == "PRIMARY")')
  ROLLOUT_STATE=$(echo "$PRIMARY_DEPLOYMENT" | jq -r '.rolloutState')
  DESIRED_COUNT=$(echo "$PRIMARY_DEPLOYMENT" | jq -r '.desiredCount')
  RUNNING_COUNT=$(echo "$PRIMARY_DEPLOYMENT" | jq -r '.runningCount')
  ELAPSED=$(( $(date +%s) - START_TIME ))

  echo -e "${BLUE}[${ELAPSED}s] Rollout: ${ROLLOUT_STATE} | Running: ${RUNNING_COUNT}/${DESIRED_COUNT}${NC}"

  if [ "$ROLLOUT_STATE" = "COMPLETED" ]; then
    echo -e "${GREEN}Deployment completed successfully!${NC}"

    # Purge Cloudflare cache
    if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
      echo -e "${YELLOW}Purging Cloudflare cache...${NC}"
      curl -s -X POST \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"prefixes": ["stampchain.io/_frsh/", "stampchain.io/_fresh/"]}' | jq .
      echo -e "${GREEN}Cloudflare cache purged${NC}"
      sleep 5
    else
      echo -e "${YELLOW}Skipping Cloudflare cache purge (no credentials)${NC}"
    fi

    # Test health endpoint
    echo -e "${YELLOW}Testing health endpoint...${NC}"
    sleep 10
    HEALTH_RESPONSE=$(curl -s --max-time 10 https://stampchain.io/api/v2/health | jq -r '.status' 2>/dev/null || echo "timeout")

    if [ "$HEALTH_RESPONSE" = "OK" ]; then
      echo -e "${GREEN}Health check PASSED - Site is online!${NC}"
    else
      echo -e "${YELLOW}Health check response: ${HEALTH_RESPONSE}${NC}"
      echo -e "${YELLOW}Site may still be starting up...${NC}"
    fi

    echo "======================================================"
    echo "Version tag: ${VERSION_TAG}"
    echo "Image tag: ${IMAGE_TAG}"
    echo "======================================================"
    exit 0

  elif [ "$ROLLOUT_STATE" = "FAILED" ]; then
    echo -e "${RED}Deployment failed!${NC}"
    echo -e "${RED}Check ECS console for details:${NC}"
    echo -e "${RED}https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER_NAME}/services/${ECS_SERVICE_NAME}${NC}"
    exit 1
  fi

  sleep 30
done

echo -e "${YELLOW}Deployment still in progress after ${DEPLOYMENT_TIMEOUT}s timeout${NC}"
echo -e "${YELLOW}Monitor at: https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER_NAME}/services/${ECS_SERVICE_NAME}${NC}"
exit 2
