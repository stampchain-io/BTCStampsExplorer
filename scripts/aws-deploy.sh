#!/bin/bash
set -e

# =====================================================================
# AWS deployment script for BTCStampsExplorer
# =====================================================================
# Required environment variables (set in .env file):
# AWS_ACCOUNT_ID - AWS account ID for ECR login
# Optional environment variables:
# AWS_PRIMARY_SUBNET - Primary subnet for ECS tasks (must be public)
# AWS_SECONDARY_SUBNET - Secondary subnet for ECS tasks (for high availability)
# AWS_ECS_SECURITY_GROUP - Security group for ECS tasks
# ECS_CLUSTER_NAME - ECS cluster name (default: stamps-app-prod)
# ECS_SERVICE_NAME - ECS service name (default: stamps-app-service)
# ECR_REPOSITORY_NAME - ECR repository name (default: btc-stamps-explorer)
# AWS_REGION - AWS region (default: us-east-1)
# ELASTICACHE_CLUSTER_NAME - ElastiCache cluster name (default: stamps-app-cache)
# =====================================================================

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    # More robust way to load .env variables
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ $key == \#* ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove any inline comments from the value
        value=$(echo "$value" | sed 's/[[:space:]]*#.*$//')
        
        # Clear any carriage returns or other special characters that might be in the value
        value=$(echo "$value" | tr -d '\r')
        
        # Export the variable
        export "$key=$value"
    done < .env
fi

# Default values from .env file or fallback to defaults
# IMPORTANT: Ensure all sensitive values are stored in .env file, not hardcoded
ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-stamps-app-prod}"
ECS_SERVICE_NAME="${ECS_SERVICE_NAME:-stamps-app-service}"
ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-btc-stamps-explorer}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Subnet, security group and other configs - these SHOULD be set in .env file
# Only using fallbacks for backward compatibility
AWS_PRIMARY_SUBNET="${AWS_PRIMARY_SUBNET:-}"
AWS_SECONDARY_SUBNET="${AWS_SECONDARY_SUBNET:-}"
AWS_ECS_SECURITY_GROUP="${AWS_ECS_SECURITY_GROUP:-}"
ELASTICACHE_CLUSTER_NAME="${ELASTICACHE_CLUSTER_NAME:-stamps-app-cache}"

# Check for required environment variables
if [ -z "$AWS_PRIMARY_SUBNET" ]; then
  echo -e "${YELLOW}WARNING: AWS_PRIMARY_SUBNET not set in .env file.${NC}"
  echo -e "${YELLOW}Using default subnet. This is not recommended for production.${NC}"
  AWS_PRIMARY_SUBNET="subnet-04f3ca3e22f793531" # Fallback only if not in .env
fi

if [ -z "$AWS_ECS_SECURITY_GROUP" ]; then
  echo -e "${YELLOW}WARNING: AWS_ECS_SECURITY_GROUP not set in .env file.${NC}"
  echo -e "${YELLOW}Using default security group. This is not recommended for production.${NC}"
  AWS_ECS_SECURITY_GROUP="sg-0c1ea60980e66ebe4" # Fallback only if not in .env
fi

# Configure AWS CLI to not use pager (prevents requiring 'q' to exit large outputs)
export AWS_PAGER=""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Some features like service validation will be limited.${NC}"
    echo -e "${YELLOW}Install jq for better monitoring: https://stedolan.github.io/jq/download/${NC}"
    JQ_INSTALLED=false
else
    JQ_INSTALLED=true
fi

# Validate required environment variables
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}AWS_ACCOUNT_ID is required but not set${NC}"
    exit 1
fi

# Helper function to show usage
usage() {
    echo -e "${YELLOW}Usage: $0 [OPTIONS]${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  --build             Build and push Docker image to ECR locally"
    echo -e "  --codebuild         Start a build in AWS CodeBuild instead of building locally"
    echo -e "  --deploy            Deploy the latest image to ECS"
    echo -e "  --fix-networking    Update ECS service with correct networking configuration for ECR access"
    echo -e "  --diagnose          Diagnose ECR connectivity issues and verify VPC endpoint configuration"
    echo -e "  --skip-build        Skip building Docker image (alias for backward compatibility)"
    echo -e "  --cache-deno-image  Cache Deno image from Docker Hub to ECR (version specified with --deno-version)"
    echo -e "  --deno-version      Deno version to cache (default: 2.3.1, use with --cache-deno-image)"
    echo -e "  --list-images       List all available images in ECR repository with timestamps"
    echo -e "  --auto-tag-images   Automatically tag all untagged images with date-based tags"
    echo -e "  --select-image      Select a specific image tag to deploy instead of latest"
    echo -e "  --help              Show this help message"
    echo -e ""
    echo -e "${YELLOW}Common Workflows:${NC}"
    echo -e "  1. Update task definition:    ./scripts/update-task-def.sh"
    echo -e "  2. Fix network connectivity:   ${0} --fix-networking"
    echo -e "  3. Full deployment:            ${0} --build --deploy"
    echo -e "  4. Cloud-based build/deploy:   ${0} --codebuild --deploy"
    echo -e "  5. Cache Deno image to ECR:    ${0} --cache-deno-image --deno-version 2.2.8"
    echo -e "  6. List available images:      ${0} --list-images"
    echo -e "  7. Auto-tag untagged images:   ${0} --auto-tag-images"
    echo -e "  8. Deploy specific version:    ${0} --deploy --select-image v20240411.1"
    echo -e ""
    echo -e "${YELLOW}Health Check URL:${NC}"
    echo -e "  Use the simple health check to avoid unnecessary dependencies failing the health check:"
    echo -e "  /api/v2/health?simple"
    echo -e ""
    echo -e "${YELLOW}High Availability:${NC}"
    echo -e "  The service is configured to run 2 tasks for high availability"
    echo -e "  This ensures the application remains available even if one task fails"
    echo -e ""
    echo -e "${YELLOW}Docker Rate Limiting:${NC}"
    echo -e "  If you encounter Docker Hub rate limiting during builds, cache the Deno image with:"
    echo -e "  ${0} --cache-deno-image"
    echo -e ""
    echo -e "${YELLOW}Image Selection:${NC}"
    echo -e "  List all available images with timestamps and tags:"
    echo -e "  ${0} --list-images"
    echo -e ""
    echo -e "  Automatically add date-based tags to untagged images:"
    echo -e "  ${0} --auto-tag-images"
    echo -e ""
    echo -e "  Deploy a specific version instead of 'latest':"
    echo -e "  ${0} --deploy --select-image v20240411.1"
    echo -e ""
    echo -e "${YELLOW}ECS Task Definition:${NC}"
    echo -e "  If you encounter issues after removing references from the codebase, "
    echo -e "  run update-task-def.sh to inspect and update environment variables in the task"
    echo -e "  definition."
    exit 1
}

# Process command line arguments
BUILD=false
DEPLOY=false
FIX_NETWORKING=false
DIAGNOSE=false
CODEBUILD=false
FIX_TASK_DEF=false
CACHE_DENO_IMAGE=false
LIST_IMAGES=false
AUTO_TAG_IMAGES=false
SELECT_IMAGE=""
DENO_VERSION="2.3.1"

for arg in "$@"; do
    case $arg in
        --build)
            BUILD=true
            shift
            ;;
        --codebuild)
            CODEBUILD=true
            shift
            ;;
        --deploy)
            DEPLOY=true
            shift
            ;;
        --fix-networking)
            FIX_NETWORKING=true
            shift
            ;;
        --diagnose)
            DIAGNOSE=true
            shift
            ;;
        --fix-task-def)
            echo -e "${YELLOW}The --fix-task-def option has been moved to a separate script.${NC}"
            echo -e "${GREEN}Please use './scripts/update-task-def.sh' instead.${NC}"
            exit 1
            ;;
        --cache-deno-image)
            CACHE_DENO_IMAGE=true
            shift
            ;;
        --list-images)
            LIST_IMAGES=true
            shift
            ;;
        --auto-tag-images)
            AUTO_TAG_IMAGES=true
            shift
            ;;
        --select-image=*)
            SELECT_IMAGE="${arg#*=}"
            shift
            ;;
        --select-image)
            SELECT_IMAGE="$2"
            shift 2
            ;;
        --deno-version=*)
            DENO_VERSION="${arg#*=}"
            shift
            ;;
        --deno-version)
            DENO_VERSION="$2"
            shift 2
            ;;
        --skip-build)
            # For backward compatibility, deploy without building
            DEPLOY=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            usage
            ;;
    esac
done

# If no action specified, show usage
if [ "$BUILD" = false ] && [ "$CODEBUILD" = false ] && [ "$DEPLOY" = false ] && [ "$FIX_NETWORKING" = false ] && 
   [ "$DIAGNOSE" = false ] && [ "$FIX_TASK_DEF" = false ] && [ "$CACHE_DENO_IMAGE" = false ] && 
   [ "$LIST_IMAGES" = false ] && [ "$AUTO_TAG_IMAGES" = false ] && [ -z "$SELECT_IMAGE" ]; then
    usage
fi

# ECR login
echo -e "${GREEN}Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Function to list available images in ECR
list_ecr_images() {
    echo -e "${GREEN}Listing available images in repository ${ECR_REPOSITORY_NAME}...${NC}"
    
    # Check if the ECR repository exists
    if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${RED}Error: ECR repository '$ECR_REPOSITORY_NAME' does not exist.${NC}"
        return 1
    fi
    
    # Get list of images with timestamps
    if [ "$JQ_INSTALLED" = true ]; then
        # Use jq for better formatting when available
        echo -e "${GREEN}=== Available Images in ${ECR_REPOSITORY_NAME} ===${NC}"
        echo -e "${YELLOW}Image Tag              | Push Date           | Size    | Digest (Short)${NC}"
        echo -e "${YELLOW}------------------------------------------------------------------${NC}"
        
        # Use a very simple jq query that works with all jq versions
        aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --output json | \
        jq -r '.imageDetails | sort_by(.imagePushedAt) | reverse | .[] | 
            if has("imageTags") and (.imageTags | length > 0) then 
                (.imageTags[0] // "<no tag>") + " | " + 
                (.imagePushedAt[0:19] | gsub("T"; " ")) + " | " + 
                (if has("imageSizeInBytes") then ((.imageSizeInBytes/1024/1024) | floor | tostring) + " MB" else "N/A" end) + " | " +
                (.imageDigest | split(":")[1][0:12])
            else 
                "<untagged> | " + 
                (.imagePushedAt[0:19] | gsub("T"; " ")) + " | " + 
                (if has("imageSizeInBytes") then ((.imageSizeInBytes/1024/1024) | floor | tostring) + " MB" else "N/A" end) + " | " +
                (.imageDigest | split(":")[1][0:12])
            end'
        
        echo -e "\n${YELLOW}Current production image: latest${NC}"
        LATEST_DIGEST=$(aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --image-ids imageTag=latest --region "$AWS_REGION" --query 'imageDetails[0].imageDigest' --output text 2>/dev/null || echo "")
        if [ -n "$LATEST_DIGEST" ] && [ "$LATEST_DIGEST" != "None" ]; then
            # Find all tags with the same digest as 'latest'
            echo -e "${GREEN}The 'latest' tag currently points to:${NC}"
            aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --output json | \
            jq --arg DIGEST "$LATEST_DIGEST" -r '.imageDetails[] | select(.imageDigest == $DIGEST) | 
                if has("imageTags") then 
                    (.imageTags | length | tostring) + " tags, including:" 
                else 
                    "<no tags>"
                end'
                
            # Simple approach to list other tags for latest image
            echo -e "${YELLOW}All tags for the 'latest' image:${NC}"
            aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --image-ids imageTag=latest --region "$AWS_REGION" --output json | \
            jq -r '.imageDetails[0].imageTags[]' | sort | while read -r tag; do
                echo "  - $tag"
            done
        else
            echo -e "${YELLOW}  No 'latest' tag found in the repository${NC}"
        fi
        
        # Suggest automatically generating tags for untagged images
        echo -e "\n${YELLOW}To automatically tag images with date-based tags:${NC}"
        echo -e "${GREEN}Run: ${0} --auto-tag-images${NC}"
    else
        # Simpler display without jq
        echo -e "${GREEN}Available image tags (newest first):${NC}"
        echo -e "${YELLOW}Note: Install jq for better output with timestamps and size information${NC}"
        aws ecr list-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --query 'imageIds[?imageTag!=`null`].imageTag' --output text | tr '\t' '\n' | sort -r
    fi
    
    echo -e "\n${GREEN}To deploy a specific image, use:${NC}"
    echo -e "${YELLOW}${0} --deploy --select-image <tag>${NC}"
    return 0
}

# List available images if requested as a standalone operation
if [ "$LIST_IMAGES" = true ] && [ "$BUILD" = false ] && [ "$CODEBUILD" = false ] && [ "$DEPLOY" = false ] && 
   [ "$FIX_NETWORKING" = false ] && [ "$DIAGNOSE" = false ] && [ "$FIX_TASK_DEF" = false ] && 
   [ "$CACHE_DENO_IMAGE" = false ] && [ -z "$SELECT_IMAGE" ]; then
    
    list_ecr_images
    exit 0
fi

# If --list-images is combined with other operations, show the images but continue
if [ "$LIST_IMAGES" = true ]; then
    list_ecr_images
fi

# Automatically tag untagged images if requested
if [ "$AUTO_TAG_IMAGES" = true ]; then
    echo -e "${GREEN}Automatically tagging untagged images in repository ${ECR_REPOSITORY_NAME}...${NC}"
    
    # Check if the ECR repository exists
    if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${RED}Error: ECR repository '$ECR_REPOSITORY_NAME' does not exist.${NC}"
        exit 1
    fi
    
    # Get information about untagged images
    echo -e "${YELLOW}Checking for untagged images...${NC}"
    # Get all image digests
    ALL_DIGESTS=$(aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --output json | \
                  jq -r '.imageDetails[] | .imageDigest')
    
    # Get all tagged image digests 
    TAGGED_DIGESTS=$(aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --output json | \
                    jq -r '.imageDetails[] | select(has("imageTags")) | .imageDigest')
    
    # Find untagged images by comparing the lists
    UNTAGGED_IMAGES=""
    for digest in $ALL_DIGESTS; do
        if ! echo "$TAGGED_DIGESTS" | grep -q "$digest"; then
            # Get push date for this digest
            PUSH_DATE=$(aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --image-ids imageDigest="$digest" --output json | \
                        jq -r '.imageDetails[0].imagePushedAt')
            UNTAGGED_IMAGES="${UNTAGGED_IMAGES}${digest}	${PUSH_DATE}
"
        fi
    done
    
    if [ -z "$UNTAGGED_IMAGES" ]; then
        echo -e "${GREEN}No untagged images found in repository.${NC}"
    else
        echo -e "${GREEN}Found untagged images. Adding date-based tags...${NC}"
        
        # Process each untagged image
        echo "$UNTAGGED_IMAGES" | while read -r IMAGE_INFO; do
            # Extract digest and timestamp
            IMAGE_DIGEST=$(echo "$IMAGE_INFO" | cut -f1)
            PUSH_DATE=$(echo "$IMAGE_INFO" | cut -f2)
            
            # Convert ISO date to YYYYMMDD-HHMMSS format for tag
            DATE_TAG=$(echo "$PUSH_DATE" | sed 's/[-:T]//g' | cut -d. -f1 | sed 's/\([0-9]\{8\}\)\([0-9]\{6\}\)/\1-\2/')
            TAG="date-$DATE_TAG"
            
            echo -e "${YELLOW}Adding tag '$TAG' to image $IMAGE_DIGEST${NC}"
            
            # Tag the image
            if aws ecr put-image --repository-name "$ECR_REPOSITORY_NAME" --image-tag "$TAG" --image-manifest "$(aws ecr batch-get-image --repository-name "$ECR_REPOSITORY_NAME" --image-ids imageDigest="$IMAGE_DIGEST" --query 'images[].imageManifest' --output text)" --region "$AWS_REGION" > /dev/null; then
                echo -e "${GREEN}✓ Successfully tagged image with $TAG${NC}"
            else
                echo -e "${RED}✗ Failed to tag image${NC}"
            fi
        done
        
        # Show the updated list of images
        echo -e "\n${GREEN}Updated image list:${NC}"
        list_ecr_images
    fi
    
    # Exit if auto-tagging was the only action
    if [ "$BUILD" = false ] && [ "$CODEBUILD" = false ] && [ "$DEPLOY" = false ] && [ "$FIX_NETWORKING" = false ] && 
       [ "$DIAGNOSE" = false ] && [ "$FIX_TASK_DEF" = false ] && [ "$CACHE_DENO_IMAGE" = false ] && 
       [ "$LIST_IMAGES" = false ] && [ -z "$SELECT_IMAGE" ]; then
        exit 0
    fi
fi

# Cache Deno image from Docker Hub to ECR if requested
if [ "$CACHE_DENO_IMAGE" = true ]; then
    # Define repository names
    BASE_REPOSITORY_NAME="${ECR_REPOSITORY_NAME}-base"
    
    # Create the base repository if it doesn't exist
    echo -e "${GREEN}Checking for base repository ${BASE_REPOSITORY_NAME}...${NC}"
    if ! aws ecr describe-repositories --repository-names "$BASE_REPOSITORY_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${YELLOW}Base repository '$BASE_REPOSITORY_NAME' does not exist. Creating it...${NC}"
        aws ecr create-repository --repository-name "$BASE_REPOSITORY_NAME" --region "$AWS_REGION"
    else
        echo -e "${GREEN}Base repository '$BASE_REPOSITORY_NAME' found.${NC}"
    fi
    
    # Pull, tag, and push the Deno image
    echo -e "${GREEN}Pulling Deno image version ${DENO_VERSION} from Docker Hub...${NC}"
    docker pull --platform=linux/amd64 denoland/deno:alpine-${DENO_VERSION}
    
    echo -e "${GREEN}Tagging Deno image for ECR...${NC}"
    docker tag denoland/deno:alpine-${DENO_VERSION} "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_REPOSITORY_NAME:alpine-${DENO_VERSION}"
    
    echo -e "${GREEN}Pushing Deno image to ECR...${NC}"
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_REPOSITORY_NAME:alpine-${DENO_VERSION}"
    
    echo -e "${GREEN}Deno image version ${DENO_VERSION} successfully cached to ECR.${NC}"
    echo -e "${GREEN}You can now use this image in your Dockerfile or CodeBuild project by replacing:${NC}"
    echo -e "${YELLOW}FROM denoland/deno:alpine-${DENO_VERSION}${NC}"
    echo -e "${GREEN}with:${NC}"
    echo -e "${YELLOW}FROM ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BASE_REPOSITORY_NAME}:alpine-${DENO_VERSION}${NC}"
    
    exit 0
fi

# Start a CodeBuild build if requested
if [ "$CODEBUILD" = true ]; then
    CODEBUILD_PROJECT=${AWS_CODEBUILD_PROJECT_NAME:-stamps-app-build}
    echo -e "${GREEN}Starting build in AWS CodeBuild project: ${CODEBUILD_PROJECT}...${NC}"
    # Debug echo to check all key variables
    echo "DEBUG: Cluster=${ECS_CLUSTER_NAME}, Service=${ECS_SERVICE_NAME}, Region=${AWS_REGION}, Repo=${ECR_REPOSITORY_NAME}"
    
    # Start the build in CodeBuild
    BUILD_ID=$(aws codebuild start-build --project-name "$CODEBUILD_PROJECT" --query 'build.id' --output text)
    
    if [ -n "$BUILD_ID" ]; then
        echo -e "${GREEN}Build started with ID: ${BUILD_ID}${NC}"
        echo -e "${YELLOW}Monitoring build progress...${NC}"
        
        # Initialize build status
        BUILD_STATUS="IN_PROGRESS"
        
        # Monitor build status
        while [ "$BUILD_STATUS" = "IN_PROGRESS" ]; do
            sleep 10
            BUILD_STATUS=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].buildStatus' --output text)
            CURRENT_PHASE=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query 'builds[0].currentPhase' --output text)
            echo -e "${YELLOW}Build status: ${BUILD_STATUS}, Current phase: ${CURRENT_PHASE}${NC}"
        done
        
        # Check final build status
        if [ "$BUILD_STATUS" = "SUCCEEDED" ]; then
            echo -e "${GREEN}Build completed successfully!${NC}"
            
            # Store service name with explicit quoting to prevent errors - ensure variables persist for deployment
            # These variables need to be available for the deploy section
            ECS_SERVICE_NAME="${ECS_SERVICE_NAME:-stamps-app-service}"
            ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-stamps-app-prod}"
            ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-btc-stamps-explorer}"
            
            # Debug echo to help troubleshoot
            echo "DEBUG: Service=${ECS_SERVICE_NAME}, Cluster=${ECS_CLUSTER_NAME}, Repository=${ECR_REPOSITORY_NAME}"
            
            # Set deploy flag to true after successful build to ensure deployment happens
            DEPLOY=true
        else
            echo -e "${RED}Build failed with status: ${BUILD_STATUS}${NC}"
            echo -e "${YELLOW}Continuing with deployment of existing ECR image...${NC}"
            DEPLOY=true
        fi
    else
        echo -e "${RED}Failed to start build in CodeBuild. Continuing with deployment...${NC}"
        DEPLOY=true
    fi
    
    # Make sure variables are properly set for deployment after CodeBuild, even if build failed
    if [ "$CODEBUILD" = true ]; then
        # Ensure ECS service variables are set correctly
        echo -e "${GREEN}Verifying deployment variables after CodeBuild...${NC}"
        ECS_SERVICE_NAME="${ECS_SERVICE_NAME:-stamps-app-service}"
        ECS_CLUSTER_NAME="${ECS_CLUSTER_NAME:-stamps-app-prod}"
        ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-btc-stamps-explorer}"
        echo "DEBUG: Final variables for deployment - Service=${ECS_SERVICE_NAME}, Cluster=${ECS_CLUSTER_NAME}, Repository=${ECR_REPOSITORY_NAME}"
    fi
    
# Build and push Docker image locally if requested
elif [ "$BUILD" = true ]; then
    # Check if the ECR repository exists
    if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${YELLOW}ECR repository '$ECR_REPOSITORY_NAME' does not exist. Creating it...${NC}"
        aws ecr create-repository --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION"
    else
        echo -e "${GREEN}ECR repository '$ECR_REPOSITORY_NAME' found.${NC}"
    fi
    
    echo -e "${GREEN}Building Docker image locally for AMD64 architecture...${NC}"
    # Use a local tag without slashes for Docker build
    LOCAL_TAG="stamps_app_frontend"
    docker build --platform=linux/amd64 -t "$LOCAL_TAG:latest" .
    
    echo -e "${GREEN}Tagging Docker image...${NC}"
    docker tag "$LOCAL_TAG:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"
    
    echo -e "${GREEN}Pushing Docker image to ECR...${NC}"
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"
    
    echo -e "${GREEN}Cleaning up local image...${NC}"
    docker rmi "$LOCAL_TAG:latest"
fi

# Fix networking configuration for ECS service if requested
if [ "$FIX_NETWORKING" = true ]; then
    echo -e "${GREEN}Updating ECS service with correct network configuration...${NC}"
    
    # Validate AWS resources
    echo -e "${GREEN}Validating primary subnet for internet access...${NC}"
    
    # Verify primary subnet exists
    echo -e "${GREEN}Verifying subnet ${AWS_PRIMARY_SUBNET} exists...${NC}"
    if ! aws ec2 describe-subnets --subnet-ids "$AWS_PRIMARY_SUBNET" --query 'Subnets[0].SubnetId' --output text &>/dev/null; then
        echo -e "${RED}Error: Primary subnet ${AWS_PRIMARY_SUBNET} does not exist!${NC}"
        echo -e "${YELLOW}Available subnets:${NC}"
        aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,VpcId,AvailabilityZone,CidrBlock]' --output text
        echo -e "${YELLOW}Please update AWS_PRIMARY_SUBNET in your .env file.${NC}"
        exit 1
    fi
    
    # Configure subnet setup based on available values
    SUBNET_CONFIG="[${AWS_PRIMARY_SUBNET}]"
    
    # Add secondary subnet if available
    if [ -n "$AWS_SECONDARY_SUBNET" ]; then
        echo -e "${GREEN}Verifying secondary subnet ${AWS_SECONDARY_SUBNET} exists...${NC}"
        if aws ec2 describe-subnets --subnet-ids "$AWS_SECONDARY_SUBNET" --query 'Subnets[0].SubnetId' --output text &>/dev/null; then
            echo -e "${GREEN}Using two subnets for high availability${NC}"
            SUBNET_CONFIG="[${AWS_PRIMARY_SUBNET},${AWS_SECONDARY_SUBNET}]"
        else
            echo -e "${YELLOW}Warning: Secondary subnet ${AWS_SECONDARY_SUBNET} not found. Using only primary subnet.${NC}"
        fi
    else
        echo -e "${YELLOW}No secondary subnet configured. Using only ${AWS_PRIMARY_SUBNET}${NC}"
    fi
    
    # Get current task definition
    TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].taskDefinition' --output text)
    echo -e "${GREEN}Current task definition: ${TASK_DEF_ARN}${NC}"
    
    echo -e "${GREEN}Updating ECS service with network configuration...${NC}"
    echo -e "${YELLOW}Using subnet configuration: ${SUBNET_CONFIG}${NC}"
    echo -e "${YELLOW}Using security group: ${AWS_ECS_SECURITY_GROUP}${NC}"
    
    # Update ECS service with network configuration
    aws ecs update-service \
      --cluster "${ECS_CLUSTER_NAME}" \
      --service "${ECS_SERVICE_NAME}" \
      --task-definition "${TASK_DEF_ARN}" \
      --desired-count 2 \
      --network-configuration "awsvpcConfiguration={subnets=${SUBNET_CONFIG},securityGroups=[${AWS_ECS_SECURITY_GROUP}],assignPublicIp=ENABLED}" \
      --health-check-grace-period-seconds 300 \
      --force-new-deployment
    
    # Update target group health check path
    echo -e "${GREEN}Checking for associated target groups to update health check path...${NC}"
    
    # Find the load balancer target group associated with the service
    TARGET_GROUPS=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].loadBalancers[*].targetGroupArn' --output text)
    
    if [ -n "$TARGET_GROUPS" ]; then
        echo -e "${GREEN}Found target groups: ${TARGET_GROUPS}${NC}"
        
        for TARGET_GROUP in $TARGET_GROUPS; do
            echo -e "${GREEN}Updating health check path for target group: ${TARGET_GROUP}${NC}"
            
            # Update health check path and settings
            aws elbv2 modify-target-group --target-group-arn "$TARGET_GROUP" --health-check-path "/api/v2/health?simple" --health-check-interval-seconds 30 --health-check-timeout-seconds 10 --healthy-threshold-count 2 --unhealthy-threshold-count 3
            
            echo -e "${GREEN}Health check updated for target group: ${TARGET_GROUP}${NC}"
        done
    else
        echo -e "${YELLOW}No target groups found for service ${ECS_SERVICE_NAME}. No health check updates needed.${NC}"
    fi
fi

# Deploy to ECS if requested
if [ "$DEPLOY" = true ]; then
    echo -e "${GREEN}Deploying to ECS...${NC}"
    
    # First, get current task definition and update it to use the correct repository
    echo -e "${GREEN}Fixing task definition to use correct repository first...${NC}"
    
    # Get current task definition
    TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].taskDefinition' --output text)
    echo -e "${GREEN}Current task definition: ${TASK_DEF_ARN}${NC}"
    
    # Get the task definition JSON
    TASK_DEF=$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN")
    
    # Get current image
    CURRENT_IMAGE=$(echo "$TASK_DEF" | jq -r '.taskDefinition.containerDefinitions[0].image')
    echo -e "${GREEN}Current image: ${CURRENT_IMAGE}${NC}"
    
    # Determine the image tag to use
    IMAGE_TAG="latest"
    
    # Use the selected image tag if specified
    if [ -n "$SELECT_IMAGE" ]; then
        echo -e "${GREEN}Using specified image tag: ${SELECT_IMAGE}${NC}"
        
        # Verify that the selected image tag exists
        if aws ecr describe-images --repository-name "$ECR_REPOSITORY_NAME" --image-ids imageTag="$SELECT_IMAGE" --region "$AWS_REGION" &> /dev/null; then
            IMAGE_TAG="$SELECT_IMAGE"
            echo -e "${GREEN}✓ Image tag ${SELECT_IMAGE} found in repository${NC}"
        else
            echo -e "${RED}Error: Image tag ${SELECT_IMAGE} not found in repository ${ECR_REPOSITORY_NAME}${NC}"
            echo -e "${YELLOW}Available image tags:${NC}"
            aws ecr list-images --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --query 'imageIds[?imageTag!=`null`].imageTag' --output text | tr '\t' '\n' | sort -r
            echo -e "${YELLOW}To list all available images with details, run: ${0} --list-images${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}Using default 'latest' image tag${NC}"
    fi
    
    # Correct image URI using our repository and the selected tag
    CORRECT_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG"
    echo -e "${GREEN}Using image: ${CORRECT_IMAGE}${NC}"
    
    # Create new task definition with the correct image
    NEW_TASK_DEF=$(echo "$TASK_DEF" | jq --arg IMAGE "$CORRECT_IMAGE" '.taskDefinition | 
        del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) | 
        .containerDefinitions[0].image = $IMAGE')
    
    # Register new task definition
    echo -e "${GREEN}Registering new task definition...${NC}"
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF" --query 'taskDefinition.taskDefinitionArn' --output text)
    
    if [ -n "$NEW_TASK_DEF_ARN" ]; then
        echo -e "${GREEN}New task definition registered: ${NEW_TASK_DEF_ARN}${NC}"
    else
        echo -e "${RED}Failed to register new task definition.${NC}"
        exit 1
    fi
    
    # Configure subnet setup based on available values
    SUBNET_CONFIG="[${AWS_PRIMARY_SUBNET}]"
    
    # Add secondary subnet if available
    if [ -n "$AWS_SECONDARY_SUBNET" ]; then
        echo -e "${GREEN}Verifying secondary subnet ${AWS_SECONDARY_SUBNET} exists...${NC}"
        if aws ec2 describe-subnets --subnet-ids "$AWS_SECONDARY_SUBNET" --query 'Subnets[0].SubnetId' --output text &>/dev/null; then
            echo -e "${GREEN}Using two subnets for high availability${NC}"
            SUBNET_CONFIG="[${AWS_PRIMARY_SUBNET},${AWS_SECONDARY_SUBNET}]"
        else
            echo -e "${YELLOW}Warning: Secondary subnet ${AWS_SECONDARY_SUBNET} not found. Using only primary subnet.${NC}"
        fi
    else
        echo -e "${YELLOW}No secondary subnet configured. Using only ${AWS_PRIMARY_SUBNET}${NC}"
    fi
    
    echo -e "${GREEN}Updating ECS service...${NC}"
    echo -e "${YELLOW}Using subnet configuration: ${SUBNET_CONFIG}${NC}"
    echo -e "${YELLOW}Using security group: ${AWS_ECS_SECURITY_GROUP}${NC}"
    
    aws ecs update-service \
      --cluster "${ECS_CLUSTER_NAME}" \
      --service "${ECS_SERVICE_NAME}" \
      --task-definition "${NEW_TASK_DEF_ARN}" \
      --desired-count 2 \
      --network-configuration "awsvpcConfiguration={subnets=${SUBNET_CONFIG},securityGroups=[${AWS_ECS_SECURITY_GROUP}],assignPublicIp=ENABLED}" \
      --health-check-grace-period-seconds 300 \
      --force-new-deployment
    
    echo -e "${GREEN}The service is now configured to run 2 tasks for high availability${NC}"
    
    # Update the load balancer target group health check to use simple health check
    echo -e "${GREEN}Checking for associated target groups to update health check path...${NC}"
    
    # First, find the load balancer target group associated with the service
    TARGET_GROUPS=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].loadBalancers[*].targetGroupArn' --output text)
    
    if [ -n "$TARGET_GROUPS" ]; then
        echo -e "${GREEN}Found target groups: ${TARGET_GROUPS}${NC}"
        
        for TARGET_GROUP in $TARGET_GROUPS; do
            echo -e "${GREEN}Updating health check path for target group: ${TARGET_GROUP}${NC}"
            
            # Update health check path and settings
            aws elbv2 modify-target-group --target-group-arn "$TARGET_GROUP" --health-check-path "/api/v2/health?simple" --health-check-interval-seconds 30 --health-check-timeout-seconds 10 --healthy-threshold-count 2 --unhealthy-threshold-count 3
            
            echo -e "${GREEN}Health check updated for target group: ${TARGET_GROUP}${NC}"
        done
    else
        echo -e "${YELLOW}No target groups found for service ${ECS_SERVICE_NAME}. No health check updates needed.${NC}"
    fi
    
    echo -e "${YELLOW}Check AWS ECS console for ongoing status and CloudWatch logs for application logs.${NC}"
fi

# Diagnostics section
if [ "$DIAGNOSE" = true ]; then
    echo -e "${GREEN}Running connectivity diagnostics...${NC}"
    
    echo -e "${GREEN}Checking subnet configuration for ECR connectivity...${NC}"
    echo -e "${YELLOW}Primary Subnet ID: ${AWS_PRIMARY_SUBNET}${NC}"
    if [ -n "$AWS_SECONDARY_SUBNET" ]; then
        echo -e "${YELLOW}Secondary Subnet ID: ${AWS_SECONDARY_SUBNET}${NC}"
    fi
    
    # Check subnet details
    echo -e "${GREEN}Primary subnet details:${NC}"
    aws ec2 describe-subnets --subnet-ids "$AWS_PRIMARY_SUBNET" --query 'Subnets[0].[VpcId,AvailabilityZone,MapPublicIpOnLaunch,CidrBlock]' --output text
    
    # Get the VPC ID from the subnet
    VPC_ID=$(aws ec2 describe-subnets --subnet-ids "$AWS_PRIMARY_SUBNET" --query 'Subnets[0].VpcId' --output text)
    echo -e "${GREEN}VPC ID: ${VPC_ID}${NC}"
    
    # Check if the subnet is public
    IS_PUBLIC=$(aws ec2 describe-subnets --subnet-ids "$AWS_PRIMARY_SUBNET" --query 'Subnets[0].MapPublicIpOnLaunch' --output text)
    if [ "$IS_PUBLIC" != "True" ] && [ "$IS_PUBLIC" != "true" ]; then
        echo -e "${YELLOW}Warning: Subnet ${AWS_PRIMARY_SUBNET} does not automatically assign public IPs.${NC}"
        echo -e "${YELLOW}This may cause issues with internet connectivity. Consider using a public subnet instead.${NC}"
    else
        echo -e "${GREEN}Subnet ${AWS_PRIMARY_SUBNET} is public (MapPublicIpOnLaunch=true) ✓${NC}"
    fi
    
    # Check for Internet Gateway
    IGW=$(aws ec2 describe-internet-gateways --no-cli-pager --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text)
    if [ -z "$IGW" ] || [ "$IGW" == "None" ]; then
        echo -e "${RED}WARNING: No Internet Gateway found for VPC ${VPC_ID}${NC}"
        echo -e "${RED}This VPC has no internet access! Tasks will not be able to reach ECR.${NC}"
        echo -e "${RED}Please attach an Internet Gateway to VPC ${VPC_ID} or use a different VPC.${NC}"
    else
        echo -e "${GREEN}✓ Found Internet Gateway ${IGW} attached to VPC ${VPC_ID}${NC}"
    fi
    
    # Check route table for the subnet
    ROUTE_TABLE=$(aws ec2 describe-route-tables --no-cli-pager --filters "Name=association.subnet-id,Values=$AWS_PRIMARY_SUBNET" --query 'RouteTables[0].RouteTableId' --output text)
    if [ -z "$ROUTE_TABLE" ] || [ "$ROUTE_TABLE" == "None" ]; then
        echo -e "${YELLOW}⚠ No explicit route table associated with subnet ${AWS_PRIMARY_SUBNET}, checking main route table${NC}"
        ROUTE_TABLE=$(aws ec2 describe-route-tables --no-cli-pager --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=true" --query 'RouteTables[0].RouteTableId' --output text)
    fi
    
    echo -e "${YELLOW}Route table for subnet: ${ROUTE_TABLE}${NC}"
    
    # Check security group settings
    echo -e "${GREEN}Checking security group ${AWS_ECS_SECURITY_GROUP}:${NC}"
    aws ec2 describe-security-groups --group-ids "$AWS_ECS_SECURITY_GROUP" --query 'SecurityGroups[0].[GroupName,Description]' --output text
    
    # Check outbound rules (needed for ECR access)
    echo -e "${GREEN}Checking outbound rules (needed for ECR access):${NC}"
    aws ec2 describe-security-groups --no-cli-pager --group-ids "$AWS_ECS_SECURITY_GROUP" --query 'SecurityGroups[0].IpPermissionsEgress' --output json
    
    # Check task definition
    echo -e "${GREEN}Checking ECS task definition:${NC}"
    TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query 'services[0].taskDefinition' --output text)
    echo -e "${GREEN}Task definition ARN: ${TASK_DEF_ARN}${NC}"
    
    if [ -n "$TASK_DEF_ARN" ]; then
        # Get task definition details
        aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query 'taskDefinition.[family,revision,networkMode,containerDefinitions[0].image]' --output text
        
        # Check task execution role
        EXECUTION_ROLE=$(aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query 'taskDefinition.executionRoleArn' --output text)
        echo -e "${GREEN}Task execution role: ${EXECUTION_ROLE}${NC}"
    else
        echo -e "${RED}✗ Could not retrieve task definition.${NC}"
    fi
    
    # Check ElastiCache connectivity
    echo -e "\n${GREEN}Checking ElastiCache configuration:${NC}"
    
    # Define ElastiCache cluster name
    ELASTICACHE_CLUSTER=${ELASTICACHE_CLUSTER_NAME:-stamps-app-cache}
    
    # Try to describe the cluster
    echo -e "${GREEN}Checking ElastiCache cluster configuration:${NC}"
    if aws elasticache describe-cache-clusters --no-cli-pager --cache-cluster-id "$ELASTICACHE_CLUSTER" --show-cache-node-info &> /dev/null; then
        echo -e "${GREEN}Found ElastiCache cluster: ${ELASTICACHE_CLUSTER}${NC}"
    else
        echo -e "${YELLOW}Could not find ElastiCache cluster '${ELASTICACHE_CLUSTER}'. Check cluster name.${NC}"
    fi
    
    # Provide a summary
    echo -e "\n${GREEN}==== DIAGNOSTIC SUMMARY =====${NC}"
    echo -e "${YELLOW}Based on the diagnostics, check the following:${NC}"
    echo -e "${YELLOW}1. Use public subnets with internet access${NC}"
    echo -e "${YELLOW}2. Make sure your security group has outbound internet access rules${NC}"
    echo -e "${YELLOW}3. Run 'aws-deploy.sh --fix-networking' to update the ECS service with correct configuration${NC}"
    echo -e "${YELLOW}4. Run 'aws-deploy.sh --deploy' to deploy the application${NC}"
    echo -e "${YELLOW}5. Check CloudWatch logs for detailed error messages${NC}"
fi

echo -e "${GREEN}Done!${NC}"

echo -e "${YELLOW}Quick Reference:${NC}"
echo -e "${GREEN}1. Update env variables from .env file:${NC}"
echo -e "   ./scripts/update-task-def.sh"
echo -e "${GREEN}2. Build and deploy:${NC}"
echo -e "   ${0} --build --deploy"
echo -e "${GREEN}3. Deploy with specific image tag:${NC}"
echo -e "   ${0} --deploy --select-image v20240411.1"