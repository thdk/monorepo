# Run the container with `docker run -it --rm --init -p 8082:8082 --env PORT=8082 localhost/app-2:0.0.1`.
FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=8080
# Allow to set the service version via build arg
ARG SERVICE_VERSION
ENV SERVICE_VERSION=$SERVICE_VERSION

ARG PNPM_VERSION
RUN corepack prepare pnpm@${PNPM_VERSION} --activate

RUN corepack enable pnpm

WORKDIR /app

# Copy the full dist output (package.json, pnpm-lock.yaml, pnpm-workspace.yaml
# and workspace_modules/) in one shot: workspace_modules deps are installed as
# `file:` directories, so pnpm needs them on disk before install runs.
COPY ./dist .

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

CMD [ "node", "main.js" ]
