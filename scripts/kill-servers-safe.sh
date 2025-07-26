#!/bin/bash

# Kill all Deno dev servers BUT preserve LSP
echo "🔍 Looking for Deno dev servers (preserving LSP)..."

# Get the PID of the Deno LSP to preserve it
LSP_PID=$(ps aux | grep "[d]eno lsp" | awk '{print $2}')

if [ ! -z "$LSP_PID" ]; then
    echo "💡 Found Deno LSP (PID: $LSP_PID) - will preserve it"
fi

# Kill processes running dev.ts
pkill -f "deno.*dev.ts" 2>/dev/null

# Kill processes on common Deno ports
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :9229 | xargs kill -9 2>/dev/null

# Kill any remaining deno processes with --inspect flag
# But exclude the LSP process
if [ ! -z "$LSP_PID" ]; then
    ps aux | grep "[d]eno.*--inspect" | grep -v "$LSP_PID" | awk '{print $2}' | xargs kill -9 2>/dev/null
else
    pkill -f "deno.*--inspect" 2>/dev/null
fi

# Show status
if [ ! -z "$LSP_PID" ] && ps -p $LSP_PID > /dev/null 2>&1; then
    echo "✅ Cleaned up Deno servers (LSP still running)"
else
    echo "✅ Cleaned up Deno servers"
fi

# List remaining Deno processes
echo ""
echo "📋 Remaining Deno processes:"
ps aux | grep "[d]eno" | grep -v grep || echo "   None"
