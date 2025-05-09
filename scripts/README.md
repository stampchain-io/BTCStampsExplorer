# Scripts

This directory contains utility scripts for the BTC Stamps Explorer project.

## Deployment Scripts

### AWS Deployment
- `aws-deploy.sh` - Standard deployment script for deploying to AWS from the committed repository
  ```bash
  ./aws-deploy.sh [--codebuild] [--deploy]
  ```

### Local Changes Deployment 
- `deploy-local-changes.sh` - Deploys local changes (including uncommitted ones) to AWS
  ```bash
  ./deploy-local-changes.sh [--skip-build]
  ```
  This script is particularly useful when you need to test changes in the AWS environment without committing them to the repository.

### Production Deployment
- `build-prod.sh` - Builds the application for production
- `deploy-prod.sh` - Deploys the built application to production
- `unified-deploy.sh` - Combined build and deploy script for production

### AWS Service Management
- `update-service.sh` - Updates the ECS service configuration
- `update-task-def.sh` - Updates the ECS task definition

## Utility Scripts

- `cleanup.ts` - Utility for cleaning up temporary files
- `local.sh` - Local development utility script
- `mpma.ts` - Multi-package manager assistant utility

## Deployment Workflow

1. Make your changes locally
2. For changes that need to be tested in AWS without committing:
   ```bash
   ./scripts/deploy-local-changes.sh
   ```
3. For standard deployments from the committed repository:
   ```bash
   ./scripts/aws-deploy.sh --codebuild --deploy
   ```

## Troubleshooting

For known issues and workarounds related to deployments, see [KNOWN_ISSUES.md](../KNOWN_ISSUES.md).

For cross-platform building concerns, see [CROSS_PLATFORM_BUILDS.md](../CROSS_PLATFORM_BUILDS.md).