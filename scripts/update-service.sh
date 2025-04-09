#!/bin/bash

# Script to update an ECS service with the newly registered task definition
# Usage: ./scripts/update-service.sh [environment]

# Exit on error
set -e

ENV=${1:-prod}

echo "🚀 Updating ECS service for environment: $ENV"

# Read the task definition ARN from the file
if [ ! -f task_def_arn.txt ]; then
  echo "❌ Error: task_def_arn.txt not found. Run register-task-def.sh first."
  exit 1
fi

TASK_DEFINITION=$(cat task_def_arn.txt)

# Extract just the task definition name and revision (family:revision)
TASK_DEF_NAME_REV=$(echo $TASK_DEFINITION | sed 's/.*task\/\(.*\)/\1/')
echo "📋 Using task definition: $TASK_DEF_NAME_REV"

# AWS ECS cluster and service information
CLUSTER_NAME="stamps-app-${ENV}-Cluster"
SERVICE_NAME="stamps-app-${ENV}-front-end-Service"

echo "🔄 Updating service $SERVICE_NAME in cluster $CLUSTER_NAME with task definition $TASK_DEF_NAME_REV"

# Update the service
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --task-definition "$TASK_DEF_NAME_REV" \
  --force-new-deployment

echo "✅ Service update initiated successfully!"
echo "⏱️ Deployment in progress. It may take a few minutes for the changes to be applied."
echo "📊 You can monitor the deployment status in the AWS ECS console."

echo "Done!"