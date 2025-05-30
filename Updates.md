# Update notes

⬇️alpha -> 🔜beta -> 🔜release candidate(RC) -> 🔜versiune finala

## alpha 01.1.1
*IMPLEMENTARI NOI*
- acum din profil -> (i) -> Adaugata posibilitatea de a adauga/modifica/sterge informatiile de contact(domeniu, functie, ocupatie), Educatia, Experienta profesionala, Alte activitati

*IMBUNATATIRI*
- imbunatatit datetime picker-ul, functioneaza atat pe mobile cat si in web
- eliminate erorile din consola web

*BUG FIXES*
- datetime picker-ul din modal pentru adaugarea experientei, educatiei si alte cursuri nu functiona
- nu se putea alege o imagine/pdf pentru a incarca dovada cursului
- nu se putea modifica/sterge o informatie adaugata in sectiunile de Educatie / Experienta profesionala / Alte activitati
- existau 2 componente cu acelasi nume ContactDetails, a fost stearsa cea nefolosita
  
## alpha 01.1.0
*IMPLEMENTARI NOI*
- la sign up se cere si domeniul de activitate, functia si ocupatia
- pe pagina de profil apare o sectiune noua, sub bio, cu urmatoarele informatii: domeniu, functie, ocupatie
- pe pagina de profil, sectiune noua, langa butoanele de afisare a postarilor, un nu buton (i) => afiseaza datele profesionale ale utilizatorului:
  - Informatii de contact (nume utilizator, domeniu, functie, ocupatie, email)
  - Educatie (Universitatea, profil, data inceput, data sfarsit)
  - Experienta profesionala (numele companiei, domeniu, functia, data de inceput, data de sfarsit, descriere)
  - Alte activitati (cursuri / certificari)
- Buton nou in setari -> Conexiunile mele
- In Conexiunile mele -> userii sunt grupati dupa domeniu
- Butoane noi pentru a adauga detalii pentru noile sectiuni ("Adauga educatie", "Adauga experienta", "Adauga activitate" => se deschide un modal cu campurile de completat)

*IMBUNATATIRI*
- imbunatatit UX -> cand se schimba intre afisarea grid a postarilor - afisarea in list view a postarilor - postarile salvate - activitatea profesionala a userului, acum se randeaza doar componenta cu detaliile care se schimba, nu toata pagina
- cand se deschide meniul cu setari nu se mai randeaza numarul de conexiuni, poza de profil si butonul pentru trimite conexiune
- imbunatatita diagrama ER

*BUG FIXES*
- rezolvate diferite buguri legate de randare + diferite erori de consola

## alpha 01.0.5
*IMPLEMENTARI NOI*
- modificata diagrama ER pentru a include tabela de conexiuni si cereri de conexiune
- adaugate tabelele noi in baza de date (connection, connection_request)
- adaugat sistem conexiuni:
  - se poate trimite o conexiune unui user
  - acesta primeste o cerere de conexiune 
  - cererile de conexiuni se pot vedea in settings -> Cereri conexiune
  - din lista cu cereri se poate accepta/refuza cererea de conexiune
  - butonul de trimite conexiune de pe profilul userului se schimba in functie de starea cererii, daca nu exista o cerere=>"Trimite conexiune". Daca exista o cerere trimisa=>"Asteapta raspuns". Daca cererea a fost acceptata=>"Sterge conexiunea"
- Dialog stil modal pentru confirmari si feedback vizual
- 
*IMBUNATATIRI*
- Implementat sistem de cache pentru pagina de profil si home page (acum nu se re-randeaza intreaga pagina de fiecare data cand se acceseaza)
  
*BUG FIXES*
- sterse fisierele care nu mai sunt folosite

## alpha 01.0.4
*IMPLEMENTARI NOI*
- Functionalitate pentru butonul de listView pentru profil, acum postarile se vor afisa in lista (in loc de grid)
- Functionalitate pentru butonul de bookmark pentru postari, vor fi afisate doar postarile salvate de user.
- Butonul de bookmark pentru postari este disponibil doar pentru userul curent.
- Functionalitate pentru butonul de like
- Functionalitate pentru butonul de save

*IMBUNATATIRI*
- refactorizare componente pentru postari, componenta parinte: FullPost.tsx, componenta copil: PostHeader.tsx, PostContent.tsx, PostActions.tsx, PostComments.tsx. => modularitate, consistenta design si functionalitate
- utilizare componenta refactorizata in pagina de home page si profil pentru consistenta
- refactorizare componente pagina profil, componenta parinte: FullProfilePage.tsx, componenta copil: ProfileHeader.tsx, ProfileUserInfo.tsx, ProfileActionButtons.tsx, ProfileUserPosts.tsx, ProfileListViewPosts.tsx, ProfileSavedPosts.tsx. => modularitate, consistenta design si functionalitate
- utilizare componenta refactorizata in pagina de profil pentru consistenta

*BUG FIXES*
- sters fisierul useUserProfile.ts si folderul hooks din (home) pentru ca nu se foloseau

## alpha 01.0.3
*IMPLEMENTARI NOI*
- adaugare roluri pentru utilizatori (Moderator, Admin)
- functionalitate pentru butonul de setari (dashboard moderare, dashboard admin, delogheaza-te) atat in home page cat si in profile page
- dashboard moderare se afiseaza doar daca userul are rolul de "Moderator"
- dashboard admin se afiseaza doar daca userul are rolul de "Administrator"
- swipe gesture pentru a inchide meniul de setari. (de la stanga la dreapta)
- swipe gesture pentru a reveni la pagina anterioara din pagina de profil (de la stanga la dreapta)
- modalul de editare a profilului facut pe toata pagina
- animatii pentru swipe gestures

*IMBUNATATIRI*
- tranformat buton optiuni postare (3 puncte "...") in dialog din alerta + estetizare (inca nu are functionalitate)
- adaugat buton pentru stergere postare (doar daca userul curent este autorul postarii)
- butonul de sign out primeste props si se deschide modalul de confirmare pentru a se loga din cont

*BUG FIXES*
- nimic

## alpha 01.0.2

*IMPLEMENTARI NOI*
- rutare pentru profil prin rute backend express -> ex: http://localhost:8081/profile/user_2xV0qLYatX3QO5RiPzR5gLHiQfg  || cu ngrok: https://azyiyrvsaqyqkuwrgykl.ngrok-free.app/profile/user_2xV0qLYatX3QO5RiPzR5gLHiQfg
- implementare ngrok pentru testare pe telefon
- implementare resetare la localhost pentru link ul de backend
- script pentru pornire server cu ngrok si configurare link backend automat in client -> metoda getApiUrl
- documentatie pentru utilizare scripturi start-with-ngrok.js si reset-to-localhost.js in ./server/README-NGROK.md

*IMBUNATATIRI*
- restructurare fisiere si foldere pentru a fi mai usor de gestionat
- Pagina de profil dinamica, butonul de editare a profilului apare doar daca este profilul userului curent

*BUG FIXES*
- pe web nu se putea vedea profilul userilor (trebuia header custom pentru request catre ngrok)
- se deschide pagina userului daca se apasa pe numele/poza de profil a userului din comentarii/header-ul din homepage/imaginea postarii
- din profilul unui utilizator, cand se apasa pe sageata de back, daca nu era o pagina anterioara dadea eroare, acum se deschide home page
- daca eram conectat cu profilul X si intram pe profilul Y care nu avea postari, imi aparea si mie butonul de Creeaza o postare noua
  
## alpha 01.0.1
*IMPLEMENTARI NOI*
- implementare comentarii la postari
- link catre pagina de profil a userului din header
*IMBUNATATIRI*
- modificat design modal detalii postare (facut alb)
- redesign header
- renuntat la sectiunea story
- renuntat la feed-ul de pe home page
- acum in home page se vad doar datele din db
- numele utilizatorului din comentarii se afiseaza cu limita de 20 de caractere
- numele utilizatorului din header se afiseaza cu limita de 10 de caractere
*BUG FIXES*
- comentariile nu se afisau corect, nu se vedea poza de profil si numele userului (aparea "Utilizator")

## alpha 01.0.0
    ce functioneaza acum?: 
        - 🔐sistem login cu clerk:
          - pagina sign up
          - pagina sign in
          - cod pe email pentru confirmare
          - cand se creeaza un user nou prin api-ul clerk, se salveaza si in baza de date supabase (tabel user)
        - 📝pagina principala contine:
          -  header (buna user, logo->afiseaza detalii despre developer cand se apasa, notificari, setari, logout)
          -  sectiune story
          -  sectiune feed (postari proprii + postarile conexiunilor)
          -  bottom navbar (Acasa, Exploreaza, Posteaza, Notificari (ar trebui scos ca e si in header), Profil)
          -  scroll down pentru a da refresh la pagina
       -  posibilitatea de a incarca o imagine intr-o postare cu 🖼️ imagine din galerie / 📷 imagine fotografiata pe loc
       -  se poate pune descriere unei postari
       -  💙 like se coloreaza, save se coloreaza (la postare, la apasare)
       -  ⌛ apare timpul scurs de la efectuarea unei postari (in secunde pana la 60s, in minute pana la 60m, in ore pana la 24h, restul in zile)