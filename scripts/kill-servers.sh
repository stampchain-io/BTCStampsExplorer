#!/bin/bash

# Kill all Deno dev servers
echo "🔍 Looking for Deno dev servers..."

# Kill processes running dev.ts
pkill -f "deno.*dev.ts" 2>/dev/null

# Kill processes on common Deno ports
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :9229 | xargs kill -9 2>/dev/null

# Kill any remaining deno processes with --inspect flag
pkill -f "deno.*--inspect" 2>/dev/null

echo "✅ Cleaned up Deno servers"
