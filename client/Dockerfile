# Stage 1
FROM node:latest AS builder
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2
#pull the latest nginx base image
FROM nginx:latest
#copies React to the container directory
# Set working directory to nginx resources directory
WORKDIR /usr/share/nginx/html
#Remove default nginx static resources
RUN rm -rf ./*
# Copies static resources from builder stage
COPY --from=builder /usr/src/app/build .
COPY nginx.conf /etc/nginx/nginx.conf

COPY default.webp /usr/share/nginx/static/profile/default.webp 

EXPOSE 20005
# Containers run nginx with global directives and daemon off
CMD ["nginx", "-g", "daemon off;"]

