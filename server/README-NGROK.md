# Dezvoltare cu Ngrok

Acest fișier explică cum să folosești scripturile pentru dezvoltare cu ngrok, care sunt utile pentru testarea aplicației pe Expo Go din dispozitive fizice.

## Scripturi disponibile

### `npm run dev` 
**Dezvoltare cu ngrok (recomandat pentru Expo Go)**
- Pornește serverul Express pe portul 5000
- Pornește ngrok pentru a crea un tunnel public
- Actualizează automat configurația clientului cu URL-ul ngrok
- Perfect pentru testarea pe dispozitive fizice cu Expo Go

```bash
cd server
npm run dev
```

### `npm run dev:local`
**Dezvoltare locală (doar pentru simulator)**
- Pornește serverul Express pe localhost:5000 cu nodemon
- Nu folosește ngrok
- Ideal pentru dezvoltare rapidă în simulator

```bash
cd server
npm run dev:local
```

### `npm run reset-config`
**Resetează configurația la localhost**
- Resetează fișierul de configurare la localhost:5000
- Util când vrei să revii la dezvoltarea locală

```bash
cd server
npm run reset-config
```

## Cum funcționează

1. **npm run dev**:
   - Pornește serverul Express
   - Pornește ngrok pe portul 5000
   - Obține un URL public (ex: https://abc123.ngrok.io)
   - Actualizează `client/my-app/config/backend.ts` cu noul URL
   - Aplicația React va folosi automat noul URL

2. **La oprirea serviciului (Ctrl+C)**:
   - Oprește ngrok
   - Oprește serverul
   - Resetează configurația la localhost

## Avantaje

✅ **Pentru dispozitive fizice**: Poți testa pe telefon cu Expo Go  
✅ **Actualizare automată**: Nu trebuie să modifici manual URL-urile  
✅ **Clean shutdown**: La oprire, totul se resetează la localhost  
✅ **URL-uri publice**: Poți împărtăși API-ul pentru testare externă  

## Exemplu de folosire

```bash
# Terminal 1 - Server cu ngrok
cd server
npm run dev

# Așteaptă să vezi: 
# ✅ Ngrok a fost pornit cu succes!
# 🔗 URL public: https://abc123.ngrok.io
# ✅ Configurația clientului a fost actualizată

# Terminal 2 - Client React Native
cd client/my-app
npm start # sau expo start
```

## Troubleshooting

### Ngrok nu pornește
- Verifică dacă ai conexiune la internet
- Verifică dacă portul 5000 nu este ocupat
- Încearcă `npm run reset-config` și apoi `npm run dev`

### Configurația nu se actualizează
- Verifică dacă fișierul `client/my-app/config/backend.ts` există
- Verifică permisiunile de scriere
- Rulează manual `npm run reset-config`

### Serverul nu pornește
- Verifică dacă toate dependințele sunt instalate: `npm install`
- Verifică dacă .env există și are configurația Supabase
- Încearcă `npm run dev:local` pentru debug local 