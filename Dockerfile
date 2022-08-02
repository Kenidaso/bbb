FROM node:18.6.0-alpine

ARG NODE_ENV

ENV NODE_ENV=$NODE_ENV

RUN npm install pm2 -g

WORKDIR /app
RUN chmod +x /app
COPY package*.json /app/

COPY . /app/

RUN npm install --global yarn
RUN yarn install

EXPOSE $PORT

CMD ["echo", "Start service..."]
CMD ["pm2-runtime", "ecosystem.config.js"]
