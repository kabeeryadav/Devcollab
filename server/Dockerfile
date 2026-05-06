FROM node:20-bullseye-slim

# Install all language compilers and runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    default-jdk \
    python3 \
    python3-pip \
    golang-go \
    php-cli \
    ruby \
    mono-mcs \
    mono-runtime \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript and ts-node globally via npm
RUN npm install -g typescript ts-node @types/node

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy server source code
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
