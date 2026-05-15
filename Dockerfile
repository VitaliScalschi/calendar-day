FROM node:22-alpine AS build
WORKDIR /app

# Tot proiectul frontend într-un singur strat: package.json / lock și src sunt mereu sincrone.
# node_modules de pe PC nu se copiază (.dockerignore).
COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Folosim `npm install` (nu `npm ci`): dacă pe server package-lock.json lipsește sau e dezlipit
# de package.json, `npm ci` eșuează cu EUSAGE; `npm install` reconciliază și instalează.
RUN npm install --no-audit --no-fund \
  && test -f node_modules/bootstrap-icons/font/bootstrap-icons.css \
  && npm run build

FROM nginx:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
