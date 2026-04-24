# ── Dev ───────────────────────────────────────────────────────────────────────
FROM node:20-slim AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

EXPOSE 3501

ENV VITE_API_TARGET=http://api:8000

CMD ["npx", "vite", "--host"]

# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# ── Production (nginx) ────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
