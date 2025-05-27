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
- Pagina setări
- Flux stergere postare
- Flux raportare postare

### 📝 Pagina de profil
- Număr conexiuni:
  - Necesită tabelă nouă + relații în Supabase
  - Trebuie adăugată în ErDiagram.md
- Posibilitatea de încărcare CV (format PDF)

### 📝 Pagina setări
- În curs de dezvoltare

### 📝 Flux stergere postare

### 📝 Stergere comentariu propriu / de catre admin

### 📝 Stergere conexiune (cont)

### 📝 Flux raportare postare
- se raporteaza postarea si ajunge in dashboard moderare
- se poate sterge postarea sau se poate sterge raportarea
- se poate sterge contul utilizatorului care a postat

### 📝 Raportare comentariu (OPTIONAL)
- se raporteaza comentariul si ajunge in dashboard moderare
- moderatorul decide sa stearga comentariul sau nu

### 📝 Raportare conexiune (cont)

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

### 📝 Sistem de roluri pentru utilizatori
- **Admin**: 
  - Control complet asupra platformei
  - Acces la dashboard admin
  - Gestionarea utilizatorilor și conținutului
- **Moderator**: 
  - Moderarea conținutului
  - Gestionarea raportărilor
  - Gestionarea grupurilor
- **Utilizator standard**: 
  - Funcționalități de bază
  - Postare conținut
  - Interacțiune cu alți utilizatori

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

## 🔄 Ordinea recomandată de implementare

1. **Sistem de roluri pentru utilizatori** - Prioritate maximă, deoarece definește structura de bază a permisiunilor în aplicație și influențează toate celelalte funcționalități.

2. **Conexiuni între utilizatori** - Implementarea tabelei de conexiuni și relațiilor în Supabase este esențială pentru funcționalitatea de rețea socială.

3. **Pagina "Explorează"** - După implementarea conexiunilor, această pagină devine naturală pentru a extinde rețeaua utilizatorilor.

4. **Pagina setări** - Implementarea unei interfețe centralizate pentru gestionarea contului și preferințelor.

5. **Funcționalități pentru grupuri** - Oferă valoare adăugată platformei și încurajează colaborarea între profesioniști.

6. **Sistem de notificări** - Crește engagement-ul utilizatorilor și îi ține informați despre activitățile relevante.

7. **Chat în timp real** - Facilitează comunicarea directă între utilizatori, crescând utilitatea platformei.

8. **Dashboard admin** - După implementarea funcționalităților de bază, este important să oferi instrumente de administrare.

9. **Îmbunătățiri UI/UX** - Rezolvarea problemelor de afișare și optimizarea experienței utilizatorilor.

10. **Containerizare** - Ultimul pas pentru pregătirea pentru producție și scalabilitate.


## Analiza Sistem de roluri pentru utilizatori

### Funcționalități pentru utilizatori standard
- ✅ Creare cont
- ✅Login
- ✅Logout
- Schimbare parolă
- ✅Schimbare nume
- ✅Schimbare descrieres

### Funcționalități pentru utilizatori moderatori
- Acces la dashboard moderare, pagina se va regasi in setari -> dashboard moderare
- Moderează conținutul
- Gestionează raportările (apar in dashboard moderare)
- Gestionează grupurile (apar in dashboard moderare)
  
### Funcționalități pentru utilizatori admin
- Control complet asupra platformei
- Acces la dashboard admin, pagina se va regasi in setari -> dashboard admin + acces la dashboard moderare
- In dashnoard admin se vor afisa statistici legate de platforma (numar de utilizatori, numar de postari, numar de comentarii, numar de like-uri)
- Gestionarea utilizatorilor și conținutului



