FROM node:18.0.0

ARG NODE_ENV

ENV NODE_ENV=$NODE_ENV

RUN apt-get update -y
RUN apt-get install -y python python3 make g++ gcc build-essential

RUN npm install pm2 -g
RUN npm install bcrypt@5.0.0

WORKDIR /app
RUN chmod +x /app
COPY package*.json /app/

COPY . /app/

RUN npm install

EXPOSE $PORT

CMD ["echo", "Start service..."]
CMD ["pm2-runtime", "ecosystem.config.js"]
