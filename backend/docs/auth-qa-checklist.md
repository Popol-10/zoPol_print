# Checklist de validation — Authentification

À exécuter après une installation complète des dépendances et une migration MySQL réussie.

## Préparation

```bash
cd backend
cp .env.example .env
docker compose up -d mysql
npm install
npm run migration:run
npm run lint
npm run test
npm run build
npm run start:dev
```

Le frontend utilise par défaut `http://localhost:3001/api/v1`. Pour une autre adresse, créer un fichier `.env` à la racine du frontend avec :

```bash
VITE_API_URL=http://localhost:3001/api/v1
```

## Scénarios API essentiels

1. `POST /api/v1/auth/register` avec un e-mail inédit crée une organisation, un utilisateur actif avec rôle `ADMIN`, puis renvoie les deux jetons.
2. Rejouer l'inscription avec le même e-mail renvoie `409` sans créer de seconde organisation.
3. `POST /api/v1/auth/login` avec un mauvais mot de passe renvoie `401`, sans indiquer lequel des deux identifiants est erroné.
4. `GET /api/v1/auth/me` avec l'access token renvoie le profil ; sans jeton, la réponse est `401`.
5. `POST /api/v1/auth/refresh` renouvelle les deux jetons. Rejouer l'ancien refresh token doit renvoyer `401` (rotation).
6. `POST /api/v1/auth/logout` invalide le refresh token ; un nouvel appel à `refresh` avec ce token doit échouer.
7. `POST /api/v1/auth/change-password` avec le bon mot de passe actuel retourne `204` et invalide les sessions longues.
8. `POST /api/v1/auth/forgot-password` renvoie toujours `204`, pour une adresse connue comme inconnue.
9. En environnement de développement, relever le lien de récupération dans le log NestJS. Il doit contenir un jeton de 64 caractères hexadécimaux.
10. `POST /api/v1/auth/reset-password` avec ce jeton et un mot de passe valide retourne `204`. Le même jeton doit ensuite échouer avec `401`.

## Vérifications MySQL

- La table `users` contient le hachage Argon2id, jamais le mot de passe en clair.
- La colonne `refresh_token_hash` contient seulement un hachage du refresh token.
- La table `password_reset_tokens` contient uniquement `token_hash` (SHA-256) : le jeton brut ne doit jamais apparaître dans MySQL.
- `audit_logs` enregistre les événements d'inscription, connexion, renouvellement, déconnexion, changement et réinitialisation de mot de passe.

## Vérifications interface

1. Aller sur `/dashboard` sans session redirige vers `/connexion`.
2. L'inscription depuis `/inscription` ouvre l'espace ERP après succès.
3. Les erreurs API sont présentées dans le formulaire, sans effacer l'e-mail saisi.
4. Le bouton « Mot de passe oublié ? » ouvre une modale, puis confirme sans divulguer l'existence du compte.
5. L'écran `/reinitialiser-mot-de-passe?token=…` impose la confirmation du nouveau mot de passe.
6. Le menu du profil connecté permet de changer le mot de passe et de se déconnecter.
