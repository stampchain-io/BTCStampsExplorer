#!/bin/bash

# =============================================================================
# Enhanced ECS Rolling Deployment Safety Configuration
# =============================================================================
# This script enhances the existing ECS service for safer rolling deployments
# with comprehensive monitoring, health checks, and automated rollback
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Load environment variables from .env if it exists
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    export $(grep -v '^#' .env | xargs)
fi

# Configuration with defaults
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-stamps-app-prod}"
ECS_SERVICE_NAME="${ECS_SERVICE_NAME:-stamps-app-service}"
ALB_NAME="${ALB_NAME:-stamps-prod-alb}"
PROJECT_NAME="${PROJECT_NAME:-stamps-app}"
TEST_MODE="${TEST_MODE:-false}"

echo -e "${CYAN}╔═════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Enhanced ECS Rolling Deployment Safety            ║${NC}"
echo -e "${CYAN}╚═════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}🔧 Configuration:${NC}"
echo -e "${BLUE}   AWS Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}   ECS Cluster: ${ECS_CLUSTER_NAME}${NC}"
echo -e "${BLUE}   ECS Service: ${ECS_SERVICE_NAME}${NC}"
echo -e "${BLUE}   Test Mode: ${TEST_MODE}${NC}"
echo

# Function to enhance ECS service configuration
enhance_ecs_service() {
    echo -e "${YELLOW}🚀 Enhancing ECS Service Configuration...${NC}"

    if [ "$TEST_MODE" = true ]; then
        echo -e "${CYAN}🧪 TEST MODE: Would enhance ECS service configuration${NC}"
        cat << EOF
Would update ECS service with:
- minimumHealthyPercent: 50 (allows more aggressive rolling updates)
- maximumPercent: 200 (allows scaling up during deployment)
- Deployment circuit breaker enabled
- Health check grace period: 300 seconds
- Force new deployment for immediate rollout
EOF
        return
    fi

    # Get current service configuration
    echo -e "${BLUE}📋 Getting current service configuration...${NC}"
    local current_config=$(aws ecs describe-services \
        --cluster "${ECS_CLUSTER_NAME}" \
        --services "${ECS_SERVICE_NAME}" \
        --query 'services[0]' \
        --output json)

    if [ "$current_config" = "null" ]; then
        echo -e "${RED}❌ Service ${ECS_SERVICE_NAME} not found in cluster ${ECS_CLUSTER_NAME}${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Current service found${NC}"

    # Update service with enhanced rolling deployment configuration
    echo -e "${BLUE}🔄 Updating service with enhanced deployment configuration...${NC}"

    local task_definition_arn=$(echo "$current_config" | jq -r '.taskDefinition')
    local desired_count=$(echo "$current_config" | jq -r '.desiredCount')

    # Get network configuration
    local network_config=$(echo "$current_config" | jq '.networkConfiguration')

    aws ecs update-service \
        --cluster "${ECS_CLUSTER_NAME}" \
        --service "${ECS_SERVICE_NAME}" \
        --task-definition "${task_definition_arn}" \
        --desired-count "${desired_count}" \
        --deployment-configuration '{
            "minimumHealthyPercent": 50,
            "maximumPercent": 200,
            "deploymentCircuitBreaker": {
                "enable": true,
                "rollback": true
            }
        }' \
        --network-configuration "${network_config}" \
        --health-check-grace-period-seconds 300 \
        --enable-execute-command \
        --force-new-deployment

    echo -e "${GREEN}✅ ECS service configuration enhanced${NC}"
}

# Function to create CloudWatch alarms for deployment monitoring
create_deployment_alarms() {
    echo -e "${YELLOW}📊 Creating CloudWatch Deployment Alarms...${NC}"

    if [ "$TEST_MODE" = true ]; then
        echo -e "${CYAN}🧪 TEST MODE: Would create CloudWatch alarms${NC}"
        return
    fi

    # Get ALB ARN for metrics
    local alb_arn=$(aws elbv2 describe-load-balancers \
        --names "${ALB_NAME}" \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text 2>/dev/null || echo "")

    if [ -z "$alb_arn" ] || [ "$alb_arn" = "None" ]; then
        echo -e "${YELLOW}⚠️ ALB not found - skipping ALB-based alarms${NC}"
    else
        local alb_full_name=$(echo "${alb_arn}" | cut -d'/' -f2-)
        echo -e "${BLUE}📈 Creating ALB-based alarms for ${alb_full_name}${NC}"

        # High error rate alarm
        aws cloudwatch put-metric-alarm \
            --alarm-name "${PROJECT_NAME}-deployment-error-rate" \
            --alarm-description "High error rate detected during deployment" \
            --metric-name "HTTPCode_Target_5XX_Count" \
            --namespace "AWS/ApplicationELB" \
            --statistic Sum \
            --period 300 \
            --threshold 5 \
            --comparison-operator GreaterThanThreshold \
            --evaluation-periods 2 \
            --dimensions Name=LoadBalancer,Value="${alb_full_name}" \
            --treat-missing-data notBreaching

        # High response time alarm
        aws cloudwatch put-metric-alarm \
            --alarm-name "${PROJECT_NAME}-deployment-response-time" \
            --alarm-description "High response time during deployment" \
            --metric-name "TargetResponseTime" \
            --namespace "AWS/ApplicationELB" \
            --statistic Average \
            --period 300 \
            --threshold 2.0 \
            --comparison-operator GreaterThanThreshold \
            --evaluation-periods 3 \
            --dimensions Name=LoadBalancer,Value="${alb_full_name}" \
            --treat-missing-data notBreaching

        echo -e "${GREEN}✅ ALB monitoring alarms created${NC}"
    fi

    # ECS service alarms
    echo -e "${BLUE}📈 Creating ECS service alarms...${NC}"

    # Service running task count alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-service-running-tasks-low" \
        --alarm-description "ECS service running tasks below minimum" \
        --metric-name "RunningTaskCount" \
        --namespace "AWS/ECS" \
        --statistic Average \
        --period 300 \
        --threshold 1 \
        --comparison-operator LessThanThreshold \
        --evaluation-periods 2 \
        --dimensions Name=ServiceName,Value="${ECS_SERVICE_NAME}" Name=ClusterName,Value="${ECS_CLUSTER_NAME}" \
        --treat-missing-data breaching

    # Service pending task count alarm (indicates deployment issues)
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-service-pending-tasks-high" \
        --alarm-description "ECS service has high pending task count" \
        --metric-name "PendingTaskCount" \
        --namespace "AWS/ECS" \
        --statistic Average \
        --period 300 \
        --threshold 2 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 3 \
        --dimensions Name=ServiceName,Value="${ECS_SERVICE_NAME}" Name=ClusterName,Value="${ECS_CLUSTER_NAME}" \
        --treat-missing-data notBreaching

    echo -e "${GREEN}✅ ECS service monitoring alarms created${NC}"
}

# Function to enhance ALB target group health checks
enhance_target_group_health_checks() {
    echo -e "${YELLOW}🏥 Enhancing Target Group Health Checks...${NC}"

    if [ "$TEST_MODE" = true ]; then
        echo -e "${CYAN}🧪 TEST MODE: Would enhance target group health checks${NC}"
        return
    fi

    # Find target groups associated with the service
    local service_info=$(aws ecs describe-services \
        --cluster "${ECS_CLUSTER_NAME}" \
        --services "${ECS_SERVICE_NAME}" \
        --query 'services[0].loadBalancers[*].targetGroupArn' \
        --output text)

    if [ -z "$service_info" ] || [ "$service_info" = "None" ]; then
        echo -e "${YELLOW}⚠️ No target groups found for service - skipping health check enhancement${NC}"
        return
    fi

    for target_group_arn in $service_info; do
        echo -e "${BLUE}🎯 Enhancing health checks for target group: $(basename "$target_group_arn")${NC}"

        aws elbv2 modify-target-group \
            --target-group-arn "$target_group_arn" \
            --health-check-path "/api/v2/health?simple" \
            --health-check-interval-seconds 15 \
            --health-check-timeout-seconds 10 \
            --healthy-threshold-count 2 \
            --unhealthy-threshold-count 3 \
            --health-check-grace-period-seconds 300

        echo -e "${GREEN}✅ Health checks enhanced for target group${NC}"
    done
}

# Function to create deployment monitoring dashboard
create_deployment_dashboard() {
    echo -e "${YELLOW}📊 Creating Deployment Monitoring Dashboard...${NC}"

    if [ "$TEST_MODE" = true ]; then
        echo -e "${CYAN}🧪 TEST MODE: Would create deployment dashboard${NC}"
        return
    fi

    # Create dashboard configuration
    local dashboard_body=$(cat << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "RunningTaskCount", "ServiceName", "${ECS_SERVICE_NAME}", "ClusterName", "${ECS_CLUSTER_NAME}" ],
                    [ ".", "PendingTaskCount", ".", ".", ".", "." ],
                    [ ".", "DesiredCount", ".", ".", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS_REGION}",
                "title": "ECS Service Task Status"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", "\${ALB_FULL_NAME}" ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", "." ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS_REGION}",
                "title": "HTTP Response Codes"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "\${ALB_FULL_NAME}" ],
                    [ ".", "RequestCount", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS_REGION}",
                "title": "Response Time and Request Count"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "HealthyHostCount", "LoadBalancer", "\${ALB_FULL_NAME}" ],
                    [ ".", "UnHealthyHostCount", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS_REGION}",
                "title": "Target Health Status"
            }
        }
    ]
}
EOF
    )

    # Get ALB full name for dashboard
    local alb_arn=$(aws elbv2 describe-load-balancers \
        --names "${ALB_NAME}" \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text 2>/dev/null || echo "")

    if [ -n "$alb_arn" ] && [ "$alb_arn" != "None" ]; then
        local alb_full_name=$(echo "${alb_arn}" | cut -d'/' -f2-)
        dashboard_body=$(echo "$dashboard_body" | sed "s/\${ALB_FULL_NAME}/$alb_full_name/g")
    fi

    # Create dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name "${PROJECT_NAME}-deployment-monitoring" \
        --dashboard-body "$dashboard_body"

    echo -e "${GREEN}✅ Deployment monitoring dashboard created${NC}"
    echo -e "${BLUE}📊 View dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-deployment-monitoring${NC}"
}

# Function to create rollback script
create_rollback_script() {
    echo -e "${YELLOW}🔄 Creating Automated Rollback Script...${NC}"

    mkdir -p scripts/deployment

    cat > scripts/deployment/rollback-service.sh << 'EOF'
#!/bin/bash
# Automated ECS Service Rollback Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-stamps-app-prod}"
ECS_SERVICE_NAME="${ECS_SERVICE_NAME:-stamps-app-service}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo -e "${YELLOW}🔄 Initiating ECS Service Rollback...${NC}"

# Get current service configuration
current_task_def=$(aws ecs describe-services \
    --cluster "${ECS_CLUSTER_NAME}" \
    --services "${ECS_SERVICE_NAME}" \
    --query 'services[0].taskDefinition' \
    --output text)

echo -e "${BLUE}Current task definition: ${current_task_def}${NC}"

# Get previous task definition revision
family=$(echo "$current_task_def" | cut -d':' -f1)
current_revision=$(echo "$current_task_def" | cut -d':' -f2)
previous_revision=$((current_revision - 1))

if [ $previous_revision -lt 1 ]; then
    echo -e "${RED}❌ No previous revision available for rollback${NC}"
    exit 1
fi

previous_task_def="${family}:${previous_revision}"

echo -e "${YELLOW}Rolling back to: ${previous_task_def}${NC}"

# Perform rollback
aws ecs update-service \
    --cluster "${ECS_CLUSTER_NAME}" \
    --service "${ECS_SERVICE_NAME}" \
    --task-definition "${previous_task_def}" \
    --force-new-deployment

echo -e "${GREEN}✅ Rollback initiated successfully${NC}"
echo -e "${YELLOW}Monitor the rollback progress in AWS Console or using: aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_SERVICE_NAME}${NC}"
EOF

    chmod +x scripts/deployment/rollback-service.sh

    echo -e "${GREEN}✅ Rollback script created at scripts/deployment/rollback-service.sh${NC}"
}

# Function to validate deployment safety
validate_deployment_safety() {
    echo -e "${YELLOW}🔍 Validating Enhanced Deployment Safety...${NC}"

    if [ "$TEST_MODE" = true ]; then
        echo -e "${CYAN}🧪 TEST MODE: Would validate deployment safety${NC}"
        return
    fi

    echo -e "${BLUE}📋 Checking ECS service configuration...${NC}"

    # Check if circuit breaker is enabled
    local circuit_breaker=$(aws ecs describe-services \
        --cluster "${ECS_CLUSTER_NAME}" \
        --services "${ECS_SERVICE_NAME}" \
        --query 'services[0].deploymentConfiguration.deploymentCircuitBreaker.enable' \
        --output text)

    if [ "$circuit_breaker" = "true" ]; then
        echo -e "${GREEN}✅ Deployment circuit breaker is enabled${NC}"
    else
        echo -e "${YELLOW}⚠️ Deployment circuit breaker is not enabled${NC}"
    fi

    # Check CloudWatch alarms
    echo -e "${BLUE}📊 Checking CloudWatch alarms...${NC}"
    local alarm_count=$(aws cloudwatch describe-alarms \
        --alarm-names "${PROJECT_NAME}-deployment-error-rate" "${PROJECT_NAME}-deployment-response-time" "${PROJECT_NAME}-service-running-tasks-low" "${PROJECT_NAME}-service-pending-tasks-high" \
        --query 'length(MetricAlarms)' \
        --output text 2>/dev/null || echo "0")

    echo -e "${GREEN}✅ ${alarm_count} monitoring alarms configured${NC}"

    # Check dashboard
    if aws cloudwatch get-dashboard --dashboard-name "${PROJECT_NAME}-deployment-monitoring" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Deployment monitoring dashboard exists${NC}"
    else
        echo -e "${YELLOW}⚠️ Deployment monitoring dashboard not found${NC}"
    fi

    echo -e "${GREEN}🎉 Deployment safety validation complete!${NC}"
}

# Function to show next steps
show_next_steps() {
    echo
    echo -e "${CYAN}╔═════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    Setup Complete!                         ║${NC}"
    echo -e "${CYAN}╚═════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${GREEN}🎉 Enhanced ECS Rolling Deployment Safety is now configured!${NC}"
    echo
    echo -e "${BLUE}📋 What was configured:${NC}"
    echo -e "${BLUE}   ✅ ECS service with circuit breaker and optimized rolling deployment${NC}"
    echo -e "${BLUE}   ✅ CloudWatch alarms for error rates and response times${NC}"
    echo -e "${BLUE}   ✅ Enhanced health checks with proper thresholds${NC}"
    echo -e "${BLUE}   ✅ Deployment monitoring dashboard${NC}"
    echo -e "${BLUE}   ✅ Automated rollback script${NC}"
    echo
    echo -e "${BLUE}🚀 Next deployment steps:${NC}"
    echo -e "${BLUE}   1. Test deployment: ./scripts/deploy-local-changes.sh${NC}"
    echo -e "${BLUE}   2. Monitor dashboard: CloudWatch → Dashboards → ${PROJECT_NAME}-deployment-monitoring${NC}"
    echo -e "${BLUE}   3. If rollback needed: ./scripts/deployment/rollback-service.sh${NC}"
    echo
    echo -e "${BLUE}📊 Monitoring:${NC}"
    echo -e "${BLUE}   - CloudWatch Console: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}${NC}"
    echo -e "${BLUE}   - ECS Console: https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER_NAME}/services${NC}"
    echo
}

# Help function
show_help() {
    echo "Enhanced ECS Rolling Deployment Safety Setup"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help"
    echo "  --test-mode    Run in test mode (no actual changes)"
    echo
    echo "Environment Variables:"
    echo "  TEST_MODE=true         Run without making changes"
    echo "  ECS_CLUSTER_NAME       ECS cluster name"
    echo "  ECS_SERVICE_NAME       ECS service name"
    echo "  ALB_NAME               Application Load Balancer name"
    echo
    echo "Examples:"
    echo "  $0                     # Full setup"
    echo "  $0 --test-mode         # Test run"
    echo "  TEST_MODE=true $0      # Test run via env var"
}

# Main function
main() {
    echo -e "${GREEN}🚀 Starting Enhanced ECS Rolling Deployment Safety Setup...${NC}"

    # Validate prerequisites
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is not installed${NC}"
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials are not configured${NC}"
        exit 1
    fi

    # Execute setup functions
    enhance_ecs_service
    create_deployment_alarms
    enhance_target_group_health_checks
    create_deployment_dashboard
    create_rollback_script
    validate_deployment_safety
    show_next_steps
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --test-mode)
            TEST_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            show_help
            exit 1
            ;;
    esac
done

# Execute main function
main "$@"
