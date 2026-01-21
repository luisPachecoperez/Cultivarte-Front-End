    FROM node:22-alpine AS builder
    WORKDIR /app
    # COPY package*.json ./
    # RUN npm ci --no-audit --no-fund --legacy-peer-deps --omit=optional && npm cache clean --force 
    COPY . .

    FROM node:22-alpine AS runtime
    WORKDIR /app
    RUN npm i -g serve@14
    RUN npm i express
    COPY --from=builder /app/dist/davi-fbol-cultivarte-front-mngr/browser ./dist 
    COPY    server.culti.js ./

    RUN echo "📦 Contenido de ./dist:" && ls -l ./dist
    RUN echo "📦 Listar server.culti.js:" && ls -l ./
    
    ENV PORT=8001
    EXPOSE 8001 
    #CMD ["serve", "-s", "dist", "-l", "8001"]
    CMD ["node", "server.culti.js"]



