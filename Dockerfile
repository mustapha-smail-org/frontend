# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="frontend" \
      org.opencontainers.image.description="CityPulse frontend SPA"

# jq: used by docker/entrypoint.sh to split the mounted app-config.json into
# the server-side API_GATEWAY_URL and the browser-facing config.js payload.
RUN apk add --no-cache jq

COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
