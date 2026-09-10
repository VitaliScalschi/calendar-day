FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/ssl/cecmd2027-cert.pem /calendar_day/nginx/ssl/cecmd2027-cert.pem
COPY nginx/ssl/cecmd2027-key.pem /calendar_day/nginx/ssl/cecmd2027-key.pem
COPY --from=build /app/dist /usr/share/nginx/html