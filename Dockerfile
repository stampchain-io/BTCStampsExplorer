# Deno base image
FROM denoland/deno:alpine-2.3.3

# Install build dependencies for native modules
RUN apk add --no-cache \
    bash \
    python3 \
    make \
    g++ \
    nodejs \
    npm

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

# Create necessary directories
RUN mkdir -p /app \
    /app/.deno \
    /app/.npm \
    /app/.config \
    /app/.cache \
    /app/.local/share \
    /app/node_modules/.deno \
    /app/build

# Set up permissions more securely
RUN chown -R deno:deno /app && \
    chmod -R 755 /app && \
    chmod -R 775 /app/.deno /app/.npm /app/node_modules/.deno /app/build

WORKDIR /app

# Copy files and set permissions
COPY --chown=deno:deno . .

# Clean any existing caches
RUN rm -rf node_modules/.deno && \
    rm -rf .npm && \
    rm -rf .deno && \
    rm -rf build

# Switch to deno user for build steps
USER deno

# Pre-install and build native dependencies
RUN npm install --prefix /tmp tiny-secp256k1@2.2.3 && \
    mkdir -p /app/build && \
    cp -r /tmp/node_modules/tiny-secp256k1/lib/secp256k1.node /app/build/ || \
    echo "Native module copy failed, will use WASM fallback"

# Build steps with all permissions granted and error handling
# Lock write is used to create lock.json if it doesn't exist
RUN deno run --allow-all main.ts build --lock-write || (echo "Build failed" && exit 1)

# Cache dependencies with proper error handling (without lock file)
RUN DENO_DIR=/app/.deno \
    NPM_CONFIG_CACHE=/app/.npm \
    deno cache --reload main.ts || (echo "Cache failed" && exit 1)

# Verify the build environment
RUN echo "Verifying environment and permissions:" && \
    ls -la /app && \
    ls -la /app/.deno || true && \
    ls -la /app/node_modules/.deno || true && \
    ls -la /app/.npm || true && \
    ls -la /app/build || true

EXPOSE 8000

# Runtime environment variables - Enable Redis at runtime
ENV DENO_PERMISSIONS="--allow-net --allow-read --allow-run --allow-write --allow-env --allow-sys" \
    SKIP_REDIS=false \
    SKIP_REDIS_CONNECTION=false \
    SKIP_REDIS_TLS=true \
    DENO_ENV=production \
    CACHE=true \
    REDIS_DEBUG=true \
    REDIS_TIMEOUT=15000 \
    REDIS_MAX_RETRIES=10 \
    TINY_SECP256K1_WASM=1

CMD ["sh", "-c", "deno run $DENO_PERMISSIONS main.ts"]