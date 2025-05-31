FROM denoland/deno:alpine-2.3.3

# Install development tools and dependencies
RUN apk add --no-cache \
    bash \
    git \
    curl \
    wget \
    unzip \
    openssh-client \
    sudo \
    procps \
    htop \
    nano \
    vim \
    jq \
    libstdc++ \
    ca-certificates \
    tzdata \
    build-base \
    python3 \
    py3-pip \
    nodejs \
    npm

# Set environment variables
ENV HOME=/app \
    DENO_DIR=/app/.deno \
    DENO_ENV=development \
    NODE_DEBUG=* \
    XDG_CONFIG_HOME=/app/.config \
    XDG_CACHE_HOME=/app/.cache \
    XDG_DATA_HOME=/app/.local/share \
    NPM_CONFIG_CACHE=/app/.npm \
    PATH=${PATH}:/app/.deno/bin \
    DENO_INSTALL=/app/.deno

# Create necessary directories with proper permissions
RUN mkdir -p \
    /app \
    /app/.deno \
    /app/.npm \
    /app/.config \
    /app/.cache \
    /app/.local/share \
    /app/node_modules/.deno \
    /app/.vscode-server

# Create deno user for development
RUN addgroup -g 1000 deno && \
    adduser -u 1000 -G deno -s /bin/bash -D deno && \
    echo "deno ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/deno && \
    chmod 0440 /etc/sudoers.d/deno

# Set up permissions for development
RUN chown -R deno:deno /app && \
    chmod -R 755 /app && \
    chmod -R 775 /app/.deno /app/.npm /app/node_modules/.deno /app/.vscode-server

WORKDIR /app

# Install global development tools
RUN npm install -g typescript ts-node

# Set up Deno development environment
RUN deno install -A -f --unstable --no-check=remote -n fresh https://deno.land/x/fresh@1.7.3/init.ts && \
    deno install -A --unstable -n deno-types https://deno.land/x/deno_types/install.ts

# Configure for hot reload and debugging
ENV DENO_PERMISSIONS="--allow-all --watch --inspect=0.0.0.0:9229" \
    SKIP_REDIS_CONNECTION=true \
    DENO_ENV=development \
    CACHE=true \
    REDIS_DEBUG=true \
    REDIS_TIMEOUT=15000 \
    REDIS_MAX_RETRIES=10 \
    FRESH_TAILWIND_RECOMPILE=true

# Switch to deno user for development
USER deno

# Verify the development environment
RUN echo "Verifying development environment:" && \
    deno --version && \
    node --version && \
    npm --version

# Expose ports for development (app, debugging)
EXPOSE 8000 9229

# Default command for development
CMD ["bash", "-c", "echo 'Development container is running. Use VS Code to connect and run tasks.' && sleep infinity"]
