FROM node:20-alpine

# Install Python, pip, and curl for healthchecks
RUN apk add --no-cache python3 py3-pip curl

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-network-family-autoselection

# Copy package files
COPY package*.json ./

# Install exactly what the lockfile pins, without dev tooling
RUN npm ci --omit=dev

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy application code
COPY . .

# Run as the unprivileged user the node image ships with; it only needs to
# write its own logs
RUN mkdir -p logs && chown -R node:node logs
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
