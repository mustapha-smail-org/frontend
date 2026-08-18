#!/bin/sh
# Renders the nginx config and the browser-facing runtime config from the
# app-config secret file Render mounts before this container starts, then
# execs nginx. See frontend-cd/README.md for how that file gets here and the
# TEMPLATE_GUIDE.md §1b for why runtime config exists instead of baking
# VITE_* vars in at build time.
set -eu

CONFIG_FILE="/etc/secrets/app-config.json"
WEB_ROOT="/usr/share/nginx/html"
NGINX_CONF_DIR="/etc/nginx/conf.d"
TEMPLATE="/etc/nginx/templates/default.conf.template"

# Fail loudly rather than silently falling back to a build-time default — in
# production that default would be the public OpenStreetMap tile endpoint,
# which the PRD (FR-MAP-006) explicitly forbids for production traffic. A
# missing file here means the deploy didn't go through frontend-cd's
# deploy.yml (which pushes it first), not a recoverable condition.
if [ ! -f "$CONFIG_FILE" ]; then
  echo "FATAL: ${CONFIG_FILE} not found. This image must be deployed via frontend-cd's deploy.yml, which pushes it as a Render secret file before triggering the image deploy." >&2
  exit 1
fi

if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
  echo "FATAL: ${CONFIG_FILE} is not valid JSON." >&2
  exit 1
fi

API_GATEWAY_URL=$(jq -er '.API_GATEWAY_URL' "$CONFIG_FILE") || {
  echo "FATAL: ${CONFIG_FILE} is missing a non-null 'API_GATEWAY_URL' key." >&2
  exit 1
}
export API_GATEWAY_URL

: "${PORT:=8080}"
export PORT

# Explicit variable list is not optional: bare envsubst would substitute
# every ${...}-looking token in the template, including nginx's own runtime
# variables ($uri, $host, $remote_addr, ...), silently breaking the config.
envsubst '${PORT} ${API_GATEWAY_URL}' < "$TEMPLATE" > "${NGINX_CONF_DIR}/default.conf"

# Everything except API_GATEWAY_URL is browser-facing: copied verbatim into
# window.__APP_CONFIG__, which src/shared/config/env.ts reads at runtime and
# merges over the build-time import.meta.env fallbacks (runtime wins).
# API_GATEWAY_URL is server-side only (consumed above) and must never reach
# the browser bundle.
BROWSER_CONFIG=$(jq -c 'del(.API_GATEWAY_URL)' "$CONFIG_FILE")
echo "window.__APP_CONFIG__ = ${BROWSER_CONFIG};" > "${WEB_ROOT}/config.js"

exec nginx -g 'daemon off;'
