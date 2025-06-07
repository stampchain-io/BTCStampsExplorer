# Docker Swarm Deployment Guide

This guide covers deploying the BTC Stamps Explorer using Docker Swarm with Portainer, including Redis and Traefik integration.

## Prerequisites

- Docker Swarm cluster initialized
- Traefik running in the cluster with `traefik-public` network
- Portainer deployed for stack management
- MySQL database accessible from the swarm
- Domain name configured to point to your swarm

## Deployment Files

### Stack Files

1. **`docker-swarm-stack.yml`** - Standard deployment configuration
2. **`docker-swarm-prod.yml`** - Production-optimized configuration with enhanced monitoring and security
3. **`.env.template`** - Environment variables template
4. **`redis.conf`** - Redis configuration file

## Deployment Steps

### 1. Prepare the Environment

1. **Create Redis Config in Docker Swarm:**
   ```bash
   docker config create redis-config redis.conf
   ```

2. **Prepare Environment Variables:**
   - Copy `.env.template` to configure your environment variables
   - Set all required values according to your infrastructure

### 2. Deploy via Portainer

1. **Access Portainer UI**
2. **Navigate to Stacks**
3. **Create New Stack**
4. **Choose deployment method:**
   - Upload `docker-swarm-stack.yml` (standard) or
   - Upload `docker-swarm-prod.yml` (production)

### 3. Configure Environment Variables in Portainer

Set the following environment variables in Portainer's stack configuration:

#### Essential Variables

```bash
# Domain & Image
DOMAIN=your-domain.com
DOCKER_IMAGE=n4kashu/btcstamps-explorer:latest

# Database
DB_HOST=your-mysql-host
DB_USER=stamps_user
DB_PASSWORD=your-secure-password
DB_NAME=stamps

# Redis
REDIS_PASSWORD=your-redis-password

# Blockchain
QUICKNODE_ENDPOINT=https://your-quicknode-endpoint
QUICKNODE_AUTH_TOKEN=your-quicknode-token

# Security
JWT_SECRET=your-jwt-secret-32-chars-minimum
CSRF_SECRET=your-csrf-secret-32-chars-minimum
SESSION_SECRET=your-session-secret-32-chars-minimum

# API
API_BASE_URL=https://your-domain.com/api
CORS_ORIGINS=https://your-domain.com
```

#### Performance Variables (Production)

```bash
# Scaling
REPLICAS=3

# Rate Limiting
RATE_LIMIT_AVERAGE=100
RATE_LIMIT_BURST=200

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ENABLE_METRICS=true
```

### 4. Network Configuration

Ensure these networks exist:

1. **`traefik-public`** - External network for Traefik
2. **`btcstamps-network`** - Internal overlay network (created automatically)

### 5. Deploy the Stack

1. **Name your stack** (e.g., `btcstamps-explorer`)
2. **Paste or upload the stack file**
3. **Configure environment variables**
4. **Deploy the stack**

## Stack Components

### Services

1. **`btcstamps-explorer`**
   - Main application service
   - Configured for high availability
   - Integrated with Traefik for HTTPS termination
   - Health checks enabled

2. **`redis`**
   - Caching layer
   - Persistent storage
   - Password protected
   - Memory optimized

3. **`redis-exporter`** (Production only)
   - Redis monitoring
   - Prometheus metrics

### Networks

- **`btcstamps-network`** - Internal overlay network for service communication
- **`traefik-public`** - External network for Traefik integration

### Volumes

- **`redis-data`** - Persistent Redis data storage

## Traefik Integration

The stack includes comprehensive Traefik configuration:

### Automatic Features

- **HTTPS Termination** with Let's Encrypt certificates
- **HTTP to HTTPS Redirect**
- **Load Balancing** across multiple replicas
- **Health Checks** for automatic failover
- **Security Headers** for enhanced security
- **Rate Limiting** to prevent abuse
- **Compression** for better performance

### Custom Domain Configuration

Update these labels in the stack file for your domain:

```yaml
- traefik.http.routers.btcstamps-https.rule=Host(`your-domain.com`)
```

## Monitoring & Health Checks

### Application Health

- **Health Check Endpoint:** `/api/v2/health`
- **Check Interval:** 30 seconds
- **Startup Grace Period:** 60-90 seconds

### Redis Health

- **Redis Ping Check**
- **Connection Validation**
- **Memory Usage Monitoring**

### Metrics (Production)

- **Application Metrics:** Port 9090 (`/metrics`)
- **Redis Metrics:** Port 9121 (`/metrics`)
- **Prometheus Compatible**

## Scaling & Updates

### Horizontal Scaling

Update the `REPLICAS` environment variable and redeploy:

```bash
REPLICAS=5
```

### Rolling Updates

The stack is configured for zero-downtime updates:

- **Update Strategy:** `start-first`
- **Parallelism:** 1 instance at a time
- **Delay:** 30-60 seconds between updates
- **Automatic Rollback** on failure

### Blue-Green Deployments

Change the `DOCKER_IMAGE` variable to deploy new versions:

```bash
DOCKER_IMAGE=n4kashu/btcstamps-explorer:v2.0.0
```

## Security Considerations

### Network Security

- Services communicate over encrypted overlay networks
- Redis is not exposed externally
- Application only accessible via Traefik

### Application Security

- HTTPS enforced
- Security headers configured
- Rate limiting enabled
- Secrets managed via environment variables

### Data Security

- Redis password protected
- Database credentials in environment variables
- JWT/CSRF secrets for session security

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check environment variables
   - Verify database connectivity
   - Check resource constraints

2. **Domain Not Accessible**
   - Verify DNS configuration
   - Check Traefik labels
   - Confirm `traefik-public` network

3. **Redis Connection Issues**
   - Verify Redis service is running
   - Check Redis password
   - Confirm network connectivity

### Logging

View service logs via Portainer or Docker CLI:

```bash
docker service logs btcstamps-explorer_btcstamps-explorer
docker service logs btcstamps-explorer_redis
```

### Service Status

Check service status:

```bash
docker service ls
docker service ps btcstamps-explorer_btcstamps-explorer
```

## Backup & Recovery

### Redis Backup

Redis data is persisted in the `redis-data` volume. Regular backups recommended:

```bash
docker run --rm -v btcstamps-explorer_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data
```

### Application Data

Ensure your MySQL database has regular backups configured.

## Performance Tuning

### Resource Allocation

Adjust resource limits based on your workload:

```yaml
resources:
  limits:
    memory: 4G
    cpus: '2.0'
  reservations:
    memory: 2G
    cpus: '1.0'
```

### Redis Memory

Adjust Redis memory limits in the configuration:

```bash
maxmemory 512mb
```

### Caching Strategy

Configure cache TTL based on your data update frequency:

```bash
CACHE_TTL=7200  # 2 hours
```

## Support

For deployment issues:

1. Check the application logs
2. Verify environment variables
3. Test database connectivity
4. Review Traefik configuration
5. Consult the main project documentation