# licenta2025 - ExpertLink
Dezvoltarea unei platforme de rețea socială dedicată profesioniștilor dintr-un anumit domeniu, cu funcționalități de networking și colaborare

💻Tehnologii folosite:
    - Expo V53
    - React native
    - TypeScript
    - Clerk (auth)
    - Supabase (db)

 ## TODO:
 ### DE IMPLEMENTAT (NOU)
 #### pagina profil 
    - postarile userului
    - numar postari
    - numar conexiuni
    - posibilitate schimbare poza profil
    - posibilitate schimbare descriere cont
    - posibilitate incarcare CV
#### chat in timp real:
    - chat individual
    - chat de grup
    - mesaje in timp real
    - notificari
#### notificari -> cand se primesc notificari:
    - se primeste un mesaj
    - se primeste un like
    - se primeste un comment
    - se posteaza in grup
    - e invitat in grup
    - e acceptat in grup
    - i s-a dat un rol nou (general)
    - i s-a dat un rol nou (grup)
    - i s-a scos un rol (general/grup)
#### pagina exploreaza
    - un container (2 randuri) cu persoane noi -> apar cele cu cele mai multe conexiuni comune.. ar trebui db graph? => cypher?
    - apar grupuri existente -> ordine:
      -  1)cele care au cei mai multi membrii facand parte din conexiunile userului
      -  2)cele care au cei mai multi membrii ca numar
      -  3)cele care au cele mai multe postari
#### dashboard admin:
   - postari raportate
   - conturi raportate
   - statistici activitate

#### imagine in docker
#### containerizare kubernetes - imi trebuie?nu am server dar e bun pentru cunostinte

### DE IMBUNATATIT
- cand se creeaza o postare, sa se aleaga partea din imagine care sa apara si in postare, rezolutia imaginii din postare sa coincida cu ce s-a ales
- pe ios sa se afiseze dialog ca pe web, nu alerte