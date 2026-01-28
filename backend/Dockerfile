FROM node:20-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

ENV NODE_OPTIONS=--no-network-family-autoselection

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --verbose

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy application code
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
