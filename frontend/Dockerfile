FROM node:20-alpine as build

WORKDIR /app

ENV NODE_OPTIONS=--no-network-family-autoselection

COPY package*.json ./

RUN npm ci

COPY . .

# CRA bakes REACT_APP_* in at build time. A build arg passed by compose is
# used when given; otherwise the value comes from frontend/.env as before
# (an empty variable would override .env, hence the unset)
ARG REACT_APP_API_URL
RUN if [ -z "$REACT_APP_API_URL" ]; then unset REACT_APP_API_URL; fi && npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.inc /etc/nginx/conf.d/security-headers.inc

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
