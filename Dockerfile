FROM denoland/deno:alpine-2.2.3

# Set environment variables
ENV HOME=/app \
    DENO_DIR=/app/.deno \
    DENO_ENV=production \
    NODE_DEBUG=* \
    XDG_CONFIG_HOME=/app/.config \
    XDG_CACHE_HOME=/app/.cache \
    XDG_DATA_HOME=/app/.local/share \
    NPM_CONFIG_CACHE=/app/.npm \
    REDIS_LOG_LEVEL=DEBUG

# Install additional tools
RUN apk add --no-cache bash

# Create necessary directories
RUN mkdir -p /app \
    /app/.deno \
    /app/.npm \
    /app/.config \
    /app/.cache \
    /app/.local/share \
    /app/node_modules/.deno

# Set up permissions more securely
RUN chown -R deno:deno /app && \
    chmod -R 755 /app && \
    chmod -R 775 /app/.deno /app/.npm /app/node_modules/.deno

WORKDIR /app

# Copy files and set permissions
COPY --chown=deno:deno . .

# Clean any existing caches
RUN rm -rf node_modules/.deno && \
    rm -rf .npm && \
    rm -rf .deno

# Switch to deno user for build steps
USER deno

# Build steps with all permissions granted and error handling
RUN deno run --allow-all main.ts build --lock=lock.json --lock-write || (echo "Build failed" && exit 1)

# Cache dependencies with proper error handling
RUN DENO_DIR=/app/.deno \
    NPM_CONFIG_CACHE=/app/.npm \
    deno cache --reload --lock=lock.json main.ts || (echo "Cache failed" && exit 1)

# Verify the build environment
RUN echo "Verifying environment and permissions:" && \
    ls -la /app && \
    ls -la /app/.deno || true && \
    ls -la /app/node_modules/.deno || true && \
    ls -la /app/.npm || true

EXPOSE 8000

# Add all necessary permissions to the runtime command
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-run", "--allow-write", "--allow-env", "--allow-sys", "main.ts"]
