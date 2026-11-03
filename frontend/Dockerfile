# ===============================================
# Dockerfile - Next.js Frontend (Escuela de Idiomas)
# Node 20 Alpine
# ===============================================
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias primero (cache de layers)
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

EXPOSE 3000

# Modo desarrollo con hot reload
CMD ["npm", "run", "dev"]
