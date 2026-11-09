# Run the container with `docker run -it --rm --init -p 8082:8082 --env PORT=8082 localhost/app-2:0.0.1`.
FROM docker.io/node:24-alpine

ENV HOST=0.0.0.0
ENV PORT=8080
# Allow to set the service version via build arg
ARG SERVICE_VERSION
ENV SERVICE_VERSION=$SERVICE_VERSION

ARG PNPM_VERSION
# Standalone pnpm install (https://pnpm.io/installation): no corepack (dropped in Node 25) and no npm needed.
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME/bin:$PATH
RUN wget -qO- https://get.pnpm.io/install.sh | env PNPM_VERSION=${PNPM_VERSION} ENV=/root/.shrc SHELL=/bin/sh sh -

WORKDIR /app

# Copy the full dist output (package.json, pnpm-lock.yaml, pnpm-workspace.yaml
# and workspace_modules/) in one shot: workspace_modules deps are installed as
# `file:` directories, so pnpm needs them on disk before install runs.
COPY ./dist .

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

CMD [ "node", "main.js" ]
