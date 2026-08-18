/* eslint-disable */
// Dev/test/build-time stub. Overwritten by the container entrypoint at deploy
// time with the real per-environment values — see docker/entrypoint.sh and
// frontend-cd/README.md. Left empty here so window.__APP_CONFIG__ is always
// defined and src/shared/config/env.ts falls back to import.meta.env.
window.__APP_CONFIG__ = {}
