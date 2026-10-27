# Héberger le frontend et l'API sur Vercel

Le dépôt contient deux applications : le frontend Vite à la racine et l'API NestJS dans `backend/`. Vercel peut héberger les deux depuis le même dépôt avec deux projets Vercel distincts. L'API NestJS devient une fonction Vercel ; elle n'utilise donc pas un serveur qui tourne en continu.

Vercel ne fournit pas de base MySQL persistante. Une base distante est nécessaire. Pour commencer sans frais, ce guide utilise TiDB Cloud Starter, compatible avec le protocole MySQL dans les limites de son quota gratuit. TiDB exige TLS sur son endpoint public ; `MYSQL_SSL=true` l'active dans le backend.

> Le forfait Vercel Hobby est réservé à un usage personnel et non commercial. Si MAK'ART est utilisé pour l'activité réelle de l'atelier, vérifier le forfait et les conditions Vercel avant la mise en production. Voir [les conditions du forfait Hobby](https://vercel.com/docs/plans/hobby).

## 1. Créer une base MySQL compatible

1. Créer une instance TiDB Cloud Starter et sélectionner le mode **MySQL-compatible**.
2. Créer une base de destination vide, puis relever depuis **Connect** le nom d'hôte, le port, le nom de base, l'utilisateur, le mot de passe et le certificat CA. Ne pas publier ces identifiants.
3. Vérifier que la taille de la base tient dans le quota gratuit et garder la limite de dépense à zéro. Le quota MySQL-compatible annoncé est de 5 Gio de données ligne, 5 Gio de données colonne et 50 millions d'unités de requête par mois ; lorsque le quota est atteint, TiDB peut refuser les nouvelles connexions jusqu'à sa réinitialisation ou une augmentation de limite ([quotas TiDB](https://docs.pingcap.com/tidbcloud/select-cluster-tier/)).

TiDB prend en charge la majorité du protocole et de la syntaxe MySQL 5.7/8.0, mais certaines différences existent ([compatibilité MySQL](https://docs.pingcap.com/tidbcloud/mysql-compatibility/)). Il ne faut pas appliquer les migrations sur cette base vide avant d'y importer la sauvegarde : la sauvegarde contient déjà le schéma et l'historique des migrations de la base actuelle.

## 2. Transférer la base locale sans perdre les données

Cette procédure copie la base applicative complète, y compris les comptes, les mots de passe hachés, les données ERP et la table TypeORM des migrations. Elle ne copie pas les utilisateurs système MySQL.

1. Prévoir une courte période sans saisie dans l'application pendant la copie. Garder la base locale intacte et enregistrer le fichier SQL de sauvegarde hors du dépôt Git, dans un emplacement privé avec assez d'espace disque.
2. Avec le client MySQL installé, exporter la base locale. Pour la configuration Docker Compose fournie ici, l'hôte et le port par défaut sont `127.0.0.1` et `3307`, et la base est `makart`. Ajuster les paramètres si la base locale utilise une autre adresse. Exécuter la commande depuis un dossier privé hors du dépôt. `--password` demande le mot de passe sans l'inscrire dans la commande :

```bash
mysqldump --host=127.0.0.1 --port=3307 --user=UTILISATEUR_LOCAL --password --single-transaction --quick --hex-blob --skip-triggers makart > makart-backup.sql
```

3. Importer le fichier dans la base TiDB vide avec les paramètres et le certificat de la page **Connect**. Utiliser une version du client MySQL qui accepte `--ssl-mode=VERIFY_IDENTITY` ([guide d'import CLI TiDB](https://docs.pingcap.com/tidbcloud/import-with-mysql-cli-serverless/)). Le mot de passe est demandé de façon interactive :

```bash
mysql --host=HOTE_TIDB --port=4000 --user=UTILISATEUR_TIDB --password --database=BASE_TIDB --ssl-mode=VERIFY_IDENTITY --ssl-ca=CHEMIN_CERTIFICAT_CA < makart-backup.sql
```

Remplacer les valeurs en majuscules par les paramètres réels avant d'exécuter les commandes. Ne pas mettre le mot de passe après `--password` ; le client le demande sans l'ajouter à l'historique du terminal.

4. Si l'import s'arrête sur une erreur, ne pas lancer les migrations et ne pas basculer le site. Conserver le dump, relever l'erreur et corriger la compatibilité avant de recommencer sur une base TiDB vide.
5. Comparer les tables et les volumes de lignes de la base source et de la destination, puis vérifier au minimum la connexion d'un compte existant, les clients, les produits, les commandes, le stock et les factures. Ne supprimer ni la base locale ni le dump après cette première vérification.
6. Après l'import réussi, appliquer uniquement les migrations encore en attente, comme décrit à l'étape 4 ci-dessous. Le registre de migrations transféré permet à TypeORM de reconnaître celles déjà exécutées.

## 3. Recréer le projet frontend Vercel

1. Dans Vercel, choisir **Add New → Project**, puis importer le dépôt GitHub.
2. Garder **Root Directory** à la racine du dépôt. Choisir Vite, avec `npm run build` comme commande et `dist` comme dossier de sortie.
3. Déployer l'interface et relever son domaine Vercel, par exemple `https://zo-print.vercel.app`. Elle affichera un message d'API non configurée jusqu'à l'étape 4.

## 4. Déployer l'API NestJS sur Vercel

1. Dans Vercel, choisir **Add New → Project** et importer une deuxième fois le même dépôt.
2. Définir **Root Directory** à `backend`. Vercel détecte NestJS depuis `src/main.ts` et déploie l'API comme une fonction.
3. Dans **Settings → Environment Variables**, ajouter ces variables pour **Production** :

```env
NODE_ENV=production
API_PREFIX=api/v1
FRONTEND_ORIGINS=https://<domaine-frontend-vercel>
RESET_PASSWORD_URL=https://<domaine-frontend-vercel>/reinitialiser-mot-de-passe
MYSQL_HOST=<hote-fourni-par-tidb>
MYSQL_PORT=<port-fourni-par-tidb>
MYSQL_DATABASE=<base-fourni-par-tidb>
MYSQL_USER=<utilisateur-fourni-par-tidb>
MYSQL_PASSWORD=<mot-de-passe-fourni-par-tidb>
MYSQL_SSL=true
MYSQL_CONNECTION_LIMIT=3
JWT_ACCESS_SECRET=<secret-aleatoire-long-et-unique>
JWT_REFRESH_SECRET=<autre-secret-aleatoire-long-et-unique>
SMTP_ENABLED=false
```

Remplacer les valeurs entre chevrons par celles fournies par Vercel ou TiDB. Générer les deux secrets avec `openssl rand -hex 32`, en exécutant la commande deux fois. Les saisir dans Vercel uniquement ; ne pas les enregistrer dans Git ou dans les variables Vite.

4. Dans `backend/.env` local, renseigner les paramètres TiDB (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`), `MYSQL_SSL=true` et les autres variables requises. Depuis `backend/`, lancer `npm run migration:run` pour appliquer les migrations en attente sur la base importée. Ne pas lancer `migration:revert` et ne pas vider la base.

5. Une fois les données et migrations vérifiées, déployer le projet API. Ouvrir ensuite `https://<domaine-api-vercel>/api/v1/health`. La réponse doit contenir `"status":"ok"`.

6. Dans les variables du projet frontend, ajouter `VITE_API_URL` pour **Production** et, si utilisé, **Preview** :

```env
VITE_API_URL=https://<domaine-api-vercel>/api/v1
```

7. Vérifier que `FRONTEND_ORIGINS` dans le projet API correspond exactement au domaine du frontend, puis redéployer les deux projets. L'URL de l'API est publique ; aucun secret ne doit commencer par `VITE_`.

## Courriels de récupération et devis

Avec `SMTP_ENABLED=false`, la connexion et l'ERP peuvent fonctionner, mais les courriels de réinitialisation et de devis ne sont pas envoyés. Pour les activer, ajouter au projet API `SMTP_ENABLED=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM` avec les identifiants du fournisseur de courriel. Les identifiants SMTP actuels ne sont pas fournis dans ce dépôt ; le bouton d'envoi de devis signalera cette configuration manquante.

## Diagnostic

- **« L'API n'est pas configurée »** : vérifier `VITE_API_URL` sur le projet frontend, puis redéployer le frontend.
- **Erreur CORS** : `FRONTEND_ORIGINS` doit correspondre exactement au domaine du frontend, avec `https://` et sans chemin.
- **Erreur de connexion à la base** : vérifier les informations TiDB, `MYSQL_SSL=true` et `MYSQL_CONNECTION_LIMIT=3`.
- **Erreur de validation des variables au démarrage** : `MYSQL_HOST` doit être un nom d'hôte sans protocole ni port, `MYSQL_PORT` un nombre (`4000` pour TiDB Cloud), `MYSQL_SSL` le booléen `true`, et `RESET_PASSWORD_URL` une URL HTTP(S) complète. Vérifier aussi que les champs sensibles ne sont pas vides. La confirmation `Added Environment Variable` confirme l'enregistrement de la variable, pas la validité de sa valeur ; redéployer après toute modification.
- **La commande de migration tente `127.0.0.1:3307`** : `backend/.env` pointe encore sur MySQL local. Remplacer localement `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` par les valeurs TiDB et mettre `MYSQL_SSL=true`, puis lancer `npm run migration:run` depuis `backend/`.
- **Erreur de table manquante** : vérifier d'abord que le dump a été importé dans la bonne base, puis exécuter `npm run migration:run` depuis `backend/` avec les variables de la base distante. Une migration ne restaure pas les lignes de données.
- **Erreur de clé étrangère TiDB « columns are incompatible »** : vérifier les types exportés. Dans le dump utilisé pour cet import, `users.id` est `VARCHAR(36)` et quatre colonnes qui le référencent sont `CHAR(36)` (`notification_preferences.user_id`, `notification_reads.user_id`, `user_profiles.user_id`, `purchase_receipts.actor_id`). Aligner ces colonnes sur `VARCHAR(36)` dans une copie du dump, garder l'original, puis réimporter la copie dans la base cible avant d'exécuter les migrations en attente.
- Ne pas utiliser `localhost` pour l'API ou MySQL dans les variables de déploiement : sur Vercel, cette adresse désignerait l'environnement de la fonction, pas l'ordinateur local.

## Limites de l'hébergement serverless

Vercel exécute l'API dans une fonction sans état durable. Les fichiers locaux ne conviennent pas au stockage permanent ; la photo de profil de cette application est stockée en base. Les pools MySQL sont limités par `MYSQL_CONNECTION_LIMIT` pour réduire les connexions ouvertes lors des démarrages simultanés de fonctions.

Les limites de calcul et de durée d'exécution dépendent du forfait Vercel. Vérifier les quotas actuels avant un usage professionnel ou avec beaucoup de requêtes.
