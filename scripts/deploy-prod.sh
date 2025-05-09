#!/bin/bash

# Simple production deployment script for BTC Stamps Explorer
# This script updates the task definition with environment variables from .env.prod
# and deploys to the existing ECS service
# Usage: ./scripts/deploy-prod.sh [test_mode=true]
#
# If test_mode=true is provided, the script will run in test mode
# without actually making any changes to AWS resources

set -e

# Check if running in test mode
TEST_MODE=false
if [[ "$1" == "test_mode=true" ]]; then
  TEST_MODE=true
  echo "🧪 Running in TEST MODE - no actual changes will be made"
fi

echo "======================================================"
echo "🚀 Simple Production Deployment for BTC Stamps Explorer"
echo "======================================================"

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
  echo "❌ Error: .env.prod file not found."
  echo "Please create an .env.prod file with your production environment variables."
  exit 1
fi

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="stamps-app/front-end"
IMAGE_TAG="latest"
CLUSTER_NAME="stamps-app-prod"
SERVICE_NAME="stamps-app-service"
CONTAINER_NAME="stamps-app-service"
TASK_DEF_FILE="task-def-manual.json"

# First, extract network configuration from .env.prod
if [ -f .env.prod ]; then
  # Extract network configuration
  SUBNET_1_FROM_ENV=$(grep -E "^SUBNET_1=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
  SUBNET_2_FROM_ENV=$(grep -E "^SUBNET_2=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
  SECURITY_GROUP_FROM_ENV=$(grep -E "^SECURITY_GROUP=" .env.prod | cut -d= -f2 | tr -d '"' | tr -d "'")
  
  # Use values from .env.prod if available, otherwise keep existing/default values
  SUBNET_1=${SUBNET_1_FROM_ENV:-${SUBNET_1:-"subnet-0731f368831419344"}}
  SUBNET_2=${SUBNET_2_FROM_ENV:-${SUBNET_2:-"subnet-04f3ca3e22f793531"}}
  SECURITY_GROUP=${SECURITY_GROUP_FROM_ENV:-${SECURITY_GROUP:-"sg-0c1ea60980e66ebe4"}}
  
  echo "Using network configuration:"
  echo "  SUBNET_1: ${SUBNET_1}"
  echo "  SUBNET_2: ${SUBNET_2}"
  echo "  SECURITY_GROUP: ${SECURITY_GROUP}"
fi

# Parse environment variables from .env.prod for container
echo "📝 Step 1/3: Parsing environment variables from .env.prod..."
ENV_VARS="["
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ $key == \#* ]] && continue
  [[ -z "$key" ]] && continue
  [[ $key =~ ^[[:space:]]*$ ]] && continue
  
  # Skip if value is empty
  [[ -z "$value" ]] && continue
  
  # Strip any quotes from the value
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  
  # Add to environment variables
  ENV_VARS="${ENV_VARS}{\"name\":\"$key\",\"value\":\"$value\"},"
done < .env.prod

# Clean up trailing comma and close array
ENV_VARS="${ENV_VARS%,}]"

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

# Create task definition
echo "📝 Step 2/3: Creating task definition with environment variables..."

cat > ${TASK_DEF_FILE} << EOF
{
  "family": "stamps-app-service",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/stamps-app-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/stamps-app-task-role",
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
if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would create log group: /aws/ecs/${CLUSTER_NAME}"
else
  aws logs create-log-group --log-group-name "/aws/ecs/${CLUSTER_NAME}" 2>/dev/null || true
fi

# Register task definition
echo "Registering task definition..."
if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would register task definition from ${TASK_DEF_FILE}"
  echo "🧪 TEST MODE: File contents:"
  cat ${TASK_DEF_FILE} | grep -v "DB_PASSWORD\|API_KEY\|SECRET_KEY" | sed 's/\("value":"\)[^"]*\("\)/\1[REDACTED]\2/g'
  TASK_DEFINITION_ARN="arn:aws:ecs:${AWS_REGION}:${AWS_ACCOUNT_ID}:task-definition/stamps-app-service:99"
  TASK_REVISION="99"
else
  TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://${TASK_DEF_FILE} \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)
  
  TASK_REVISION=$(echo $TASK_DEFINITION_ARN | awk -F: '{print $NF}')
fi
echo "✅ Task definition registered as 'stamps-app-service:${TASK_REVISION}'"

# Update service
echo "📝 Step 3/3: Updating ECS service with new task definition..."
if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would update service with these parameters:"
  echo "    Cluster: ${CLUSTER_NAME}"
  echo "    Service: ${SERVICE_NAME}"
  echo "    Task Definition: ${TASK_DEFINITION_ARN}"
  echo "    Desired Count: 1"
else
  aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service ${SERVICE_NAME} \
    --task-definition ${TASK_DEFINITION_ARN} \
    --desired-count 1 \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_1},${SUBNET_2}],securityGroups=[${SECURITY_GROUP}],assignPublicIp=ENABLED}" \
    --force-new-deployment
fi

echo "✅ Service updated successfully!"
echo "======================================================"
echo "🔍 Deployment Information:"
echo "Cluster: ${CLUSTER_NAME}"
echo "Service: ${SERVICE_NAME}"
echo "Task Definition: stamps-app-service:${TASK_REVISION}"
echo "======================================================"
echo "📊 Monitor deployment status in the AWS Console:"
echo "https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${CLUSTER_NAME}/services/${SERVICE_NAME}/details"
echo "======================================================"
echo "⚠️ If tasks fail to start, check these common issues:"
echo "1. Container name matches load balancer configuration"
echo "2. Security groups allow access to ECR, RDS, and ElastiCache"
echo "3. Network configuration allows tasks to communicate"
echo ""
echo "🔄 Verifying security group permissions for ECR access..."
aws ec2 describe-security-groups --group-ids ${SECURITY_GROUP} --query 'SecurityGroups[0].IpPermissionsEgress[?ToPort==`-1`]' --output table
echo ""
echo "Network configuration information:"
echo "  SUBNET_1: ${SUBNET_1}"
echo "  SUBNET_2: ${SUBNET_2}"
echo "  SECURITY_GROUP: ${SECURITY_GROUP}"
echo ""
echo "Ensure this security group has outbound access (port -1, CIDR 0.0.0.0/0) to connect to ECR!"
echo "If missing, run: aws ec2 authorize-security-group-egress --group-id ${SECURITY_GROUP} --protocol all --port -1 --cidr 0.0.0.0/0"
echo ""
echo "You can add these values to your .env.prod for easier deployment:"
echo "SUBNET_1=${SUBNET_1}"
echo "SUBNET_2=${SUBNET_2}"
echo "SECURITY_GROUP=${SECURITY_GROUP}"
echo "======================================================"

# Clean up task definition file
if [ "$TEST_MODE" = true ]; then
  echo "🧪 TEST MODE: Would remove temporary task definition file: ${TASK_DEF_FILE}"
else
  rm ${TASK_DEF_FILE}
fi