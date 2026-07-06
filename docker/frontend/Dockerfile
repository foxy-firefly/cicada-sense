# syntax=docker/dockerfile:1.7

FROM node:26-alpine AS base
ENV NPM_CONFIG_AUDIT=false \
    BIOME_CONFIG_PATH=/usr/src/biome.json \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /usr/src/app
COPY --link --chmod=755 docker/node-dev-entrypoint.sh /usr/local/bin/node-dev-entrypoint

# hadolint ignore=DL3018
RUN apk add --no-cache bash \
    && chown -R 1000:1000 /usr/src/app /usr/src
USER 1000:1000

FROM base AS tools
ENV NODE_ENV=development
COPY --link --chown=1000:1000 application/monitoring-workspace/frontend/package*.json ./
RUN --mount=type=cache,id=cicada-frontend-npm,target=/home/node/.npm,uid=1000,gid=1000,sharing=locked \
    npm ci
COPY --link --chown=1000:1000 application/tsconfig.base.json /usr/tsconfig.base.json
COPY --link --chown=1000:1000 application/biome.json /usr/src/biome.json

FROM tools AS ci
COPY --link --chown=1000:1000 application/monitoring-workspace/frontend ./
CMD ["tail", "-f", "/dev/null"]

FROM tools AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["tail", "-f", "/dev/null"]

FROM ci AS build
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31.2-alpine AS prod
COPY --link docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --link --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:5173/health || exit 1
