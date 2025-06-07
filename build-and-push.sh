#!/bin/bash

# BTC Stamps Explorer - Docker Build and Push Script
# This script builds the Docker image and pushes it to Docker Hub

set -e  # Exit on any error

# Configuration
DOCKER_REPO="mortylen/btcstampsexplorer"
DEFAULT_TAG="latest"
BUILD_CONTEXT="."
DOCKERFILE="Dockerfile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or not accessible"
        exit 1
    fi
    
    if [ ! -f "$DOCKERFILE" ]; then
        log_error "Dockerfile not found in current directory"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

get_version_tag() {
    # Try to get version from git tag
    if git describe --tags --exact-match 2>/dev/null; then
        echo $(git describe --tags --exact-match)
    elif git rev-parse --short HEAD 2>/dev/null; then
        echo "git-$(git rev-parse --short HEAD)"
    else
        echo "dev-$(date +%Y%m%d-%H%M%S)"
    fi
}

build_image() {
    local tag="$1"
    local full_tag="$DOCKER_REPO:$tag"
    
    log_info "Building Docker image: $full_tag"
    log_info "Build context: $BUILD_CONTEXT"
    log_info "Dockerfile: $DOCKERFILE"
    
    # Build with progress output
    docker build \
        --tag "$full_tag" \
        --file "$DOCKERFILE" \
        --progress=plain \
        "$BUILD_CONTEXT"
    
    if [ $? -eq 0 ]; then
        log_success "Image built successfully: $full_tag"
        return 0
    else
        log_error "Failed to build image"
        return 1
    fi
}

push_image() {
    local tag="$1"
    local full_tag="$DOCKER_REPO:$tag"
    
    log_info "Pushing image to Docker Hub: $full_tag"
    
    docker push "$full_tag"
    
    if [ $? -eq 0 ]; then
        log_success "Image pushed successfully: $full_tag"
        return 0
    else
        log_error "Failed to push image"
        return 1
    fi
}

check_docker_login() {
    log_info "Checking Docker Hub authentication..."
    
    # Try to get authentication info
    if docker system info | grep -q "Username:"; then
        local username=$(docker system info | grep "Username:" | awk '{print $2}')
        log_success "Logged in as: $username"
        return 0
    else
        log_warning "Not logged in to Docker Hub"
        log_info "Please run: docker login"
        read -p "Do you want to login now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker login
            return $?
        else
            log_error "Docker Hub login required for pushing images"
            return 1
        fi
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS] [TAG]"
    echo ""
    echo "Build and push BTC Stamps Explorer Docker image to Docker Hub"
    echo ""
    echo "Arguments:"
    echo "  TAG                    Image tag (default: auto-detected from git or 'latest')"
    echo ""
    echo "Options:"
    echo "  -h, --help            Show this help message"
    echo "  -b, --build-only      Only build, don't push"
    echo "  -p, --push-only       Only push (assumes image already built)"
    echo "  -f, --force           Force rebuild without cache"
    echo "  -q, --quiet           Reduce output verbosity"
    echo "  --no-latest           Don't tag and push as 'latest'"
    echo "  --dry-run             Show what would be done without executing"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build and push with auto-detected tag"
    echo "  $0 v1.2.3            # Build and push with specific tag"
    echo "  $0 --build-only       # Only build the image"
    echo "  $0 --push-only v1.2.3 # Only push existing image"
}

main() {
    # Parse command line arguments
    BUILD_ONLY=false
    PUSH_ONLY=false
    FORCE_REBUILD=false
    QUIET=false
    NO_LATEST=false
    DRY_RUN=false
    CUSTOM_TAG=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -b|--build-only)
                BUILD_ONLY=true
                shift
                ;;
            -p|--push-only)
                PUSH_ONLY=true
                shift
                ;;
            -f|--force)
                FORCE_REBUILD=true
                shift
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            --no-latest)
                NO_LATEST=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                CUSTOM_TAG="$1"
                shift
                ;;
        esac
    done
    
    # Determine tag to use
    if [ -n "$CUSTOM_TAG" ]; then
        TAG="$CUSTOM_TAG"
    else
        TAG=$(get_version_tag)
        if [ "$TAG" = "" ]; then
            TAG="$DEFAULT_TAG"
        fi
    fi
    
    log_info "=== BTC Stamps Explorer Docker Build & Push ==="
    log_info "Repository: $DOCKER_REPO"
    log_info "Tag: $TAG"
    log_info "Build only: $BUILD_ONLY"
    log_info "Push only: $PUSH_ONLY"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN MODE - No actual operations will be performed"
        exit 0
    fi
    
    # Run checks
    check_requirements
    
    # Build phase
    if [ "$PUSH_ONLY" = false ]; then
        log_info "Starting build phase..."
        
        if [ "$FORCE_REBUILD" = true ]; then
            log_info "Force rebuild enabled - clearing build cache"
            # Add --no-cache flag to build command
            DOCKER_BUILDKIT=1 docker build \
                --no-cache \
                --tag "$DOCKER_REPO:$TAG" \
                --file "$DOCKERFILE" \
                --progress=plain \
                "$BUILD_CONTEXT"
        else
            build_image "$TAG"
        fi
        
        if [ $? -ne 0 ]; then
            log_error "Build failed"
            exit 1
        fi
        
        # Also tag as latest if not disabled and not a dev build
        if [ "$NO_LATEST" = false ] && [ "$TAG" != "latest" ] && [[ "$TAG" != dev-* ]] && [[ "$TAG" != git-* ]]; then
            log_info "Tagging as latest..."
            docker tag "$DOCKER_REPO:$TAG" "$DOCKER_REPO:latest"
        fi
    fi
    
    # Push phase
    if [ "$BUILD_ONLY" = false ]; then
        log_info "Starting push phase..."
        
        check_docker_login
        if [ $? -ne 0 ]; then
            exit 1
        fi
        
        push_image "$TAG"
        if [ $? -ne 0 ]; then
            log_error "Push failed"
            exit 1
        fi
        
        # Push latest tag if it was created
        if [ "$NO_LATEST" = false ] && [ "$TAG" != "latest" ] && [[ "$TAG" != dev-* ]] && [[ "$TAG" != git-* ]]; then
            push_image "latest"
        fi
    fi
    
    log_success "=== Build and push completed successfully! ==="
    log_info "Image: $DOCKER_REPO:$TAG"
    
    if [ "$BUILD_ONLY" = false ]; then
        log_info "Docker Hub: https://hub.docker.com/r/$DOCKER_REPO"
        log_info "Pull command: docker pull $DOCKER_REPO:$TAG"
    fi
}

# Run main function
main "$@"