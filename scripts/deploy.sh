#!/bin/bash

# Function to check and fix stack status with timeout
check_and_fix_stack() {
    local ENV=$1
    local STACK_NAME="stamps-app-${ENV}-front-end"
    local TIMEOUT=300  # 5 minutes timeout
    local START_TIME=$(date +%s)
    
    # Check stack status
    STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
    echo "Current stack status: $STATUS"
    
    if [ "$STATUS" == "UPDATE_IN_PROGRESS" ]; then
        echo "Stack is currently updating. Waiting for update to complete..."
        while true; do
            CURRENT_TIME=$(date +%s)
            if [ $((CURRENT_TIME - START_TIME)) -gt $TIMEOUT ]; then
                echo "Timeout waiting for stack update. Please check AWS Console."
                exit 1
            fi
            
            STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text)
            echo "Current stack status: $STATUS"
            
            if [ "$STATUS" == "UPDATE_COMPLETE" ]; then
                echo "Stack update completed successfully!"
                break
            elif [ "$STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]; then
                echo "Stack rolled back successfully!"
                break
            fi
            
            sleep 10
        done
    fi
    
    if [ "$STATUS" == "UPDATE_ROLLBACK_FAILED" ]; then
        echo "Stack is in UPDATE_ROLLBACK_FAILED state. Attempting to continue rollback..."
        aws cloudformation continue-update-rollback --stack-name "$STACK_NAME"
        
        while true; do
            CURRENT_TIME=$(date +%s)
            if [ $((CURRENT_TIME - START_TIME)) -gt $TIMEOUT ]; then
                echo "Timeout waiting for rollback. Please check AWS Console."
                exit 1
            fi
            
            STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text)
            echo "Current stack status: $STATUS"
            
            if [ "$STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]; then
                echo "Rollback completed successfully!"
                break
            elif [ "$STATUS" == "UPDATE_ROLLBACK_FAILED" ]; then
                echo "Rollback failed again. Attempting to delete stack..."
                aws cloudformation delete-stack --stack-name "$STACK_NAME"
                echo "Waiting for stack deletion..."
                aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
                echo "Stack deleted. Ready for fresh deployment."
                break
            fi
            
            sleep 10
        done
    fi
}

# Function to check log group
check_log_group() {
    local ENV=$1
    local ECS_LOG_GROUP="/aws/ecs/stamps-app-${ENV}-front-end"
    local COPILOT_LOG_GROUP="/copilot/stamps-app-${ENV}-front-end"
    
    for LOG_GROUP in "$ECS_LOG_GROUP" "$COPILOT_LOG_GROUP"; do
        echo "Checking log group: $LOG_GROUP"
        if ! aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" | grep -q "$LOG_GROUP"; then
            echo "Creating log group $LOG_GROUP..."
            aws logs create-log-group --log-group-name "$LOG_GROUP"
            echo "Log group created successfully!"
        else
            echo "Log group already exists!"
        fi
    done
}

# Function to check ECS cluster
check_ecs_cluster() {
    local ENV=$1
    local CLUSTER_NAME="stamps-app-${ENV}-Cluster-*"
    
    echo "Checking ECS cluster for environment: $ENV"
    CLUSTER_ARN=$(aws ecs list-clusters | grep -o "arn:aws:ecs:[^\"]*${ENV}-Cluster-[^\"]*")
    
    if [ -z "$CLUSTER_ARN" ]; then
        echo "ECS cluster not found for $ENV environment!"
    else
        echo "Found ECS cluster: $CLUSTER_ARN"
        CLUSTER_STATUS=$(aws ecs describe-clusters --clusters "$CLUSTER_ARN" --query 'clusters[0].status' --output text)
        echo "Cluster status: $CLUSTER_STATUS"
    fi
}

# Main deployment logic
main() {
    local ENV=${1:-test}
    
    echo "Starting deployment for environment: $ENV"
    
    # Comment out DB_HOST in .env (Portable sed command)
    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS requires an empty string argument for -i
        sed -i '' 's/^#*DB_HOST/#DB_HOST/' .env
    else
        # Linux does not
        sed -i 's/^#*DB_HOST/#DB_HOST/' .env
    fi
    
    # Check and fix stack if needed
    check_and_fix_stack "$ENV"
    
    # Add log group check before deployment
    check_log_group "$ENV"
    
    # Check ECS cluster
    check_ecs_cluster "$ENV"
    
    echo "Proceeding with deployment..."
    copilot svc deploy -n front-end -e "$ENV"
}

main "$@"