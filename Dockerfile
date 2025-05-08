# syntax=docker/dockerfile:1.14.0

# Copyright (C) 2023 - present, Juergen Zimmermann, Hochschule Karlsruhe
# Lizenz: GPL-3.0-or-later

ARG NODE_VERSION=23.11.0

# ---------------------------------------------------------------------------------------
# S t a g e   d i s t
# ---------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS dist

RUN bash <<EOF
set -eux
apt-get update --no-show-upgraded
apt-get upgrade --yes --no-show-upgraded
apt-get install --no-install-recommends --yes \
    python3.11-minimal=3.11.2-6+deb12u5 \
    python3.11-dev=3.11.2-6+deb12u5 \
    build-essential=12.9
ln -s /usr/bin/python3.11 /usr/bin/python3
ln -s /usr/bin/python3.11 /usr/bin/python
npm i -g --no-audit --no-fund npm
EOF

USER node
WORKDIR /home/node

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  --mount=type=bind,source=nest-cli.json,target=nest-cli.json \
  --mount=type=bind,source=tsconfig.json,target=tsconfig.json \
  --mount=type=bind,source=tsconfig.build.json,target=tsconfig.build.json \
  --mount=type=bind,source=src,target=src \
  --mount=type=cache,target=/root/.npm bash <<EOF
set -eux
npm ci --no-audit --no-fund
npm run build
EOF

# ---------------------------------------------------------------------------------------
# S t a g e   d e p e n d e n c i e s
# ---------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS dependencies

RUN bash <<EOF
set -eux
apt-get update
apt-get upgrade --yes
apt-get install --no-install-recommends --yes \
    python3.11-minimal=3.11.2-6+deb12u5 \
    python3.11-dev=3.11.2-6+deb12u5 \
    build-essential=12.9
ln -s /usr/bin/python3.11 /usr/bin/python3
ln -s /usr/bin/python3.11 /usr/bin/python
npm i -g --no-audit --no-fund npm
EOF

USER node
WORKDIR /home/node

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  --mount=type=cache,target=/root/.npm bash <<EOF
set -eux
npm ci --no-audit --no-fund --omit=dev --omit=peer
EOF

# ---------------------------------------------------------------------------------------
# S t a g e   f i n a l
# ---------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS final

LABEL org.opencontainers.image.title="auto" \
  org.opencontainers.image.description="Appserver auto mit Basis-Image Debian Bookworm" \
  org.opencontainers.image.version="2025.4.1-bookworm" \
  org.opencontainers.image.licenses="GPL-3.0-or-later" \
  org.opencontainers.image.authors="Juergen.Zimmermann@h-ka.de"

RUN bash <<EOF
set -eux
apt-get update
apt-get upgrade --yes
apt-get install --no-install-recommends --yes dumb-init=1.2.5-2
apt-get autoremove --yes
apt-get clean --yes
rm -rf /var/lib/apt/lists/*
rm -rf /tmp/*
EOF

WORKDIR /opt/app
USER node

COPY --chown=node:node package.json ./
COPY --from=dependencies --chown=node:node /home/node/node_modules ./node_modules
COPY --from=dist --chown=node:node /home/node/dist ./dist
COPY --chown=node:node src/config/resources ./dist/config/resources

EXPOSE 3000

ENTRYPOINT ["dumb-init", "/usr/local/bin/node", "dist/main.js"]
