#!/bin/bash

# Kill Deno debugger and development server processes
echo "Stopping Deno debugger and development server..."
pkill -f 'deno.*--inspect' || true
lsof -ti:9229,8000 | xargs kill -9 2>/dev/null || true
sleep 1

# Optional: Verify ports are free
if lsof -i:9229,8000 >/dev/null; then
    echo "Warning: Ports 9229 or 8000 still in use"
else
    echo "✓ Development server stopped"
fi

sed -i 's/^#*DB_HOST/#DB_HOST/' .env

# Get the environment argument
ENV=${1:-test}

# Use the environment argument in the copilot command
copilot svc deploy -n front-end -e $ENV