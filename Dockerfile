FROM node:20-slim

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make gcc g++ sqlite3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild sqlite3
RUN npm install && \
    cd node_modules/sqlite3 && \
    npm run install --build-from-source && \
    cd ../..

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create volume mount point
VOLUME ["/app/data"]

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "dist/server.js"]