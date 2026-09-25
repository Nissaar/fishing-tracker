FROM node:20-alpine as build

WORKDIR /app

ENV NODE_OPTIONS=--no-network-family-autoselection

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.inc /etc/nginx/conf.d/security-headers.inc

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
