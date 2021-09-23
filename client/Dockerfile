FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve

EXPOSE 20002
CMD ["serve", "-l", "20002", "-s", "build"]