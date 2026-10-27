# MAK'ART API

Backend NestJS / TypeScript de l'ERP MAK'ART. La première brique livrée est l'authentification avec MySQL, JWT, refresh tokens, rôles et journal d'audit.

## Démarrage local

```bash
cd backend
cp .env.example .env
docker compose up -d mysql
npm install
npm run migration:run
npm run start:dev
```

L'API est alors disponible sur `http://localhost:3001/api/v1` et la documentation Swagger sur `http://localhost:3001/api/docs` en développement.

Le frontend et l'API peuvent être déployés sur Vercel depuis le même dépôt comme deux projets : le frontend utilise la racine du dépôt et l'API utilise `backend/`. Une base MySQL distante reste nécessaire. Suivre [`docs/vercel-deployment.md`](docs/vercel-deployment.md) pour configurer les domaines, les variables, TLS et les migrations.

## Commandes utiles

```bash
npm run lint
npm run test
npm run build
npm run migration:run
```

`synchronize` est volontairement désactivé : toute évolution du schéma MySQL passe par une migration versionnée.

## Authentification disponible

- `POST /auth/register` : crée l'organisation et son premier administrateur.
- `POST /auth/login` : renvoie un access token et un refresh token.
- La récupération par e-mail et l'envoi des devis sont configurés via SMTP : consultez `docs/email-setup.md`.
- `POST /auth/refresh` : renouvelle la paire de tokens.
- `POST /auth/logout` : invalide le refresh token courant.
- `GET /auth/me` : renvoie le profil connecté.
- `PATCH /auth/me` : modifie le prénom et le nom du compte connecté ; mise à jour auditée.
- `GET/PATCH /auth/me/profile` : consulte et met à jour les coordonnées personnelles du compte.
- `PUT/GET/DELETE /auth/me/profile/photo` : envoie, consulte ou supprime sa photo JPG/PNG (2 Mo max).
- `POST /auth/change-password` : modifie le mot de passe et invalide les sessions longues.
- `POST /auth/forgot-password` : demande un lien de réinitialisation sans divulguer l’existence du compte.
- `POST /auth/reset-password` : consomme un jeton à usage unique et définit le nouveau mot de passe.
- `GET /organizations/me/settings` : consulte les paramètres de l'organisation du compte connecté.
- `PUT /organizations/me/settings` : modifie le nom, l'adresse, la devise et le fuseau de l'organisation (ADMIN uniquement).
- `GET/PUT /notifications/preferences` : consulte et met à jour les alertes individuelles.
- `GET /purchases` et `POST /purchases` : consulte ou crée les commandes fournisseurs.
- `GET /purchases/receipts` et `POST /purchases/:id/receipts` : consulte ou enregistre les réceptions liées aux commandes.
- `GET /production/tasks`, `POST /production/tasks` et `PATCH /production/tasks/:id/schedule` : consulte les tâches, planifie une commande et enregistre les créneaux de production.

Les détails sont dans [docs/organizations-api.md](docs/organizations-api.md), [docs/production-api.md](docs/production-api.md), [docs/purchases-api.md](docs/purchases-api.md) et [docs/stock-api.md](docs/stock-api.md). Les étapes réalisées sont dans [docs/implementation-steps.md](docs/implementation-steps.md).

## Devis et factures

- `GET/POST /quotes`, `POST /quotes/:id/send`, `PATCH /quotes/:id/status` et `POST /quotes/:id/convert` : crée, envoie par SMTP, suit et convertit les devis en commandes.
- `GET /invoices`, `GET /invoices/eligible-orders` et `POST /invoices/from-order/:orderId` : consulte ou émet une facture depuis une commande.
- La migration `Invoices20261017010000` est appliquée à la base locale configurée ; exécuter `npm run migration:run` dans chaque nouvel environnement.
- Détails : [docs/invoices-api.md](docs/invoices-api.md).
