#!/bin/bash
set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script purpose
echo -e "${YELLOW}=========================================================${NC}"
echo -e "${YELLOW}Add Single Environment Variable to ECS Task Definition${NC}"
echo -e "${YELLOW}=========================================================${NC}"

# Check if variable name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide the environment variable name${NC}"
    echo "Usage: $0 VARIABLE_NAME"
    echo "Example: $0 CONNECTION_POOL_RESET_TOKEN"
    exit 1
fi

VAR_NAME="$1"

# Configure AWS CLI to not use pager
export AWS_PAGER=""

# Load AWS settings
ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-stamps-app-prod}
ECS_SERVICE_NAME=${ECS_SERVICE_NAME:-stamps-app-service}
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}Configuration:${NC}"
echo -e "  Cluster: $ECS_CLUSTER_NAME"
echo -e "  Service: $ECS_SERVICE_NAME"
echo -e "  Region: $AWS_REGION"
echo -e "  Variable: $VAR_NAME"

# Get the value from .env file
if [ -f .env ]; then
    VAR_VALUE=$(grep "^${VAR_NAME}=" .env | cut -d'=' -f2-)
    if [ -z "$VAR_VALUE" ]; then
        echo -e "${RED}Error: Variable ${VAR_NAME} not found in .env file${NC}"
        exit 1
    fi
    echo -e "${GREEN}Found value for ${VAR_NAME}${NC}"
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Get current task definition
echo -e "${GREEN}Getting current task definition...${NC}"
TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].taskDefinition' --output text)
if [ -z "$TASK_DEF_ARN" ] || [ "$TASK_DEF_ARN" == "None" ]; then
    echo -e "${RED}Error: Could not find task definition for service${NC}"
    exit 1
fi
echo -e "${GREEN}Current task definition: ${TASK_DEF_ARN}${NC}"

# Get the full task definition
TASK_DEF_JSON=$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query 'taskDefinition')
if [ -z "$TASK_DEF_JSON" ]; then
    echo -e "${RED}Error: Could not retrieve task definition${NC}"
    exit 1
fi

# Extract existing environment variables
EXISTING_ENV=$(echo "$TASK_DEF_JSON" | jq '.containerDefinitions[0].environment // []')

# Check if variable already exists
EXISTING_VALUE=$(echo "$EXISTING_ENV" | jq -r --arg name "$VAR_NAME" '.[] | select(.name == $name) | .value')

if [ -n "$EXISTING_VALUE" ] && [ "$EXISTING_VALUE" != "null" ]; then
    echo -e "${YELLOW}Variable ${VAR_NAME} already exists with value${NC}"
    echo -e "${YELLOW}Current value: [HIDDEN]${NC}"
    echo -e "${YELLOW}New value: [HIDDEN]${NC}"
    read -p "Do you want to update it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping update${NC}"
        exit 0
    fi
    
    # Remove existing variable
    EXISTING_ENV=$(echo "$EXISTING_ENV" | jq --arg name "$VAR_NAME" 'map(select(.name != $name))')
fi

# Add the new variable
NEW_ENV=$(echo "$EXISTING_ENV" | jq --arg name "$VAR_NAME" --arg value "$VAR_VALUE" '. + [{"name": $name, "value": $value}]')

# Count environment variables
OLD_COUNT=$(echo "$EXISTING_ENV" | jq '. | length')
NEW_COUNT=$(echo "$NEW_ENV" | jq '. | length')
echo -e "${GREEN}Environment variables: ${OLD_COUNT} -> ${NEW_COUNT}${NC}"

# Create new task definition with updated environment
UPDATED_TASK_DEF=$(echo "$TASK_DEF_JSON" | jq --argjson env "$NEW_ENV" '
    del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) |
    .containerDefinitions[0].environment = $env
')

# Validate the JSON
echo -e "${GREEN}Validating task definition JSON...${NC}"
echo "$UPDATED_TASK_DEF" | jq '.' > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Invalid JSON in task definition${NC}"
    exit 1
fi

# Display summary
echo -e "${YELLOW}=========================================================${NC}"
echo -e "${YELLOW}Summary of changes:${NC}"
echo -e "${GREEN}- Adding/updating environment variable: ${VAR_NAME}${NC}"
echo -e "${GREEN}- Total environment variables: ${NEW_COUNT}${NC}"
echo -e "${YELLOW}=========================================================${NC}"

# Confirm before proceeding
read -p "Do you want to apply these changes? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled by user${NC}"
    exit 0
fi

# Register the new task definition
echo -e "${GREEN}Registering new task definition...${NC}"
# Write to temporary file to avoid stdin issues
TEMP_FILE=$(mktemp)
echo "$UPDATED_TASK_DEF" > "$TEMP_FILE"
NEW_TASK_DEF=$(aws ecs register-task-definition --cli-input-json "file://${TEMP_FILE}")
REGISTER_EXIT_CODE=$?
rm -f "$TEMP_FILE"
if [ $REGISTER_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Error: Failed to register task definition${NC}"
    exit 1
fi

NEW_TASK_DEF_ARN=$(echo "$NEW_TASK_DEF" | jq -r '.taskDefinition.taskDefinitionArn')
echo -e "${GREEN}New task definition registered: ${NEW_TASK_DEF_ARN}${NC}"

# Update the service to use the new task definition
echo -e "${GREEN}Updating service to use new task definition...${NC}"
UPDATE_RESULT=$(aws ecs update-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_SERVICE_NAME" \
    --task-definition "$NEW_TASK_DEF_ARN" \
    --force-new-deployment)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to update service${NC}"
    exit 1
fi

echo -e "${GREEN}Service update initiated${NC}"
echo -e "${GREEN}Environment variable ${VAR_NAME} has been added/updated${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for the new tasks to start${NC}"
echo -e "${YELLOW}You can monitor the deployment in the AWS Console${NC}"