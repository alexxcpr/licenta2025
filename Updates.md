# Update notes

⬇️alpha -> 🔜beta -> 🔜release candidate(RC) -> 🔜versiune finala

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