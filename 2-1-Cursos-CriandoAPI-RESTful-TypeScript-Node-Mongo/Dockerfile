FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./dist ./

EXPOSE 3099

ENV RUN_IN_DOCKER=true

CMD [ "npm", "run", "start:docker" ]