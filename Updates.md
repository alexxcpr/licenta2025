# Update notes

⬇️alpha -> 🔜beta -> 🔜release candidate(RC) -> 🔜versiune finala

## alpha 01.0.1
*IMPLEMENTARI NOI*

*IMBUNATATIRI*

*BUG FIXES*

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