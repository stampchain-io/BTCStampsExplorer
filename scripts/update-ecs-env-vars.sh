#!/bin/bash
set -e

# =====================================================================
# Script to update ECS task definition with environment variables
# This preserves all existing variables and only adds/updates specified ones
# 
# Usage: ./update-ecs-env-vars.sh
# Reads variables from .env file and updates ECS task definition
# =====================================================================

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables from .env file
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    source .env
fi

# Set defaults
AWS_REGION="${AWS_REGION:-us-east-1}"
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-stamps-app-prod}"
ECS_SERVICE_NAME="${ECS_SERVICE_NAME:-stamps-app-service}"
TASK_FAMILY="${AWS_TASK_FAMILY:-stamps-app-task}"

echo -e "${GREEN}Updating ECS Task Definition Security Variables${NC}"
echo "Cluster: $ECS_CLUSTER_NAME"
echo "Service: $ECS_SERVICE_NAME"
echo "Task Family: $TASK_FAMILY"

# Check if required security vars are set
if [ -z "$APP_DOMAIN" ] || [ -z "$ALLOWED_DOMAINS" ] || [ -z "$INTERNAL_API_SECRET" ] || [ -z "$INTERNAL_API_KEY" ]; then
    echo -e "${RED}Missing required security variables in .env file${NC}"
    echo "Please add these to your .env file:"
    echo "APP_DOMAIN=stampchain.io"
    echo "ALLOWED_DOMAINS=stampchain.io,www.stampchain.io"
    echo "INTERNAL_API_SECRET=$(openssl rand -hex 32)"
    echo "INTERNAL_API_KEY=$(openssl rand -hex 32)"
    exit 1
fi

# Get the current task definition
echo -e "${YELLOW}Fetching current task definition...${NC}"
TASK_DEF_ARN=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].taskDefinition' \
    --output text)

if [ -z "$TASK_DEF_ARN" ] || [ "$TASK_DEF_ARN" == "None" ]; then
    echo -e "${RED}Failed to get task definition ARN${NC}"
    exit 1
fi

echo "Current task definition: $TASK_DEF_ARN"

# Get the full task definition
TASK_DEF=$(aws ecs describe-task-definition \
    --task-definition "$TASK_DEF_ARN" \
    --region "$AWS_REGION" \
    --query 'taskDefinition')

# Create a new task definition with updated environment variables
# This uses jq to preserve all existing config and only update env vars
echo -e "${YELLOW}Updating environment variables...${NC}"

# Create the new task definition
NEW_TASK_DEF=$(echo "$TASK_DEF" | jq --arg app_domain "$APP_DOMAIN" \
    --arg allowed_domains "$ALLOWED_DOMAINS" \
    --arg internal_secret "$INTERNAL_API_SECRET" \
    --arg internal_key "$INTERNAL_API_KEY" \
    '.containerDefinitions[0].environment |= (
        # Keep all existing vars
        . as $existing |
        # Add/update security vars
        (if any(.name == "APP_DOMAIN") then . else . + [{"name": "APP_DOMAIN", "value": $app_domain}] end) |
        (if any(.name == "ALLOWED_DOMAINS") then map(if .name == "ALLOWED_DOMAINS" then .value = $allowed_domains else . end) else . + [{"name": "ALLOWED_DOMAINS", "value": $allowed_domains}] end) |
        (if any(.name == "INTERNAL_API_SECRET") then map(if .name == "INTERNAL_API_SECRET" then .value = $internal_secret else . end) else . + [{"name": "INTERNAL_API_SECRET", "value": $internal_secret}] end) |
        (if any(.name == "INTERNAL_API_KEY") then map(if .name == "INTERNAL_API_KEY" then .value = $internal_key else . end) else . + [{"name": "INTERNAL_API_KEY", "value": $internal_key}] end)
    ) | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .registeredAt, .registeredBy, .compatibilities)')

# Save the new task definition to a temporary file
TEMP_FILE=$(mktemp)
echo "$NEW_TASK_DEF" > "$TEMP_FILE"

# Register the new task definition
echo -e "${YELLOW}Registering new task definition...${NC}"
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json "file://$TEMP_FILE" \
    --region "$AWS_REGION" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

# Clean up temp file
rm -f "$TEMP_FILE"

if [ -z "$NEW_TASK_DEF_ARN" ] || [ "$NEW_TASK_DEF_ARN" == "None" ]; then
    echo -e "${RED}Failed to register new task definition${NC}"
    exit 1
fi

echo -e "${GREEN}New task definition registered: $NEW_TASK_DEF_ARN${NC}"

# Update the service to use the new task definition
echo -e "${YELLOW}Updating ECS service...${NC}"
aws ecs update-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_SERVICE_NAME" \
    --task-definition "$NEW_TASK_DEF_ARN" \
    --region "$AWS_REGION" \
    --force-new-deployment \
    > /dev/null

echo -e "${GREEN}Service update initiated!${NC}"

# Show deployment status
echo -e "${YELLOW}Checking deployment status...${NC}"
aws ecs describe-services \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION" \
    --query 'services[0].deployments[*].[status,taskDefinition,desiredCount,runningCount]' \
    --output table

echo -e "${GREEN}Security variables updated successfully!${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for the new deployment to complete.${NC}"
echo ""
echo "Updated variables:"
echo "- APP_DOMAIN=$APP_DOMAIN"
echo "- ALLOWED_DOMAINS=$ALLOWED_DOMAINS"
echo "- INTERNAL_API_SECRET=***hidden***"
echo "- INTERNAL_API_KEY=***hidden***"