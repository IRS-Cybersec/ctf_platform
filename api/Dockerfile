FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci --only=production
COPY . .
RUN npm install pm2 -g


EXPOSE 20001
CMD ["pm2-runtime", "api.js"]