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
- Pagina setări
- Flux stergere postare
- Flux raportare postare

## 📋 Funcționalități în curs de implementare

### 📝 Flux stergere postare

### 📝 Sistem conexiuni
- ✅tabele noi in supabase: 
  - ✅connection_request(id_connection_request, id_user_sender, id_user_receiver, status, date_created, date_updated)
  - ✅connection(id_connection, id_user_1, id_user_2, date_created, date_updated)
- ✅se adauga in diagrama erDiagram.md
- ✅cod sql pentru crearea tabelului in supabase:
- ✅se adauga relatiile in supabase
- ✅buton pe profilul utilizatorului cu trimitere cerere de conexiune
- ✅in setari -> buton cu lista cererilor de conexiune:
  - ✅din lista se poate accepta sau se poate sterge cererea de conexiune (bifa si X)
- ✅pe profil cand se apasa pe butonul cu numarul de conexiuni se deschide un modal cu lista conexiunilor
  - in modalul de lista conexiunilor se poate sterge o conexiune (X)

### 📝 Sugestii importante - prof. Florentina Toader 
- 1.cand face cont sa aiba posibilitatea de a trece domeniul si functia (dropdown)
- 2.prietenii sa fie grupati in functie de domeniu in care lucreaza (buton conexiunile mele in settings. Settings->Conexiunile mele (ConnectionList.tsx))
- 3.in cont: functie, istoric, nivel de invatamant, cursuri, certificari. Sa fie grupati (invatamant la invatamant, marketing la marketing, etc)

logica implementare:
  - 1,2,3 domeniul ar trebui sa apara pe profil sub numele de utilizator (este important)
  - 1,3 functia ar trebui sa apara pe profil sub domeniu (este importanta)
  - inca un buton informativ (i) precum cel de ListView si postari salvate pe profil dar sa fie cu: domeniul, functia, educatia, certificarile utilizatorului => ProfileDetails.tsx
  - componenta noua: ProfileDetails.tsx => se afiseaza cand se apasa pe "mai multe detalii"
  - pe profilul meu => buton cu Adauga activitate => create job_activity din form => se afiseaza in noua componenta
  - pe profilul meu => buton cu Adauga certificat/curs => create other_activity din form => se afiseaza in noua componenta
  - Ordinea de afisare in *ProfileDetails*:
    1. Username
    2. Domeniu
    3. Functie
    4. Email
    5. Educatie (education_activity)
    6. Istoric activitate (job_activity)
    7. Cursuri/Certificari (other_activity)

  tabele noi pentru cataloage de selectie + optiuni filtrare in explore page:
    **NOI** - de creat + adaugat in erDiagram
    - domenii (id_domeniu, denumire) - invatamant, marketing, e-commerce, it...
    - functii (id_functie, denumire) - Director general, programator, vanzator ...  (*Ar trebui sa se muleze cu domeniile)
    - ocupatii (id_ocupatie, denumire) => somer, elev, student, angajat, antreprenor, freelancer...e
    - education_activity (id_education_activity, denumire_institutie, data_inceput, data_sfarsit, denumire_profil)
    - job_activity (id_job_activity, id_user, id_domeniu, id_functie, data_inceput, companie, data_sfarsit, descriere) -> se foloseste pentru a inregistra istoricul activitatii userului (raportul activitatii-> unde a lucrat, cat, ce functie a avut, ce lucruri a facut acolo)
    - other_activity (id_other_activity, id_user, denumire, storage_file)
    **EXISTENTE**
    - user (id_domeniu, id_functie)

teorie:
	- toate tehnologiile folosite
		subpuncte:
			1)Tehnologii folosite in dezvoltarea aplicatiei: - 15pagini
				2.1
				2.2
			

### 📝 Chat în timp real
- Chat individual
- Chat de grup
- Mesaje în timp real
- Notificări

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

### ✅ Pagina de profil
- ✅ Număr conexiuni:
  - ✅Necesită tabelă nouă + relații în Supabase
  - ✅Trebuie adăugată în ErDiagram.md

### 📝 Stergere conexiune (cont)

### 📝 Flux raportare postare
- se raporteaza postarea si ajunge in dashboard moderare
- se poate sterge postarea sau se poate sterge raportarea
- se poate sterge contul utilizatorului care a postat

### 📝 Raportare comentariu (OPTIONAL)
- se raporteaza comentariul si ajunge in dashboard moderare
- moderatorul decide sa stearga comentariul sau nu

### 📝 Raportare conexiune (cont)


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

### 📝 Sistem de roluri pentru utilizatori
- **Admin**: 
  - Acces la dashboard admin
  - Gestionarea utilizatorilor și conținutului
- **Moderator**: 
  - Moderarea conținutului
  - Gestionarea raportărilor
  - Gestionarea grupurilor

### 📝 Stergere comentariu propriu / de catre admin

### 📝 Dashboard admin
- Postări raportate
- Conturi raportate
- Statistici activitate

### 📝 Containerizare
- Imagine în Docker
- Containerizare Kubernetes (opțional)

### ✅ Pagina setări

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

1. ✅**Sistem de roluri pentru utilizatori** - Prioritate maximă, deoarece definește structura de bază a permisiunilor în aplicație și influențează toate celelalte funcționalități.

2. ✅**Conexiuni între utilizatori** - Implementarea tabelei de conexiuni și relațiilor în Supabase este esențială pentru funcționalitatea de rețea socială.

3. **Pagina "Explorează"** - După implementarea conexiunilor, această pagină devine naturală pentru a extinde rețeaua utilizatorilor.

4. ✅**Pagina setări** - Implementarea unei interfețe centralizate pentru gestionarea contului și preferințelor.

5. SE RENUNTA LA**Funcționalități pentru grupuri** - Oferă valoare adăugată platformei și încurajează colaborarea între profesioniști.

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