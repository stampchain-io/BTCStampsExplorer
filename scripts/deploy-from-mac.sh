#!/bin/bash
# deploy-from-mac.sh - Efficient Mac ARM→x64 Docker build and deployment
# Bypasses CodeBuild quota issues by building locally with optimized buildx

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     Mac ARM → Linux x64 Docker Build & Deploy       ${NC}"
echo -e "${BLUE}======================================================${NC}"

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
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"947253282047"}
ECR_REPOSITORY="947253282047.dkr.ecr.us-east-1.amazonaws.com/btc-stamps-explorer"
IMAGE_TAG=${AWS_DOCKER_IMAGE_TAG:-"latest"}
ECS_CLUSTER_NAME=${AWS_ECS_CLUSTER_NAME:-"stamps-app-prod"}
ECS_SERVICE_NAME=${AWS_ECS_SERVICE_NAME:-"stamps-app-service"}

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  ECR Repository: ${ECR_REPOSITORY}"
echo -e "  Image Tag: ${IMAGE_TAG}"
echo -e "  ECS Cluster: ${ECS_CLUSTER_NAME}"
echo -e "  ECS Service: ${ECS_SERVICE_NAME}"

# Check for uncommitted changes
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
if git diff --quiet && git diff --staged --quiet; then
  echo -e "${YELLOW}Warning: No uncommitted changes detected.${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
  fi
fi

# Validate Docker is running
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker Desktop.${NC}"
  exit 1
fi

# Setup buildx for multi-platform builds (one-time setup)
echo -e "${YELLOW}Setting up Docker buildx for ARM→x64 builds...${NC}"
if ! docker buildx ls | grep -q "multiplatform"; then
  docker buildx create --name multiplatform --driver docker-container --use
  docker buildx inspect --bootstrap
else
  docker buildx use multiplatform
fi

# ECR Login
echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY}

# Build for linux/amd64 (ECS requires x64)
echo -e "${YELLOW}Building Docker image for linux/amd64 (this may take 3-5 minutes)...${NC}"
echo -e "${BLUE}Using optimized buildx with layer caching...${NC}"

docker buildx build \
  --platform linux/amd64 \
  --tag ${ECR_REPOSITORY}:${IMAGE_TAG} \
  --tag ${ECR_REPOSITORY}:$(date +%Y%m%d-%H%M%S) \
  --cache-from type=registry,ref=${ECR_REPOSITORY}:buildcache \
  --cache-to type=registry,ref=${ECR_REPOSITORY}:buildcache,mode=max \
  --push \
  --progress=plain \
  .

echo -e "${GREEN}✅ Docker image built and pushed to ECR${NC}"

# Force ECS deployment
echo -e "${YELLOW}Triggering ECS force deployment...${NC}"
aws ecs update-service \
  --cluster ${ECS_CLUSTER_NAME} \
  --service ${ECS_SERVICE_NAME} \
  --force-new-deployment \
  --region ${AWS_REGION}

echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"

# Monitor deployment
echo -e "${YELLOW}Monitoring deployment status...${NC}"
DEPLOYMENT_TIMEOUT=600  # 10 minutes
START_TIME=$(date +%s)
CUTOFF_TIME=$((START_TIME + DEPLOYMENT_TIMEOUT))

while [ $(date +%s) -lt $CUTOFF_TIME ]; do
  DEPLOYMENTS=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER_NAME} \
    --services ${ECS_SERVICE_NAME} \
    --region ${AWS_REGION} \
    --query 'services[0].deployments' | cat)

  PRIMARY_DEPLOYMENT=$(echo $DEPLOYMENTS | jq -r '.[] | select(.status == "PRIMARY")')
  ROLLOUT_STATE=$(echo $PRIMARY_DEPLOYMENT | jq -r '.rolloutState')
  DESIRED_COUNT=$(echo $PRIMARY_DEPLOYMENT | jq -r '.desiredCount')
  RUNNING_COUNT=$(echo $PRIMARY_DEPLOYMENT | jq -r '.runningCount')

  echo -e "${BLUE}Deployment Status:${NC}"
  echo -e "${BLUE}  Rollout state: ${ROLLOUT_STATE}${NC}"
  echo -e "${BLUE}  Running: ${RUNNING_COUNT}/${DESIRED_COUNT}${NC}"

  if [ "$ROLLOUT_STATE" = "COMPLETED" ]; then
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"

    # Purge Cloudflare cache
    if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
      echo -e "${YELLOW}Purging Cloudflare cache...${NC}"
      curl -s -X POST \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"prefixes": ["stampchain.io/_frsh/", "stampchain.io/_fresh/"]}' | jq .

      echo -e "${GREEN}✅ Cloudflare cache purged${NC}"
      sleep 5
    fi

    # Test health endpoint
    echo -e "${YELLOW}Testing health endpoint...${NC}"
    sleep 10
    HEALTH_RESPONSE=$(curl -s https://stampchain.io/api/v2/health | jq -r '.status' 2>/dev/null || echo "error")

    if [ "$HEALTH_RESPONSE" = "OK" ]; then
      echo -e "${GREEN}✅ Health check PASSED - Site is online!${NC}"
    else
      echo -e "${YELLOW}⚠️  Health check response: ${HEALTH_RESPONSE}${NC}"
      echo -e "${YELLOW}   Site may still be starting up...${NC}"
    fi

    exit 0
  elif [ "$ROLLOUT_STATE" = "FAILED" ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Waiting 30 seconds...${NC}"
  sleep 30
done

echo -e "${YELLOW}Deployment still in progress after timeout${NC}"
echo -e "${YELLOW}Monitor at: https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER_NAME}/services/${ECS_SERVICE_NAME}${NC}"
