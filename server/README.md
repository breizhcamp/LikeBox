breizhcamp-vote - serveur
=========================

Création de la base de données
```
sqlite3 server_votes.db
CREATE TABLE votes(id integer primary key AUTOINCREMENT,sessionId integer, vote integer, timeStamp date)
```
