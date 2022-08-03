FROM node:16.16-slim

ARG NODE_ENV

ENV NODE_ENV=$NODE_ENV

RUN apt-get update -y
RUN apt-get install -y python python3 make g++ gcc build-essential htop

RUN npm install pm2 -g

WORKDIR /app
RUN chmod +x /app
COPY package*.json /app/

COPY . /app/

RUN npm install

EXPOSE $PORT

CMD ["echo", "Start service..."]
CMD ["npm", "start"]
