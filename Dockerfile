# Builds and serves the frontend for self-hosting (e.g. via Coolify on
# Hetzner) as a drop-in replacement for Vercel. See DEPLOYMENT.md and
# SELF_HOSTING.md for the full migration runbook.
#
# Vite bakes VITE_* variables in at BUILD time, not runtime - they must be
# passed as build args (Coolify: "Build Variables"), not just container env
# vars, or the resulting bundle won't have them.

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_NAME
ARG VITE_APP_URL
ARG VITE_DEFAULT_LANGUAGE
ARG VITE_DEFAULT_TIMEZONE
ARG VITE_DEFAULT_CURRENCY
ARG VITE_DEFAULT_COUNTRY_CODE
ARG VITE_DEFAULT_VAT_RATE
ARG VITE_PLATFORM_CURRENCY
ARG VITE_STARTER_PLAN_NAME
ARG VITE_STARTER_PRICE
ARG VITE_STARTER_EXTRA_LOCATION_PRICE
ARG VITE_PRO_PLAN_NAME
ARG VITE_PRO_PRICE
ARG VITE_PRO_EXTRA_LOCATION_PRICE
ARG VITE_SENTRY_DSN
ARG VITE_MPGS_GATEWAY_HOST

# scripts/check-env.mjs fails this step fast if the two required vars above
# are missing or malformed - same fail-fast behavior as the Vercel build.
RUN npm run build:deploy

# ---- serve ----
FROM nginx:1.27-alpine

# CSP connect-src host for your Supabase instance (Storage/Auth/Realtime/
# PostgREST all go through this). Override at deploy time once you know it,
# e.g. supabase.example.com. Left as a wildcard Supabase Cloud host by
# default so the image still works during the staging/parallel-run phase.
ENV SUPABASE_DOMAIN=*.supabase.co
# CSP script-src/connect-src host for the MPGS/CrediMax payment gateway
# (checkout.js is loaded from here). Override at deploy time if using a
# different MPGS-based acquirer than CrediMax.
ENV MPGS_GATEWAY_HOST=credimax.gateway.mastercard.com
# Restricts nginx's built-in envsubst-on-startup to only these variables, so
# nginx's own $uri-style config variables are never accidentally substituted.
ENV NGINX_ENVSUBST_FILTER=^(SUPABASE_DOMAIN|MPGS_GATEWAY_HOST)$

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
