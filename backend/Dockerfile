FROM node:20-alpine

WORKDIR /app

ENV NODE_OPTIONS=--no-network-family-autoselection

COPY package*.json ./

RUN npm install --verbose

#RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
