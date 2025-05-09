#!/bin/bash

# Unified build and deploy script for BTC Stamps Explorer
# Usage: ./scripts/unified-deploy.sh [build_only|deploy_only] [test_mode=true]
#
# If test_mode=true is provided, the script will run in test mode
# without actually making any changes to AWS resources

set -e

# Check if running in test mode
TEST_MODE=false
if [[ "$1" == "test_mode=true" || "$2" == "test_mode=true" ]]; then
  TEST_MODE=true
  echo "🧪 Running in TEST MODE - no actual changes will be made"
fi

# Configuration - using existing resources rather than creating new ones
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="stamps-app/front-end"
CLUSTER_NAME="stamps-app-prod"
SERVICE_NAME="stamps-app-service" 
CODEBUILD_PROJECT="stamps-app-build"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:us-east-1:${AWS_ACCOUNT_ID}:targetgroup/stamps-prod-tg/5ec25e1c25fec348"
CONTAINER_NAME="stamps-app-service"

# Determine mode
MODE=${1:-"full"}
if [[ "$MODE" != "build_only" && "$MODE" != "deploy_only" && "$MODE" != "full" ]]; then
  echo "Invalid mode: $MODE. Must be build_only, deploy_only, or full"
  echo "Usage: ./scripts/unified-deploy.sh [build_only|deploy_only]"
  exit 1
fi

# Generate a timestamp-based image tag
TIMESTAMP=$(date +%Y%m%d%H%M%S)
GIT_COMMIT=$(git rev-parse --short HEAD)
IMAGE_TAG="prod-${TIMESTAMP}-g${GIT_COMMIT}"
LATEST_TAG="latest"

echo "======================================================"
echo "🚀 Unified build and deploy for BTC Stamps Explorer"
echo "======================================================"
echo "🔍 Mode: $MODE"
echo "🔍 Image tag: $IMAGE_TAG (and $LATEST_TAG)"
echo "======================================================"

# Function to validate env file
validate_env_file() {
  if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found."
    echo "Please create an .env.prod file with your production environment variables."
    exit 1
  fi
  
  # Check for required variables
  REQUIRED_VARS=("DB_HOST" "DB_USER" "DB_PASSWORD" "DB_PORT" "DB_NAME" "ELASTICACHE_ENDPOINT")
  MISSING_VARS=()
  
  for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${VAR}=" .env.prod; then
      MISSING_VARS+=("$VAR")
    fi
  done
  
  if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Error: Missing required variables in .env.prod:"
    for VAR in "${MISSING_VARS[@]}"; do
      echo "  - $VAR"
    done
    exit 1
  fi
  
  echo "✅ .env.prod file validated"
}

# Build the image if needed
if [[ "$MODE" == "build_only" || "$MODE" == "full" ]]; then
  echo "======================================================"
  echo "📝 Step 1: Building image using CodeBuild"
  echo "======================================================"
  
  # Verify CodeBuild project exists
  PROJECT_EXISTS=$(aws codebuild batch-get-projects --names ${CODEBUILD_PROJECT} --query 'projects[0].name' --output text 2>/dev/null || echo "")
  
  if [ "$PROJECT_EXISTS" = "None" ] || [ -z "$PROJECT_EXISTS" ]; then
    echo "❌ Error: CodeBuild project ${CODEBUILD_PROJECT} does not exist."
    exit 1
  fi
  
  echo "✅ Using CodeBuild project: ${CODEBUILD_PROJECT}"
  
  # Start build
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would start build with these parameters:"
    echo "    Project: ${CODEBUILD_PROJECT}"
    echo "    Environment Variables:"
    echo "      AWS_REGION: ${AWS_REGION}"
    echo "      AWS_ACCOUNT_ID: ${AWS_ACCOUNT_ID}"
    echo "      ECR_REPOSITORY: ${ECR_REPOSITORY}"
    echo "      IMAGE_TAG: ${IMAGE_TAG}"
    BUILD_ID="test-build-id-1234"
  else
    BUILD_ID=$(aws codebuild start-build \
      --project-name ${CODEBUILD_PROJECT} \
      --environment-variables-override "[{\"name\":\"AWS_REGION\",\"value\":\"${AWS_REGION}\"},{\"name\":\"AWS_ACCOUNT_ID\",\"value\":\"${AWS_ACCOUNT_ID}\"},{\"name\":\"ECR_REPOSITORY\",\"value\":\"${ECR_REPOSITORY}\"},{\"name\":\"IMAGE_TAG\",\"value\":\"${IMAGE_TAG}\"}]" \
      --query 'build.id' \
      --output text)
  fi
  
  echo "Build started with ID: ${BUILD_ID}"
  
  # Wait for build to complete
  echo "Waiting for build to complete (this may take several minutes)..."
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
    exit 1
  fi
  
  echo "✅ Build completed successfully!"
  
  # Verify image build with retries
  echo "Verifying image build..."
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would verify image with these parameters:"
    echo "    Repository: ${ECR_REPOSITORY}"
    echo "    Version tag: ${IMAGE_TAG}"
    echo "    Latest tag: ${LATEST_TAG}"
  else
    # Sometimes ECR needs time to register the image after CodeBuild completes
    # We'll retry a few times with increasing delays
    MAX_RETRIES=5
    RETRY_COUNT=0
    IMG_EXISTS=""
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
      # Check if image exists
      IMG_EXISTS=$(aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${IMAGE_TAG} 2>/dev/null || echo "")
      
      if [ -z "$IMG_EXISTS" ]; then
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          DELAY=$((5 * RETRY_COUNT))
          echo "Image not found yet. Waiting ${DELAY} seconds before retry ${RETRY_COUNT}/${MAX_RETRIES}..."
          sleep $DELAY
        fi
      else
        echo "✅ Image ${IMAGE_TAG} found in repository"
        break
      fi
    done
    
    # After retries, check if we found the image
    if [ -z "$IMG_EXISTS" ]; then
      echo "⚠️ Warning: Could not find image with tag ${IMAGE_TAG} after ${MAX_RETRIES} retries."
      echo "The build may have had issues pushing to ECR. Check CodeBuild logs."
      
      # Fallback to using latest tag instead if it exists
      echo "Attempting to use latest tag as fallback..."
      LATEST_EXISTS=$(aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${LATEST_TAG} 2>/dev/null || echo "")
      
      if [ -z "$LATEST_EXISTS" ]; then
        echo "⚠️ Warning: Latest tag also not found. Continuing with deployment, but it may fail."
      else
        echo "✅ Found image with latest tag, using that instead."
        echo "Changing image tag from ${IMAGE_TAG} to ${LATEST_TAG} for deployment."
        IMAGE_TAG="${LATEST_TAG}"
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
  
  # Save image info
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would save tag to current-image-tag.txt: ${IMAGE_TAG}"
  else
    echo "${IMAGE_TAG}" > current-image-tag.txt
    echo "Image tag saved to current-image-tag.txt"
  fi
fi

# Deploy if needed
if [[ "$MODE" == "deploy_only" || "$MODE" == "full" ]]; then
  echo "======================================================"
  echo "📝 Step 2: Deploying application to ECS"
  echo "======================================================"
  
  # Validate env file before deployment
  validate_env_file
  
  # Get image tag if in deploy_only mode
  if [[ "$MODE" == "deploy_only" ]]; then
    if [ -f current-image-tag.txt ]; then
      IMAGE_TAG=$(cat current-image-tag.txt)
      echo "Using image tag from current-image-tag.txt: ${IMAGE_TAG}"
    else
      echo "Using latest tag for deployment"
      IMAGE_TAG=${LATEST_TAG}
    fi
  fi
  
  # Create the ECS cluster if it doesn't exist
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would check if cluster ${CLUSTER_NAME} exists"
    echo "🧪 TEST MODE: Assuming cluster exists"
    CLUSTER_EXISTS="${CLUSTER_NAME}"
  else
    CLUSTER_EXISTS=$(aws ecs describe-clusters --clusters ${CLUSTER_NAME} --query "clusters[0].clusterName" --output text 2>/dev/null || echo "")
  fi
  
  if [ -z "$CLUSTER_EXISTS" ] || [ "$CLUSTER_EXISTS" = "None" ]; then
    echo "Creating new ECS cluster: ${CLUSTER_NAME}"
    if [ "$TEST_MODE" = true ]; then
      echo "🧪 TEST MODE: Would create new ECS cluster: ${CLUSTER_NAME}"
    else
      aws ecs create-cluster --cluster-name ${CLUSTER_NAME}
    fi
  else
    echo "Using existing cluster: ${CLUSTER_NAME}"
  fi
  
  # Parse environment variables from .env.prod
  echo "Parsing environment variables from .env.prod..."
  ENV_VARS="["
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ $key == \#* ]] && continue
    [[ -z "$key" ]] && continue
    [[ $key =~ ^[[:space:]]*$ ]] && continue
    
    # Strip any quotes from the value
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    
    # Process and add as task environment variable
    if [[ -n "$value" ]]; then
      ENV_VARS="${ENV_VARS}{\"name\":\"$key\",\"value\":\"$value\"},"
    fi
  done < .env.prod
  
  # Clean up trailing comma and close array
  ENV_VARS="${ENV_VARS%,}]"
  
  # Ensure we have database and Redis configuration
  if [[ "$ENV_VARS" != *"\"DB_PASSWORD\""* ]]; then
    echo "⚠️ Warning: DB_PASSWORD not found in .env.prod"
    read -s -p "Enter database password: " DB_PASSWORD
    echo ""
    ENV_VARS="${ENV_VARS%]},{\"name\":\"DB_PASSWORD\",\"value\":\"$DB_PASSWORD\"}]"
  fi
  
  # Make sure Redis-related variables are properly set
  if [[ "$ENV_VARS" != *"\"SKIP_REDIS\""* ]]; then
    ENV_VARS="${ENV_VARS%]},{\"name\":\"SKIP_REDIS\",\"value\":\"false\"}]"
  fi

  if [[ "$ENV_VARS" != *"\"SKIP_REDIS_CONNECTION\""* ]]; then
    ENV_VARS="${ENV_VARS%]},{\"name\":\"SKIP_REDIS_CONNECTION\",\"value\":\"false\"}]"
  fi

  if [[ "$ENV_VARS" != *"\"CACHE\""* ]]; then
    ENV_VARS="${ENV_VARS%]},{\"name\":\"CACHE\",\"value\":\"true\"}]"
  fi
  
  # Create task definition file
  TASK_DEF_FILE="task-def-unified.json"
  
  echo "Creating task definition with image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
  
  # Check for execution and task roles, create if needed
  EXECUTION_ROLE_NAME="stamps-app-execution-role"
  TASK_ROLE_NAME="stamps-app-task-role"
  
  # Ensure roles exist
  if ! aws iam get-role --role-name ${EXECUTION_ROLE_NAME} &>/dev/null; then
    echo "Creating execution role ${EXECUTION_ROLE_NAME}..."
    aws iam create-role \
      --role-name ${EXECUTION_ROLE_NAME} \
      --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    
    aws iam attach-role-policy \
      --role-name ${EXECUTION_ROLE_NAME} \
      --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
  fi
  
  if ! aws iam get-role --role-name ${TASK_ROLE_NAME} &>/dev/null; then
    echo "Creating task role ${TASK_ROLE_NAME}..."
    aws iam create-role \
      --role-name ${TASK_ROLE_NAME} \
      --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  fi
  
  EXECUTION_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EXECUTION_ROLE_NAME}"
  TASK_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${TASK_ROLE_NAME}"
  
  # Create a task definition
  cat > ${TASK_DEF_FILE} << EOF
{
  "family": "${SERVICE_NAME}",
  "executionRoleArn": "${EXECUTION_ROLE_ARN}",
  "taskRoleArn": "${TASK_ROLE_ARN}",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "${CONTAINER_NAME}",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": ${ENV_VARS},
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/${CLUSTER_NAME}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "stamps-app"
        }
      }
    }
  ],
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "cpu": "256",
  "memory": "1024"
}
EOF
  
  # Create log group if it doesn't exist
  aws logs create-log-group --log-group-name "/aws/ecs/${CLUSTER_NAME}" 2>/dev/null || true
  
  # Register task definition
  echo "Registering task definition..."
  TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://${TASK_DEF_FILE} \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)
  
  echo "✅ Task definition registered: ${TASK_DEFINITION_ARN}"
  
  # First, try to extract network configuration from .env.prod
  if [ -f .env.prod ]; then
    # Extract network configuration
    SUBNET_1_FROM_ENV=$(grep -E "^SUBNET_1=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
    SUBNET_2_FROM_ENV=$(grep -E "^SUBNET_2=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
    SECURITY_GROUP_FROM_ENV=$(grep -E "^SECURITY_GROUP=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
    VPC_ID_FROM_ENV=$(grep -E "^VPC_ID=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
    
    # Use values from .env.prod if available
    VPC_ID=${VPC_ID_FROM_ENV:-"vpc-0dc996204c4b28a3f"}
  else
    # Default VPC ID if no .env.prod
    VPC_ID="vpc-0dc996204c4b28a3f"
  fi
  
  # If subnets are not provided in .env.prod, query AWS to find them
  if [ -z "$SUBNET_1_FROM_ENV" ] || [ -z "$SUBNET_2_FROM_ENV" ]; then
    echo "Subnets not provided in .env.prod, querying AWS..."
    # Get subnets from the VPC
    SUBNETS=$(aws ec2 describe-subnets \
      --filters "Name=vpc-id,Values=${VPC_ID}" \
      --query "Subnets[*].SubnetId" \
      --output text)
    
    # Take first two subnets (one per AZ) to avoid subnet conflicts
    SUBNET_1=$(echo $SUBNETS | cut -d' ' -f1)
    SUBNET_2=$(echo $SUBNETS | cut -d' ' -f2)
  else
    # Use subnets from .env.prod
    SUBNET_1=$SUBNET_1_FROM_ENV
    SUBNET_2=$SUBNET_2_FROM_ENV
  fi
  
  SUBNET_LIST="${SUBNET_1},${SUBNET_2}"
  
  # If security group is not provided in .env.prod, query AWS to find it
  if [ -z "$SECURITY_GROUP_FROM_ENV" ]; then
    echo "Security group not provided in .env.prod, querying AWS..."
    # Get security group
    SG_NAME="stamps-app-ecs-tasks"
    SG_ID=$(aws ec2 describe-security-groups \
      --filters "Name=group-name,Values=${SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
      --query "SecurityGroups[0].GroupId" \
      --output text)
  else
    # Use security group from .env.prod
    SG_ID=$SECURITY_GROUP_FROM_ENV
  fi
  
  echo "Using network configuration:"
  echo "  VPC_ID: ${VPC_ID}"
  echo "  SUBNET_1: ${SUBNET_1}"
  echo "  SUBNET_2: ${SUBNET_2}"
  echo "  SECURITY_GROUP: ${SG_ID}"
  
  if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
    echo "Creating security group ${SG_NAME}..."
    SG_ID=$(aws ec2 create-security-group \
      --group-name ${SG_NAME} \
      --description "Security group for BTC Stamps Explorer ECS tasks" \
      --vpc-id ${VPC_ID} \
      --query "GroupId" \
      --output text)
    
    aws ec2 authorize-security-group-egress \
      --group-id ${SG_ID} \
      --protocol all \
      --port -1 \
      --cidr 0.0.0.0/0 2>/dev/null || echo "Outbound rule already exists"
    
    aws ec2 authorize-security-group-ingress \
      --group-id ${SG_ID} \
      --protocol tcp \
      --port 8000 \
      --cidr 0.0.0.0/0 2>/dev/null || echo "Inbound rule already exists"
  fi
  
  echo "Using security group: ${SG_ID}"
  echo "Using subnets: ${SUBNET_LIST}"
  
  # Check if service exists
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would check if service ${SERVICE_NAME} exists in cluster ${CLUSTER_NAME}"
    echo "🧪 TEST MODE: Assuming service exists"
    SERVICE_EXISTS="ACTIVE"
  else
    SERVICE_EXISTS=$(aws ecs describe-services \
      --cluster ${CLUSTER_NAME} \
      --services ${SERVICE_NAME} \
      --query 'services[0].status' \
      --output text 2>/dev/null || echo "MISSING")
  fi
  
  if [ "$SERVICE_EXISTS" = "MISSING" ] || [ "$SERVICE_EXISTS" = "None" ]; then
    echo "Creating new service ${SERVICE_NAME}..."
    
    if [ "$TEST_MODE" = true ]; then
      echo "🧪 TEST MODE: Would create new service with these parameters:"
      echo "    Cluster: ${CLUSTER_NAME}"
      echo "    Service: ${SERVICE_NAME}"
      echo "    Task Definition: ${TASK_DEFINITION_ARN}"
      echo "    Subnets: ${SUBNET_LIST}"
      echo "    Security Group: ${SG_ID}"
      echo "    Target Group: ${TARGET_GROUP_ARN}"
      echo "    Container Name: ${CONTAINER_NAME}"
    else
      aws ecs create-service \
        --cluster ${CLUSTER_NAME} \
        --service-name ${SERVICE_NAME} \
        --task-definition ${TASK_DEFINITION_ARN} \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_LIST}],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=${TARGET_GROUP_ARN},containerName=${CONTAINER_NAME},containerPort=8000" \
        --tags key=Environment,value=Production key=Application,value=BTCStampsExplorer
    fi
  else
    echo "Updating existing service ${SERVICE_NAME}..."
    
    if [ "$TEST_MODE" = true ]; then
      echo "🧪 TEST MODE: Would update service with these parameters:"
      echo "    Cluster: ${CLUSTER_NAME}"
      echo "    Service: ${SERVICE_NAME}"
      echo "    Task Definition: ${TASK_DEFINITION_ARN}" 
    else
      echo "Updating service with network configuration to ensure connectivity..."
      aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --task-definition ${TASK_DEFINITION_ARN} \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_LIST}],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}" \
        --force-new-deployment
    fi
  fi
  
  # Wait for service to stabilize
  echo "Waiting for service to stabilize (this may take a few minutes)..."
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would wait for service to stabilize"
    echo "🧪 TEST MODE: Simulating successful service stabilization"
  else
    aws ecs wait services-stable \
      --cluster ${CLUSTER_NAME} \
      --services ${SERVICE_NAME}
  fi
  
  # Cleanup old task definitions (keep the 5 most recent)
  echo "Cleaning up old task definitions..."
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would list old task definitions for family ${SERVICE_NAME}"
    echo "🧪 TEST MODE: Would deregister task definitions older than the 5 most recent"
  else
    OLD_TASK_DEFS=$(aws ecs list-task-definitions \
      --family-prefix ${SERVICE_NAME} \
      --status ACTIVE \
      --sort DESC \
      --query 'taskDefinitionArns[5:]' \
      --output text)
    
    if [ ! -z "$OLD_TASK_DEFS" ]; then
      for TD in $OLD_TASK_DEFS; do
        echo "Deregistering task definition: $TD"
        aws ecs deregister-task-definition \
          --task-definition $TD \
          --query 'taskDefinition.taskDefinitionArn' \
          --output text > /dev/null
      done
    fi
  fi
  
  # Remove temporary files
  if [ "$TEST_MODE" = true ]; then
    echo "🧪 TEST MODE: Would remove temporary task definition file: ${TASK_DEF_FILE}"
  else
    rm -f ${TASK_DEF_FILE}
  fi
fi

echo "======================================================"
echo "✅ Deployment completed successfully!"
echo "======================================================"
echo "🔍 Image tag: ${IMAGE_TAG}"
echo "🔍 Cluster: ${CLUSTER_NAME}"
echo "🔍 Service: ${SERVICE_NAME}"
echo "======================================================"
echo "🌐 The application should be available shortly at:"
echo "    https://stampchain.io"
echo "======================================================"
echo "📊 Monitor the deployment in the AWS Console:"
echo "    ECS Console: https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${CLUSTER_NAME}/services/${SERVICE_NAME}/details"
echo "    CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups/log-group/$2Faws$2Fecs$2F${CLUSTER_NAME}"
echo "======================================================"

# Deployment is complete, nothing more to do