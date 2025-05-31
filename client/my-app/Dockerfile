# Folosim Node.js 18 LTS ca imagine de bază
FROM node:18-alpine

# Setăm directorul de lucru în container
WORKDIR /app

# Instalăm dependențele globale necesare pentru Expo
RUN npm install -g @expo/cli

# Copiem fișierele de dependențe
COPY package*.json ./

# Instalăm dependențele
RUN npm ci

# Copiem restul codului sursă
COPY . .

# Expunem porturile pentru web și Expo dev server
EXPOSE 19006 19000

# Comandă pentru a porni aplicația cu tunnel (pentru mobile) și web support
CMD ["npx", "expo", "start", "--tunnel", "--web", "--port", "19000"] 