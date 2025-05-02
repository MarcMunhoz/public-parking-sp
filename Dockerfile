FROM node:18.20-alpine

LABEL author="Marcelo Munhoz <me@marcelomunhoz.com>" \
  version="1.0.0" \
  date_created="2022-07-12" \
  deploy="2022-07-12"

ARG APP_PATH=/app
ENV PORT=3000

COPY ["./app/package.json", "./app/yarn.lock", "./"]

RUN yarn global add next \
  && yarn \
  && yarn next telemetry disable \
  && rm -rf /var/cache/apk/* /tmp/* /var/tmp/* /usr/share/man

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR ${APP_PATH}

VOLUME ${APP_PATH}

ENTRYPOINT ["yarn", "dev"]