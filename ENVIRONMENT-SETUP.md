# 🌍 Configurare Variabile de Environment

## 📋 Variabilele necesare

### Pentru Server:
- `SUPABASE_URL` - URL-ul proiectului tău Supabase
- `SUPABASE_ANON_KEY` - Cheia anonimă din Supabase
- `JWT_SECRET` - Secret pentru semnarea token-urilor JWT
- `NODE_ENV` - Mediul de rulare (development/production)
- `PORT` - Portul pe care rulează serverul

### Pentru Client (Expo):
- `EXPO_PUBLIC_SUPABASE_URL` - Același URL Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Aceeași cheie Supabase
- `EXPO_PUBLIC_API_URL` - URL-ul API-ului tău

## 🔧 Configurare pas cu pas


#### Folosește env_file în docker-compose.yml
Decomentează liniile `env_file` din docker-compose.yml și creează fișierele:
- `server/.env` pentru server
- `client/my-app/.env` pentru client

## 🚀 Testare configurație:
```bash
# Verifică că variabilele sunt setate
docker-compose config

# Rulează aplicația
docker-compose up --build
``` 