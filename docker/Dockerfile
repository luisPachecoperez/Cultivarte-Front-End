# ===== 1) BUILD: compila Angular e inyecta env con tus scripts =====
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias con buen cacheo
COPY package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Copia el resto del proyecto (incluye scripts/replace-env.js y environments)
COPY . .

# Ejecuta tu build:dev (esto corre prebuild -> replace-env.js -> ng build)
RUN npm run build:dev

# ===== 2) RUNTIME: servir SPA con 'serve' en el puerto que defina Cloud Run =====
FROM node:20-alpine AS runtime
WORKDIR /app

# Servidor estático para SPA
RUN npm i -g serve@14

# Copia el artefacto construido
COPY --from=build /app/dist/davi-fbol-cultivarte-front-mngr ./dist

# Cloud Run inyecta PORT (no uses 443 dentro del contenedor)
ENV PORT=8080
EXPOSE 8080

# -s SPA fallback a index.html, -l puerto
CMD ["/bin/sh", "-c", "serve -s dist -l ${PORT}"]
