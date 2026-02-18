#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Memory & System Monitoring Script
 *
 * This script provides comprehensive monitoring of stampchain.io's
 * memory usage, object pools, ECS status, and business metrics.
 *
 * Usage:
 *   deno run --allow-net --allow-env scripts/monitorMemory.ts
 *   deno run --allow-net --allow-env scripts/monitorMemory.ts --url=https://stampchain.io
 *   deno run --allow-net --allow-env scripts/monitorMemory.ts --action=memory
 *   deno run --allow-net --allow-env scripts/monitorMemory.ts --format=json
 */

interface MemoryData {
  timestamp: string;
  memory: {
    current: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    formatted: {
      rss: string;
      heapUsed: string;
      heapTotal: string;
      external: string;
    };
    peak: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    limits: {
      heapLimit: number;
      warningThreshold: number;
      criticalThreshold: number;
      maxAllowedRSS: number;
    };
    health: {
      pressure: string;
      leakDetected: boolean;
      uptimeSeconds: number;
    };
  };
  objectPools: Record<string, any>;
}

interface PoolData {
  timestamp: string;
  pools: Record<string, {
    size: number;
    inUse: number;
    available: number;
    totalCreated: number;
    totalReturned: number;
    hitRate: number;
    efficiency: string;
  }>;
  summary: {
    totalPools: number;
    totalMemoryEstimate: string;
    averageHitRate: number;
  };
}

interface ECSData {
  isECS: boolean;
  taskArn?: string;
  cluster?: string;
  serviceName?: string;
  region?: string;
  containerInfo?: {
    name: string;
    image: string;
    cpu: string;
    memory: string;
  };
}

interface BusinessData {
  timestamp: string;
  businessMetrics: {
    btcPriceFetchSuccessRate: number;
    btcPriceFetchLatency: number;
    src20ProcessingThroughput: number;
    apiResponseTime: number;
    errorRate: number;
    circuitBreakerState: string;
  };
  correlationId: string;
}

interface HealthData {
  status: string;
  timestamp: number;
  uptime: number;
  version: string;
  environment: string;
  services: Record<string, string>;
}

// Configuration
const config = {
  baseUrl: Deno.args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'https://stampchain.io',
  action: Deno.args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'all',
  format: Deno.args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'table',
  timeout: 10000, // 10 seconds
  verbose: Deno.args.includes('--verbose') || Deno.args.includes('-v'),
  help: Deno.args.includes('--help') || Deno.args.includes('-h')
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHelp() {
  console.log(`
${colorize('stampchain.io Memory & System Monitoring', 'bold')}

${colorize('Usage:', 'cyan')}
  deno run --allow-net --allow-env scripts/monitorMemory.ts [options]

${colorize('Options:', 'cyan')}
  --url=<url>        Base URL to monitor (default: https://stampchain.io)
  --action=<action>  Specific action to test (default: all)
                     Options: memory, pools, ecs, cloudwatch, business, health, all
  --format=<format>  Output format (default: table)
                     Options: table, json, compact
  --verbose, -v      Verbose output with additional details
  --help, -h         Show this help message

${colorize('Examples:', 'cyan')}
  ${colorize('# Monitor all endpoints', 'dim')}
  deno run --allow-net --allow-env scripts/monitorMemory.ts

  ${colorize('# Monitor specific action', 'dim')}
  deno run --allow-net --allow-env scripts/monitorMemory.ts --action=memory

  ${colorize('# Monitor local development', 'dim')}
  deno run --allow-net --allow-env scripts/monitorMemory.ts --url=http://localhost:8000

  ${colorize('# JSON output for automation', 'dim')}
  deno run --allow-net --allow-env scripts/monitorMemory.ts --format=json
`);
}

async function fetchEndpoint(action: string): Promise<any> {
  const url = `${config.baseUrl}/api/internal/monitoring?action=${action}`;

  if (config.verbose) {
    console.log(colorize(`Fetching: ${url}`, 'dim'));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'stampchain.io-Monitor/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function formatMemoryData(data: MemoryData): void {
  console.log(colorize('\n🧠 Memory Status', 'bold'));
  console.log('─'.repeat(50));

  const memoryMB = data.memory.current.rss / 1024 / 1024;
  const limitMB = data.memory.limits.maxAllowedRSS / 1024 / 1024;
  const usagePercent = (data.memory.current.rss / data.memory.limits.maxAllowedRSS) * 100;

  // Status color based on usage
  const statusColor = usagePercent > 85 ? 'red' : usagePercent > 70 ? 'yellow' : 'green';
  const pressureColor = data.memory.health.pressure === 'high' ? 'red' : data.memory.health.pressure === 'medium' ? 'yellow' : 'green';

  const status = data.memory.health.leakDetected ? 'LEAK DETECTED' :
                 data.memory.health.pressure === 'high' ? 'HIGH PRESSURE' :
                 data.memory.health.pressure === 'medium' ? 'MEDIUM PRESSURE' : 'HEALTHY';

  console.log(`Status: ${colorize(status, statusColor)}`);
  console.log(`Memory Usage: ${colorize(`${memoryMB.toFixed(2)} MB`, 'cyan')} / ${colorize(`${limitMB.toFixed(2)} MB`, 'dim')} (${colorize(`${usagePercent.toFixed(1)}%`, statusColor)})`);
  console.log(`Pressure: ${colorize(data.memory.health.pressure.toUpperCase(), pressureColor)}`);
  console.log(`Available: ${colorize(`${(limitMB - memoryMB).toFixed(2)} MB`, 'green')}`);
  console.log(`Uptime: ${colorize(`${Math.floor(data.memory.health.uptimeSeconds / 60)} min`, 'cyan')}`);

  if (config.verbose) {
    console.log(`\n${colorize('Memory Breakdown:', 'dim')}`);
    console.log(`  RSS: ${data.memory.formatted.rss} (${(data.memory.current.rss / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  Heap Used: ${data.memory.formatted.heapUsed} (${(data.memory.current.heapUsed / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  Heap Total: ${data.memory.formatted.heapTotal} (${(data.memory.current.heapTotal / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  External: ${data.memory.formatted.external} (${(data.memory.current.external / 1024 / 1024).toFixed(2)} MB)`);

    console.log(`\n${colorize('Peak Usage:', 'dim')}`);
    console.log(`  RSS Peak: ${(data.memory.peak.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Peak: ${(data.memory.peak.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    console.log(`\n${colorize('Limits:', 'dim')}`);
    console.log(`  Heap Limit: ${(data.memory.limits.heapLimit / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Warning Threshold: ${(data.memory.limits.warningThreshold / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Critical Threshold: ${(data.memory.limits.criticalThreshold / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Max RSS: ${(data.memory.limits.maxAllowedRSS / 1024 / 1024).toFixed(2)} MB`);
  }

  if (data.memory.health.leakDetected) {
    console.log(`\n${colorize('⚠️  MEMORY LEAK DETECTED', 'red')}`);
    console.log(`${colorize('  • Immediate investigation recommended', 'red')}`);
    console.log(`${colorize('  • Check for unclosed resources', 'red')}`);
  }
}

function formatPoolData(data: PoolData): void {
  console.log(colorize('\n🏊 Object Pool Performance', 'bold'));
  console.log('─'.repeat(50));

  console.log(`Total Pools: ${colorize(data.summary.totalPools.toString(), 'cyan')}`);
  console.log(`Memory Estimate: ${colorize(data.summary.totalMemoryEstimate, 'cyan')}`);
  console.log(`Average Hit Rate: ${colorize(`${(data.summary.averageHitRate * 100).toFixed(1)}%`, 'green')}`);

  if (data.summary.totalPools === 0) {
    console.log(`${colorize('No object pools currently active', 'yellow')}`);
    return;
  }

  if (config.verbose) {
    console.log(`\n${colorize('Pool Details:', 'dim')}`);
    Object.entries(data.pools).forEach(([name, pool]) => {
      const hitRatePercent = (pool.hitRate * 100).toFixed(1);
      const efficiencyColor = pool.efficiency === 'high' ? 'green' : pool.efficiency === 'moderate' ? 'yellow' : 'red';

      console.log(`  ${colorize(name, 'white')}:`);
      console.log(`    Size: ${pool.size}, Available: ${pool.available}, In Use: ${pool.inUse}`);
      console.log(`    Hit Rate: ${colorize(`${hitRatePercent}%`, 'green')}, Efficiency: ${colorize(pool.efficiency, efficiencyColor)}`);
      console.log(`    Created: ${pool.totalCreated}, Returned: ${pool.totalReturned}`);
    });
  }
}

function formatECSData(data: ECSData): void {
  console.log(colorize('\n🏗️  ECS Environment', 'bold'));
  console.log('─'.repeat(50));

  console.log(`ECS Environment: ${colorize(data.isECS ? 'YES' : 'NO', data.isECS ? 'green' : 'yellow')}`);

  if (data.isECS && config.verbose) {
    console.log(`Service: ${colorize(data.serviceName || 'Unknown', 'cyan')}`);
    console.log(`Cluster: ${colorize(data.cluster || 'Unknown', 'cyan')}`);
    console.log(`Region: ${colorize(data.region || 'Unknown', 'cyan')}`);

    if (data.containerInfo) {
      console.log(`\n${colorize('Container Info:', 'dim')}`);
      console.log(`  Name: ${data.containerInfo.name}`);
      console.log(`  CPU: ${data.containerInfo.cpu}`);
      console.log(`  Memory: ${data.containerInfo.memory}`);
    }
  }
}

function formatBusinessData(data: BusinessData): void {
  console.log(colorize('\n📊 Business Metrics', 'bold'));
  console.log('─'.repeat(50));

  const successRate = (data.businessMetrics.btcPriceFetchSuccessRate * 100).toFixed(1);
  const errorRate = (data.businessMetrics.errorRate * 100).toFixed(1);
  const successColor = data.businessMetrics.btcPriceFetchSuccessRate > 0.95 ? 'green' : data.businessMetrics.btcPriceFetchSuccessRate > 0.9 ? 'yellow' : 'red';
  const circuitColor = data.businessMetrics.circuitBreakerState === 'CLOSED' ? 'green' : 'red';

  console.log(`BTC Price Success Rate: ${colorize(`${successRate}%`, successColor)}`);
  console.log(`Error Rate: ${colorize(`${errorRate}%`, 'red')}`);
  console.log(`Avg Latency: ${colorize(`${data.businessMetrics.btcPriceFetchLatency.toFixed(1)}ms`, 'cyan')}`);
  console.log(`Circuit Breaker: ${colorize(data.businessMetrics.circuitBreakerState, circuitColor)}`);

  if (config.verbose) {
    console.log(`\n${colorize('Performance:', 'dim')}`);
    console.log(`  API Response Time: ${data.businessMetrics.apiResponseTime.toFixed(1)}ms`);
    console.log(`  SRC20 Throughput: ${data.businessMetrics.src20ProcessingThroughput.toFixed(1)} req/s`);
    console.log(`  BTC Price Latency: ${data.businessMetrics.btcPriceFetchLatency.toFixed(1)}ms`);
    console.log(`  Correlation ID: ${data.correlationId}`);
  }
}

function formatHealthData(data: HealthData): void {
  console.log(colorize('\n❤️  System Health', 'bold'));
  console.log('─'.repeat(50));

  const statusColor = data.status === 'healthy' ? 'green' : 'red';
  const uptime = Math.floor(data.uptime / 1000); // Convert to seconds
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);

  console.log(`Status: ${colorize(data.status.toUpperCase(), statusColor)}`);
  console.log(`Uptime: ${colorize(`${uptimeHours}h ${uptimeMinutes}m`, 'cyan')}`);
  console.log(`Environment: ${colorize(data.environment, 'cyan')}`);
  console.log(`Version: ${colorize(data.version, 'cyan')}`);

  if (config.verbose && data.services) {
    console.log(`\n${colorize('Service Status:', 'dim')}`);
    Object.entries(data.services).forEach(([service, status]) => {
      const serviceColor = status === 'healthy' ? 'green' : 'red';
      console.log(`  ${service}: ${colorize(status, serviceColor)}`);
    });
  }
}

async function runMonitoring(): Promise<void> {
  console.log(colorize(`\n🔍 stampchain.io System Monitor`, 'bold'));
  console.log(colorize(`Target: ${config.baseUrl}`, 'dim'));
  console.log(colorize(`Time: ${new Date().toISOString()}`, 'dim'));

  const actions = config.action === 'all'
    ? ['memory', 'pools', 'ecs', 'business', 'health']
    : [config.action];

  for (const action of actions) {
    try {
      const data = await fetchEndpoint(action);

      if (config.format === 'json') {
        console.log(JSON.stringify({ action, data }, null, 2));
        continue;
      }

      switch (action) {
        case 'memory':
          formatMemoryData(data);
          break;
        case 'pools':
          formatPoolData(data);
          break;
        case 'ecs':
          formatECSData(data);
          break;
        case 'business':
          formatBusinessData(data);
          break;
        case 'health':
          formatHealthData(data);
          break;
        default:
          console.log(`\n${colorize(`📋 ${action.toUpperCase()} Data`, 'bold')}`);
          console.log(JSON.stringify(data, null, 2));
      }

    } catch (error) {
      console.error(colorize(`\n❌ Error fetching ${action}:`, 'red'));
      console.error(colorize(`   ${error.message}`, 'red'));

      if (config.verbose) {
        console.error(colorize(`   Stack: ${error.stack}`, 'dim'));
      }
    }
  }

  console.log(colorize('\n✅ Monitoring complete', 'green'));
}

// Main execution
if (config.help) {
  printHelp();
  Deno.exit(0);
}

try {
  await runMonitoring();
} catch (error) {
  console.error(colorize(`\n💥 Fatal error: ${error.message}`, 'red'));
  Deno.exit(1);
}
