#!/bin/bash
set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
AUTO_CONFIRM=false

# Process command line arguments
for arg in "$@"; do
    case $arg in
        --auto-confirm)
            AUTO_CONFIRM=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --auto-confirm    Skip confirmation prompts"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Configure AWS CLI to not use pager (prevents requiring 'q' to exit)
export AWS_PAGER=""

# Load AWS settings
ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-stamps-app-prod}
ECS_SERVICE_NAME=${ECS_SERVICE_NAME:-stamps-app-service}
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}Using cluster: $ECS_CLUSTER_NAME${NC}"
echo -e "${GREEN}Using service: $ECS_SERVICE_NAME${NC}"
echo -e "${GREEN}Using AWS region: $AWS_REGION${NC}"

# Additional useful message about what this script does
echo -e "${YELLOW}=========================================================${NC}"
echo -e "${YELLOW}This script will:${NC}"
echo -e "${GREEN}1. Update task definition with environment variables from .env${NC}"
echo -e "${GREEN}2. Configure proper CloudWatch logging${NC}"
echo -e "${GREEN}3. Create the CloudWatch log group if it doesn't exist${NC}"
echo -e "${GREEN}4. Preserve existing CloudWatch log group settings${NC}"
echo -e "${GREEN}5. Deploy the updated task definition${NC}"
if [ "$AUTO_CONFIRM" = true ]; then
    echo -e "${GREEN}Auto-confirm is enabled. No prompts will be shown.${NC}"
fi
echo -e "${YELLOW}=========================================================${NC}"

# Get current task definition
echo -e "${GREEN}Getting current task definition...${NC}"
TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].taskDefinition' --output text)
echo -e "${GREEN}Current task definition: ${TASK_DEF_ARN}${NC}"

# Get current image
CURRENT_IMAGE=$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query 'taskDefinition.containerDefinitions[0].image' --output text)
echo -e "${GREEN}Current image: ${CURRENT_IMAGE}${NC}"

# Load environment variables from .env file
echo -e "${GREEN}Loading environment variables from .env file${NC}"
if [ -f .env ]; then
    # Convert .env to properly formatted JSON array
    ENV_ARRAY="["
    FIRST=true
    
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ $key == \#* ]] && continue
        [[ -z "$key" ]] && continue
        
        # Clean the key and value
        key=$(echo "$key" | tr -d ' \t\r')
        value=$(echo "$value" | sed 's/[[:space:]]*#.*$//' | tr -d '\r')
        
        # Skip AWS_ variables
        [[ $key == AWS_* ]] && continue
        
        # Skip empty values
        [[ -z "$value" ]] && continue
        
        # Add separator if not first item
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            ENV_ARRAY="$ENV_ARRAY,"
        fi
        
        # Add properly quoted JSON object
        ENV_ARRAY="$ENV_ARRAY{\"name\":\"$key\",\"value\":\"$value\"}"
    done < .env
    
    # Close the array
    ENV_ARRAY="$ENV_ARRAY]"
    
    # Convert to proper JSON
    echo -e "${GREEN}Validating environment variables JSON...${NC}"
    ENV_JSON=$(echo "$ENV_ARRAY" | jq '.')
    echo -e "${GREEN}Environment variables JSON is valid.${NC}"
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Update the task definition
echo -e "${GREEN}Creating new task definition...${NC}"

# Create the task definition update
TASK_DEF_JSON=$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query 'taskDefinition' | jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

# Update the environment variables
TASK_DEF_WITH_ENV=$(echo "$TASK_DEF_JSON" | jq --argjson env "$ENV_JSON" '.containerDefinitions[0].environment = $env')

# First check if there's an existing log configuration to preserve the log group name
EXISTING_LOG_CONFIG=$(echo "$TASK_DEF_JSON" | jq -r '.containerDefinitions[0].logConfiguration')
EXISTING_LOG_GROUP=$(echo "$TASK_DEF_JSON" | jq -r '.containerDefinitions[0].logConfiguration.options["awslogs-group"]')

if [ "$EXISTING_LOG_GROUP" != "null" ] && [ -n "$EXISTING_LOG_GROUP" ]; then
  echo -e "${GREEN}Found existing log group: ${EXISTING_LOG_GROUP}${NC}"
  
  # Use the existing log group but ensure all other config is correct
  TASK_DEF_FINAL=$(echo "$TASK_DEF_WITH_ENV" | jq --arg group "/ecs/stamps-app-prod-front-end" --arg region "$AWS_REGION" '
    .containerDefinitions[0].logConfiguration = {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": $group,
        "awslogs-region": $region,
        "awslogs-stream-prefix": "ecs"
      }
    }
  ')
else
  echo -e "${YELLOW}No existing log group found. Using /ecs/stamps-app-prod-front-end${NC}"
  
  # Create a new log configuration with default log group
  TASK_DEF_FINAL=$(echo "$TASK_DEF_WITH_ENV" | jq --arg region "$AWS_REGION" '
    .containerDefinitions[0].logConfiguration = {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/stamps-app-prod-front-end",
        "awslogs-region": $region,
        "awslogs-stream-prefix": "ecs"
      }
    }
  ')
  
  # Set the default log group for later reference
  EXISTING_LOG_GROUP="/ecs/stamps-app-prod-front-end"
fi

# Show the updated task definition
echo -e "${YELLOW}Environment variables to be set:${NC}"
echo "$TASK_DEF_FINAL" | jq '.containerDefinitions[0].environment | map(.name + ": " + .value) | .[]'

echo -e "${YELLOW}Log configuration:${NC}"
echo "$TASK_DEF_FINAL" | jq '.containerDefinitions[0].logConfiguration'

# Check if CloudWatch log group exists, create if it doesn't 
echo -e "${GREEN}Ensuring CloudWatch log group exists: ${EXISTING_LOG_GROUP}${NC}"
if ! aws logs describe-log-groups --log-group-name-prefix "$EXISTING_LOG_GROUP" --query "logGroups[?logGroupName=='$EXISTING_LOG_GROUP'].logGroupName" --output text | grep -q "$EXISTING_LOG_GROUP"; then
    echo -e "${YELLOW}Log group does not exist. Creating it now...${NC}"
    aws logs create-log-group --log-group-name "$EXISTING_LOG_GROUP"
    # Set retention policy if needed
    aws logs put-retention-policy --log-group-name "$EXISTING_LOG_GROUP" --retention-in-days 14
    echo -e "${GREEN}Created log group with 14-day retention policy${NC}"
else
    echo -e "${GREEN}Log group already exists. Checking for logs...${NC}"
    # Check if there are any log streams in this group
    STREAMS=$(aws logs describe-log-streams --log-group-name "$EXISTING_LOG_GROUP" --max-items 3 --query 'logStreams[*].logStreamName' --output text)
    if [ -n "$STREAMS" ]; then
        echo -e "${GREEN}Found existing log streams in this group:${NC}"
        echo "$STREAMS" | tr '\t' '\n' | head -3 | while read -r stream; do
            echo "  - $stream"
        done
        echo -e "${YELLOW}To view logs: aws logs get-log-events --log-group-name \"$EXISTING_LOG_GROUP\" --log-stream-name \"[STREAM_NAME]\"${NC}"
    else
        echo -e "${YELLOW}No log streams found in this group yet. They will appear once the service starts logging.${NC}"
    fi
fi

# Confirm before registering (unless auto-confirm is enabled)
if [ "$AUTO_CONFIRM" = false ]; then
    echo -e "${YELLOW}Are you sure you want to register this new task definition? (y/n)${NC}"
    read -r CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Task definition update canceled.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}Auto-confirm enabled. Proceeding with task definition update...${NC}"
fi

# Register new task definition
echo -e "${GREEN}Registering new task definition...${NC}"
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "$TASK_DEF_FINAL" --query 'taskDefinition.taskDefinitionArn' --output text)

if [ -n "$NEW_TASK_DEF_ARN" ]; then
    echo -e "${GREEN}New task definition registered: ${NEW_TASK_DEF_ARN}${NC}"
    
    # Ask to update the service (unless auto-confirm is enabled)
    if [ "$AUTO_CONFIRM" = true ]; then
        UPDATE_SERVICE="y"
    else
        echo -e "${YELLOW}Do you want to update the service to use this task definition? (y/n)${NC}"
        read -r UPDATE_SERVICE
    fi
    
    if [[ "$UPDATE_SERVICE" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Updating ECS service...${NC}"
        aws ecs update-service --cluster "$ECS_CLUSTER_NAME" --service "$ECS_SERVICE_NAME" --task-definition "$NEW_TASK_DEF_ARN" --force-new-deployment
        echo -e "${GREEN}Service updated! New tasks will start with updated environment variables and logging.${NC}"
        echo -e "${YELLOW}Note: It may take 1-2 minutes for the new tasks to start and for logs to appear in CloudWatch.${NC}"
        echo -e "${GREEN}You can check logs in CloudWatch under the log group: ${EXISTING_LOG_GROUP}${NC}"
    else
        echo -e "${YELLOW}Service not updated. You can update it manually with:${NC}"
        echo "aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --task-definition $NEW_TASK_DEF_ARN --force-new-deployment"
    fi
else
    echo -e "${RED}Failed to register new task definition.${NC}"
    exit 1
fi

echo -e "${GREEN}Done!${NC}"