# Mettre en ligne MAK'ART avec Vercel et Railway

Vercel héberge actuellement l'interface React/Vite seulement. Il ne démarre ni l'API NestJS ni MySQL. La capture « L'API n'est pas configurée » est donc normale tant que l'API n'a pas été publiée et que `VITE_API_URL` ne contient pas son URL.

Le dépôt contient maintenant une configuration Railway pour construire `backend/` avec Docker, appliquer les migrations avant chaque déploiement et vérifier `/api/v1/health`.

## 1. Publier le code

Enregistrer et pousser les changements du dépôt sur GitHub. Le projet Railway devra accéder à ce même dépôt.

## 2. Créer la base et l'API dans Railway

1. Créer un projet Railway et ajouter un service MySQL. Garder la base privée au réseau du projet ; ne pas activer d'accès public pour MySQL.
2. Ajouter un service depuis le dépôt GitHub du projet.
3. Dans les paramètres du service API, définir **Root Directory** sur `/backend`. Railway détectera `Dockerfile` et `railway.json` dans ce répertoire.
4. Ajouter les variables d'environnement suivantes au service API :

```env
NODE_ENV=production
FRONTEND_ORIGINS=https://zo-print.vercel.app
RESET_PASSWORD_URL=https://zo-print.vercel.app/reinitialiser-mot-de-passe
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
JWT_ACCESS_SECRET=<secret aleatoire d'au moins 32 caracteres>
JWT_REFRESH_SECRET=<autre secret aleatoire d'au moins 32 caracteres>
SMTP_ENABLED=false
```

Remplacer `MySQL` dans les références Railway par le nom exact du service de base si nécessaire. Générer deux secrets différents dans un terminal avec `openssl rand -hex 32` (exécuter la commande deux fois), puis les saisir directement dans Railway ; ne pas les écrire dans Git ni dans le frontend. Railway fournit `PORT` à l'API. Les migrations compilées s'exécutent dans la commande de pré-déploiement.

5. Déployer l'API. Dans **Settings → Networking**, générer son domaine public. Ouvrir `https://<domaine-api>/api/v1/health` : la réponse attendue ressemble à `{"status":"ok",...}`.

Railway facture les ressources selon le plan choisi ; vérifier les tarifs et le moyen de paiement demandé avant de créer les services. Le plan Hobby est actuellement à 5 $/mois minimum, crédité sur l'usage, avec des frais supplémentaires si l'usage dépasse ce montant ([tarifs Railway](https://docs.railway.com/pricing/plans)).

## 3. Relier Vercel à l'API

Dans **Vercel → projet → Settings → Environment Variables**, ajouter `VITE_API_URL` pour **Production** (et **Preview** si nécessaire) :

```env
VITE_API_URL=https://<domaine-api>/api/v1
```

Utiliser le domaine HTTPS généré à l'étape précédente. Cette valeur est publique et ne doit contenir aucun secret. Enregistrer, puis lancer **Redeploy** pour reconstruire l'interface avec la variable.

## Récupération de mot de passe par e-mail

`SMTP_ENABLED=false` permet de démarrer sans configurer le courrier, mais aucun e-mail de réinitialisation ne sera envoyé. Pour activer cette fonction, fournir au service API `SMTP_ENABLED=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM` depuis un fournisseur SMTP. Conserver ces identifiants uniquement dans les variables Railway.

## Diagnostic

- **« L'API n'est pas configurée »** : `VITE_API_URL` manque dans l'environnement Vercel, n'a pas été sauvegardée, ou le dernier déploiement n'a pas été reconstruit.
- **« Impossible de joindre le serveur »** : vérifier que le domaine API répond en HTTPS sur `/api/v1/health`, que les migrations ont réussi et que `FRONTEND_ORIGINS` contient exactement `https://zo-print.vercel.app`.
- **Erreur de démarrage MySQL** : vérifier les cinq références `MYSQL_*` du service API et que les deux services sont dans le même projet/environnement Railway.
- Ne jamais mettre `localhost` dans `VITE_API_URL` ou comme hôte MySQL distant : `localhost` désignerait l'ordinateur de la personne qui visite le site.
