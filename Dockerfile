FROM node:20.11.1

WORKDIR /root

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "npm", "start"]