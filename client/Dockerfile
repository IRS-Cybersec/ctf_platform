# Stage 1
FROM node:latest AS builder
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci
COPY . .
RUN npm run build


# Stage 2
#pull the latest nginx base image
FROM nginx:latest
#copies React to the container directory
# Set working directory to nginx resources directory
WORKDIR /var/www/html
#Remove default nginx static resources
RUN rm -rf ./*
RUN rm -rf /etc/nginx/sites-enabled/
# Copies static resources from builder stage
COPY --from=builder /usr/src/app .
COPY nginx.conf /etc/nginx/

EXPOSE 20005
# Containers run nginx with global directives and daemon off
CMD ["nginx", "-g", "daemon off;"]

