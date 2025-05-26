# ExpertLink 🌐

## Descriere
Dezvoltarea unei platforme de rețea socială dedicată profesioniștilor dintr-un anumit domeniu, cu funcționalități de networking și colaborare.

## 💻 Tehnologii folosite
- Expo V53
- React Native
- TypeScript
- Clerk (autentificare)
- Supabase (bază de date)
- Express (backend)
- Server backend cloud: [Render](https://licenta2025.onrender.com/)

## ✅ Funcționalități implementate
- Definirea acțiunii la apăsarea unei postări
- Afișarea postărilor utilizatorului în pagina de profil
- Afișarea numărului de postări
- Posibilitatea de schimbare a pozei de profil
- Posibilitatea de schimbare a numelui
- Posibilitatea de schimbare a descrierii contului

## 📋 Funcționalități în curs de implementare

### 📝 Pagina de profil
- Număr conexiuni:
  - Necesită tabelă nouă + relații în Supabase
  - Trebuie adăugată în ErDiagram.md
- Posibilitatea de încărcare CV (format PDF)

### 📝 Pagina setări
- În curs de dezvoltare

### 📝 Chat în timp real
- Chat individual
- Chat de grup
- Mesaje în timp real
- Notificări

### 📝 Sistem de notificări
Utilizatorul primește notificări când:
- Primește un mesaj
- Primește un like
- Primește un comentariu
- Cineva postează în grup
- Este invitat în grup
- Este acceptat în grup
- Primește un rol nou (general)
- Primește un rol nou (grup)
- I se retrage un rol (general/grup)

### 📝 Pagina "Explorează"
- Container (2 rânduri) cu persoane noi
  - Vor apărea cele cu cele mai multe conexiuni comune
  - Posibilă implementare de DB graph cu Cypher
- Grupuri existente, ordonate după:
  1. Numărul de membri din conexiunile utilizatorului
  2. Numărul total de membri
  3. Numărul de postări

### 📝 Funcționalități pentru grupuri
- Creare grup
- Ștergere grup
- Trimitere invitații
- Alăturare la grup
- Părăsire grup
- Listă cu membri și roluri
- Pagină pentru grup cu postările specifice
- Chat de grup

### 📝 Dashboard admin
- Postări raportate
- Conturi raportate
- Statistici activitate

### 📝 Containerizare
- Imagine în Docker
- Containerizare Kubernetes (opțional)

## 🛠️ De îmbunătățit
- Ștergerea imaginii din bucket când se șterge o postare
- Selectarea părții din imagine care să apară în postare
- Adaptarea dialogurilor pe iOS pentru a se afișa ca pe web, nu ca alerte

## 📌 În așteptare
- Implementarea funcționalității de distribuire a contului

## ✅ Modificări recente
- Eliminarea secțiunii de story-uri (nu există pe LinkedIn)
- Eliminarea feed-ului redundant de pe pagina principală
