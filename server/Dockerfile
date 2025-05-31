# Folosim Node.js 18 LTS ca imagine de bază
FROM node:18-alpine

# Instalăm dependențe de sistem necesare
RUN apk add --no-cache curl

# Setăm directorul de lucru în container
WORKDIR /app

# Copiem fișierele de dependențe
COPY package*.json ./
COPY tsconfig.json ./

# Instalăm TOATE dependențele (inclusiv dev) pentru build
RUN npm ci

# Copiem restul codului sursă
COPY . .

# Construim aplicația TypeScript
RUN npm run build

# Expunem portul pe care rulează serverul
EXPOSE 3000

# Comandă pentru a porni serverul
CMD ["node", "dist/server.js"] 