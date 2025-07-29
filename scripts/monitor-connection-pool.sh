#!/bin/bash

# Monitor connection pool status
# Usage: ./scripts/monitor-connection-pool.sh

echo "Monitoring database connection pool status..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    # Get connection pool status
    STATUS=$(curl -s https://stampchain.io/api/internal/reset-connection-pool)
    
    if [ $? -eq 0 ]; then
        # Parse JSON response
        ACTIVE=$(echo $STATUS | jq -r '.data.stats.activeConnections // "N/A"')
        POOL=$(echo $STATUS | jq -r '.data.stats.poolSize // "N/A"')
        MAX=$(echo $STATUS | jq -r '.data.stats.maxPoolSize // "N/A"')
        TOTAL=$(echo $STATUS | jq -r '.data.stats.totalConnections // "N/A"')
        UTILIZATION=$(echo $STATUS | jq -r '.data.poolUtilization // "N/A"')
        HEALTHY=$(echo $STATUS | jq -r '.data.health.healthy // "N/A"')
        
        # Clear line and print status
        printf "\r[$(date '+%H:%M:%S')] Active: $ACTIVE | Pool: $POOL | Max: $MAX | Total: $TOTAL | Utilization: $UTILIZATION | Healthy: $HEALTHY"
        
        # Alert if critical
        if [ "$HEALTHY" = "false" ]; then
            echo ""
            echo "⚠️  CRITICAL: Connection pool is unhealthy!"
        fi
    else
        printf "\r[$(date '+%H:%M:%S')] Failed to fetch connection pool status"
    fi
    
    sleep 5
done