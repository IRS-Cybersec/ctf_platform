# Stage 1
FROM node:lts-bullseye AS builder
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci --only=production
COPY . .
# Reduces the (frankly insane) amount of RAM this build takes
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Stage 2
#pull the latest (stable) nginx base image
FROM nginx:stable
#copies React to the container directory
# Set working directory to nginx resources directory
WORKDIR /usr/share/nginx/html
#Remove default nginx static resources
RUN rm -rf ./*
# Copies static resources from builder stage
COPY --from=builder /usr/src/app/build .
COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir /usr/share/nginx/static/profile
RUN mkdir /usr/share/nginx/static/category
RUN useradd node
RUN chown -R node /usr/share/nginx/static/

EXPOSE 20005
# Containers run nginx with global directives and daemon off
CMD ["nginx", "-g", "daemon off;"]

