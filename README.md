# licenta2025 - ExpertLink
Dezvoltarea unei platforme de rețea socială dedicată profesioniștilor dintr-un anumit domeniu, cu funcționalități de networking și colaborare

💻Tehnologii folosite:
    - Expo V53
    - React native
    - TypeScript
    - Clerk (auth)
    - Supabase (db)
    - Express (backend)

 ## TODO:
 - TODO: Definește acțiunea la apăsarea unei postări (Ce se intampla cand se apasa pe o postare)
 - TODO: Adaugă când implementăm partajarea (Ce se intampla cand se apasa pe distribuie cont)
 - TODO: Implement settings navigation (De facut ruta catre setari + pagina setari)
 ### DE IMPLEMENTAT (NOU)
 #### pagina profil 
    x postarile userului
    x numar postari
    - numar conexiuni:
      - trebuie tabela noua + relatii in supabase
      - trebuie adaugata in ErDiagram.md
      - 
    x posibilitate schimbare poza profil
    x posibilitate schimbare nume
    x posibilitate schimbare descriere cont
    - posibilitate incarcare CV: incarcare pdf
#### pagina setari

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
#### grupuri
    - creare grup
    - stergere grup
    - trimitere invititatie
    - join group
    - leave group
    - lista cu membrii si group roles
    - pagina pentru grup cu postarile grupului
    - group chat
#### dashboard admin:
   - postari raportate
   - conturi raportate
   - statistici activitate

#### imagine in docker
#### containerizare kubernetes - imi trebuie?nu am server dar e bun pentru cunostinte

### DE IMBUNATATIT
- cand se sterge o postare sa se stearga si imaginea din bucket
- de scos partea de story-uri, se renunta la idee, pe linkedin nu sunt story-uri
- de scos partea de feed de pe home page, exista deja postari acasa
- cand se creeaza o postare, sa se aleaga partea din imagine care sa apara si in postare, rezolutia imaginii din postare sa coincida cu ce s-a ales
- pe ios sa se afiseze dialog ca pe web, nu alerte