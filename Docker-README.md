# 🐳 Ghid Docker pentru Proiectul de Licență

## Cerințe preliminare
- Docker Desktop instalat pe calculatorul tău
- Docker Compose (vine inclus cu Docker Desktop)
- **Variabilele de environment configurate** (vezi secțiunea de mai jos)

## 🌍 Configurare Variabile de Environment

### IMPORTANT: Înainte de a rula Docker!
1. **Pentru dezvoltare locală**, creează și:
   - `server/.env` (folosind `server/env.example` ca model)
   - `client/my-app/.env` (folosind `client/my-app/env.example` ca model)

## Structura Docker
```
proiect/
├── .env                       # Variabile pentru Docker Compose
├── docker-compose.yml          # Orchestrează toate serviciile
├── server/
│   ├── .env                   # Variabile locale pentru server
│   ├── env.example            # Template pentru variabile
│   ├── Dockerfile             # Imagine pentru API backend
│   └── .dockerignore         # Exclude fișiere nefolositoare
└── client/my-app/
    ├── .env                   # Variabile locale pentru client
    ├── env.example            # Template pentru variabile
    ├── Dockerfile             # Imagine pentru frontend web
    └── .dockerignore         # Exclude fișiere nefolositoare
```

## Comenzi Docker

### 1. Construire și pornire (prima dată)
```bash
docker-compose up --build
```

### 2. Pornire (folosind imaginile existente)
```bash
docker-compose up
```

### 3. Pornire în background
```bash
docker-compose up -d
```

### 4. Vizualizare logs
```bash
# Pentru toate serviciile
docker-compose logs

# Pentru un serviciu specific
docker-compose logs server
docker-compose logs client
```

### 5. Oprire servicii
```bash
docker-compose down
```

### 6. Oprire și ștergere volume-uri
```bash
docker-compose down -v
```

### 7. Reconstruire imaginilor
```bash
docker-compose build --no-cache
```

## Porturile aplicației
- **Server API**: http://localhost:3000
- **Client Web**: http://localhost:19006
- **Expo Dev Server**: http://localhost:19000 (pentru mobile prin Expo Go)

## 🎓 Pentru Prezentarea la Licență

### Demo rapid:
1. **Pornește aplicația**: `docker-compose up --build`
2. **Web browser**: http://localhost:19006
3. **Mobile**: Scanează QR code de la http://localhost:19000 cu Expo Go

### Avantaje pentru prezentare:
- ✅ **Cross-platform**: același cod pe web și mobile
- ✅ **Un click deploy**: `docker-compose up`
- ✅ **Live demo**: arată în timp real pe telefon și browser
- ✅ **Arhitectură modernă**: containerizată și scalabilă

### 📱 Pentru mobile demo:
1. Instalează **Expo Go** pe telefon
2. Scanează QR code-ul din terminal
3. Aplicația se încarcă automat pe telefon

**💡 Tip**: Pentru prezentare, folosește `--tunnel` pentru acces de oriunde!

## Troubleshooting

### Probleme comune:
1. **Port ocupat**: Oprește alte aplicații care folosesc porturile 3000 sau 19006
2. **Rebuild după modificări**: Rulează `docker-compose build` după modificări majore
3. **Curățare cache Docker**: `docker system prune -a` (Atenție: șterge toate imaginile nefolositoare!)

### Comenzi utile de debugging:
```bash
# Intră în containerul server
docker-compose exec server sh

# Intră în containerul client
docker-compose exec client sh

# Verifică ce containere rulează
docker ps

# Verifică spațiul folosit de Docker
docker system df
```

## Dezvoltare cu Docker
- Pentru dezvoltare, folosește în continuare `npm run dev` local
- Docker este ideal pentru producție sau testare în mediu izolat
- Fiecare modificare de cod necesită rebuild pentru a fi vizibilă în container 