#!/bin/bash

# Comprehensive kill script that uses all available cleanup methods
echo "🧹 Running comprehensive cleanup..."

# 1. Use process manager to kill tracked processes
echo "📊 Killing tracked processes..."
./scripts/dev-process-manager.ts kill-all 2>/dev/null || true

# 2. Kill by process name patterns
echo "🔍 Killing processes by name..."
pkill -f "deno.*dev.ts" 2>/dev/null || true
pkill -f "deno.*--inspect" 2>/dev/null || true
pkill -f "deno.*--watch" 2>/dev/null || true
pkill -f "deno task dev" 2>/dev/null || true

# 3. Kill by ports (main dev ports)
echo "🔌 Checking main ports (8000-8100)..."
for port in {8000..8100..10}; do
  if lsof -ti :$port >/dev/null 2>&1; then
    echo "  Killing process on port $port"
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
  fi
done

# 4. Kill by debug ports
echo "🐛 Checking debug ports (9229-9235)..."
for port in {9229..9235}; do
  if lsof -ti :$port >/dev/null 2>&1; then
    echo "  Killing debug process on port $port"
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
  fi
done

# 5. Clean up PID file
if [ -f ".deno-pids.json" ]; then
  echo "🗑️  Removing PID tracking file..."
  rm -f .deno-pids.json
fi

# 6. Give processes time to die
sleep 1

# 7. Force kill any remaining Deno processes (nuclear option)
echo "☢️  Final cleanup pass..."
pkill -9 -f "deno.*dev" 2>/dev/null || true

echo "✅ Comprehensive cleanup complete!"

# 8. Show port status
echo ""
echo "📊 Port status check:"
./scripts/check-ports.ts 2>/dev/null || echo "  Port checker not available"