# BITCOIN STAMPS EXPLORER AND API

This is the official API and block explorer for
[Bitcoin Stamps](https://stampchain.io/). It provides a comprehensive interface
for exploring Bitcoin Stamps transactions and metadata, working in conjunction
with the [Bitcoin Stamps Indexer](https://github.com/stampchain-io/btc_stamps).

## Security

This is a Deno project. For security information including how npm development dependencies are handled, see [SECURITY.md](./SECURITY.md).

## Features

- Full Bitcoin Stamps block explorer
- API with OpenAPI/Swagger documentation
- Support for SRC-20, SRC-721, and SRC-101 token standards

## Prerequisites

1. **Install Deno**
   > ⚠️ **Required Version**: 2.3.3
   ```sh
   curl -fsSL https://deno.land/install.sh | sh
   ```

   Add Deno to your path:
   ```sh
   echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
   echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Required Services**
   - MySQL/MariaDB (with read-only user access)
   - Redis (for caching)
   - Bitcoin Stamps Indexer database

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/stampchain-io/bitcoin-stamps-explorer.git
   cd bitcoin-stamps-explorer
   ```

2. **Environment Setup**
   ```sh
   cp .env.sample .env
   # Edit .env with your configuration
   ```

   ⚠️ **IMPORTANT**: Ensure DB_USER has READ-ONLY permissions for security!

## Development Commands

```sh
# Start development server with hot reload and debugging
deno task dev

# Code quality checks (formatting, linting, type checking)
deno task check

# Update Fresh framework
deno task update

# Decode SRC-20 transactions
deno task decode
deno task decode_olga

# Run schema validation
deno task validate:schema
```

## Production Deployment

### 1. Local or Server Deployment

```sh
# Build the project:
deno task build

# Start production server:
deno task start
```

### 2. Docker Deployment

```sh
docker build -t btc-stamps-explorer:2.3.3 .
docker run -p 8000:8000 btc-stamps-explorer:2.3.3
```

The container uses:
- Ubuntu 22.04 base image
- Deno 2.3.3
- Production environment
- Port 8000
- Required permissions for network, file system, and environment variables

### 3. AWS Deployment

The project includes an AWS deployment pipeline using:
- Amazon ECR (Elastic Container Registry)
- Amazon ECS (Elastic Container Service)
- AWS CodeBuild

#### AWS Deployment Options:

1. **Local Build & Deploy**:
   ```sh
   # Build locally and deploy to AWS
   ./scripts/aws-deploy.sh --build --deploy
   ```

2. **Cloud Build & Deploy**:
   ```sh
   # Trigger AWS CodeBuild to build and deploy
   ./scripts/aws-deploy.sh --codebuild --deploy
   ```

3. **Fix Network Configuration**:
   ```sh
   # Update ECS service networking
   ./scripts/aws-deploy.sh --fix-networking
   ```

4. **Diagnose AWS Issues**:
   ```sh
   # Run diagnostics on AWS setup
   ./scripts/aws-deploy.sh --diagnose
   ```

#### AWS Deployment Architecture:

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   Local   │     │    AWS    │     │    ECR    │     │    ECS    │
│  Machine  │────▶│ CodeBuild │────▶│ Container │────▶│  Service  │
└───────────┘     └───────────┘     │ Registry  │     └───────────┘
                                    └───────────┘
```

Required AWS Resources:
- ECR Repository: `btc-stamps-explorer`
- CodeBuild Project: `stamps-app-build`
- ECS Cluster: `stamps-app-prod`
- ECS Service: `stamps-app-service`

For development with Docker:

```sh
# Build with development tag
docker build -t btc-stamps-explorer:dev .

# Run with mounted volumes for development
docker run -p 8000:8000 \
    --env-file .env \
    -v $(pwd):/app \
    btc-stamps-explorer:dev deno task dev
```

## API Documentation

- OpenAPI/Swagger documentation available at `/docs`
- Schema validation with `deno task validate:schema`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Run `deno task check` to ensure code quality
4. Add tests for new features
5. Submit a pull request

## Additional Resources

- [Bitcoin Stamps Indexer](https://github.com/stampchain-io/btc_stamps)
- [API Documentation](https://stampchain.io/docs)
- [Discussion Board](https://github.com/orgs/stampchain-io/discussions)

## License

This project is licensed under the [AGPL-3.0 License](LICENSE.md).
