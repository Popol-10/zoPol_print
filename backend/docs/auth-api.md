# Contrat d'authentification

Toutes les routes sont préfixées par `/api/v1`. Les routes protégées exigent `Authorization: Bearer <accessToken>`.

## Inscription initiale

`POST /api/v1/auth/register`

```json
{
  "firstName": "Mamy",
  "lastName": "Rakoto",
  "email": "mamy@example.mg",
  "password": "MotDePasse2026",
  "organizationName": "MAK'ART"
}
```

Cette route crée une organisation et un premier utilisateur ayant le rôle `ADMIN`. Une adresse e-mail est unique dans l'application.

## Connexion et renouvellement

`POST /api/v1/auth/login` prend `email` et `password`. La réponse d'inscription et de connexion est :

```json
{
  "user": {
    "id": "uuid",
    "organizationId": "uuid",
    "firstName": "Mamy",
    "lastName": "Rakoto",
    "email": "mamy@example.mg",
    "status": "ACTIVE",
    "roles": ["ADMIN"]
  },
  "tokens": {
    "tokenType": "Bearer",
    "accessToken": "...",
    "refreshToken": "...",
    "accessTokenExpiresIn": 900
  }
}
```

`POST /api/v1/auth/refresh` prend `{ "refreshToken": "..." }`. Le refresh token est renouvelé à chaque appel : le client doit remplacer ses deux tokens par ceux de la réponse.

## Session et sécurité

- `GET /api/v1/auth/me` renvoie le profil du jeton courant.
- `PATCH /api/v1/auth/me` met à jour le prénom et le nom du compte connecté :

```json
{ "firstName": "Lova", "lastName": "Rakoto" }
```

L’adresse e-mail, l’organisation, le statut et les rôles restent en lecture seule depuis le profil. Chaque modification du nom est enregistrée dans `audit_logs`.

- `POST /api/v1/auth/logout` invalide le refresh token actuel et répond `204`.
- `POST /api/v1/auth/change-password` prend `currentPassword` et `newPassword`, puis invalide les sessions longues.
- Les mots de passe requièrent au moins 8 caractères, une minuscule, une majuscule et un chiffre.
- La réinitialisation est protégée contre l’énumération des comptes : `forgot-password` renvoie toujours `204`.
- Ne pas stocker le refresh token dans `localStorage` en production. Préférer un cookie HTTP-only, `Secure` et `SameSite` adapté quand le frontend et l'API sont déployés.

## Récupération de mot de passe

- `POST /api/v1/auth/forgot-password` prend `{ "email": "..." }` et répond toujours `204`, afin de ne jamais révéler si un compte existe.
- En développement, le lien est écrit dans les logs NestJS. En production, remplacez `PasswordResetDeliveryHook` par un adaptateur e-mail transactionnel avant de rendre cette fonction disponible.
- `POST /api/v1/auth/reset-password` prend `{ "token": "...", "newPassword": "..." }`. Le jeton est haché dans MySQL, expire après 30 minutes par défaut, ne peut être utilisé qu’une fois et invalide les sessions longues.

Le frontend fournit la modale de demande sur `/connexion` et l’écran `/reinitialiser-mot-de-passe?token=…`.

## Profil utilisateur complet

- `GET /api/v1/auth/me/profile` retourne le compte connecté, son organisation, ses rôles, son statut, ses dates d'inscription et de dernière connexion, ainsi que ses coordonnées personnelles.
- `PATCH /api/v1/auth/me/profile` met à jour le prénom, le nom, le téléphone, l'adresse, la date de naissance et la description. Les quatre derniers champs sont facultatifs et peuvent être envoyés à `null`. L'e-mail, l'organisation et les rôles ne sont pas modifiables depuis cette route.

```json
{
  "firstName": "Lova",
  "lastName": "Rakoto",
  "phone": "+261 34 12 345 67",
  "address": "Antananarivo, Madagascar",
  "birthDate": "1995-08-24",
  "about": "Responsable de production chez MAK'ART."
}
```

- `PUT /api/v1/auth/me/profile/photo` prend un fichier multipart nommé `photo`. Seuls les JPG/PNG de 2 Mo maximum sont acceptés ; le serveur vérifie aussi la signature du fichier.
- `GET /api/v1/auth/me/profile/photo` retourne la photo privée du compte connecté. `DELETE` sur cette route la supprime.
- Les coordonnées et l'image sont stockées dans `user_profiles`. La photo est servie par une route privée et n'est pas incluse dans les réponses JSON ordinaires.
- La migration `UserProfiles20261016000000` crée cette table. Exécuter `npm run migration:run` dans `backend/` après avoir démarré MySQL.

## Gestion des rôles

Ces routes sont réservées aux utilisateurs ayant le rôle `ADMIN`. Elles ne retournent et ne modifient que les membres de la même organisation.

- `GET /api/v1/users` liste les membres de l’atelier sans jamais exposer les hashes de mots de passe ou de refresh tokens.
- `PATCH /api/v1/users/:id/roles` prend un tableau non vide de rôles, par exemple :

```json
{ "roles": ["COMMERCIAL", "VIEWER"] }
```

Les rôles possibles sont `ADMIN`, `COMMERCIAL`, `PRODUCTION_MANAGER`, `OPERATOR`, `STOCK_MANAGER`, `ACCOUNTANT`, `HR_MANAGER` et `VIEWER`.

Le dernier administrateur ne peut pas perdre le rôle `ADMIN`. Chaque modification est enregistrée dans `audit_logs` avec l’événement `USER_ROLES_UPDATED`.

### Création d’un membre par un administrateur

`POST /api/v1/users` est également réservé aux administrateurs. Il crée un membre dans leur propre atelier avec les rôles choisis par l’administrateur :

```json
{
  "firstName": "Lova",
  "lastName": "Rasolo",
  "email": "lova.mg",
  "temporaryPassword": "Atelier2026",
  "roles": ["COMMERCIAL"]
}
```

Cette route n’est pas publique. Le mot de passe temporaire est haché avec Argon2 et doit être communiqué au membre par un canal sûr. La création est tracée par l’événement `USER_CREATED`.
