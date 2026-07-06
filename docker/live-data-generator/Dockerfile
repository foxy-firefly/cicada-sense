# syntax=docker/dockerfile:1.7

FROM node:26-alpine AS base
ENV NPM_CONFIG_AUDIT=false \
    BIOME_CONFIG_PATH=/usr/src/biome.json \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /usr/src/app
COPY --link --chmod=755 docker/node-dev-entrypoint.sh /usr/local/bin/node-dev-entrypoint

# hadolint ignore=DL3018
RUN apk add --no-cache bash dumb-init \
    && chown -R 1000:1000 /usr/src/app /usr/src
USER 1000:1000

FROM base AS tools
ENV NODE_ENV=development
COPY --link --chown=1000:1000 application/live-data-generator/package*.json ./
RUN --mount=type=cache,id=cicada-live-data-generator-npm,target=/home/node/.npm,uid=1000,gid=1000,sharing=locked \
    npm ci
COPY --link --chown=1000:1000 application/tsconfig.base.json application/biome.json /usr/src/

FROM tools AS ci
COPY --link --chown=1000:1000 application/live-data-generator ./
CMD ["tail", "-f", "/dev/null"]

FROM tools AS dev
ENV NODE_ENV=development
EXPOSE 3100 5174
CMD ["tail", "-f", "/dev/null"]

FROM ci AS build
RUN npm run build

FROM base AS prod
ENV NODE_ENV=production
COPY --link --chown=1000:1000 application/live-data-generator/package*.json ./
RUN --mount=type=cache,id=cicada-live-data-generator-npm-prod,target=/home/node/.npm,uid=1000,gid=1000,sharing=locked \
    npm ci --omit=dev \
    && npm cache clean --force
COPY --link --from=build --chown=1000:1000 /usr/src/app/dist ./dist
COPY --link --from=build --chown=1000:1000 /usr/src/app/dist-types ./dist-types
COPY --link --chown=1000:1000 docker/live-data-generator/static-server.mjs ./static-server.mjs
EXPOSE 3100 5174
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "const http=require('node:http');const request=http.get('http://127.0.0.1:3100/api/health/live',(response)=>process.exit(response.statusCode===200?0:1));request.on('error',()=>process.exit(1));"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist-types/backend/main.js"]
