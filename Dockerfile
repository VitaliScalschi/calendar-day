FROM node:22-alpine AS build
WORKDIR /app

# Tot proiectul frontend într-un singur strat: package.json / lock și src sunt mereu sincrone.
# node_modules de pe PC nu se copiază (.dockerignore).
COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Dacă pe server package-lock.json e vechi dar main.tsx importă deja react-query,
# npm ci nu instalează pachetul — instalăm explicit doar dacă lipsește.
RUN npm ci --no-audit --no-fund \
  && ([ -f node_modules/@tanstack/react-query/package.json ] \
      || npm install @tanstack/react-query@^5.100.5 --no-save --no-audit --no-fund) \
  && npm run build

FROM nginx:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
