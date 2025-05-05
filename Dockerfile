FROM node:22-alpine AS develop-stage

LABEL author="Marcelo Munhoz <me@marcelomunhoz.com>" \
  version="1.0.0" \
  date_created="2025-05-05" \
  deploy="2025-05-05"

WORKDIR /app

COPY ["./app/package.json", "./app/yarn.lock", "./"]

RUN apk add exa \
  && yarn global add @quasar/cli \
  && rm -rf /var/cache/apk/* /tmp/* /var/tmp/* /usr/share/man

COPY ./app .