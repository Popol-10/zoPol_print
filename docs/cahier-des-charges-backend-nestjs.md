# Cahier des charges — Backend MAK'ART

**Version :** 1.0  
**Date :** 17 septembre 2026  
**Stack imposée :** NestJS + TypeScript  
**Application concernée :** ERP de gestion d'un atelier de personnalisation / production (DTF, laser, presse à chaud).

---

## 1. Objet du projet

Le frontend actuel de MAK'ART est une démonstration React qui conserve ses données dans des états locaux et des jeux de données mockés. Le backend doit fournir une API sécurisée et persistante afin de gérer l'activité réelle de l'atelier : commerce, production, stock, achats, finance, personnel, machines et reporting.

L'objectif est de remplacer les données locales par une API REST versionnée, documentée et testée, tout en garantissant la cohérence des données transverses. Par exemple, une réception fournisseur augmente le stock, une consommation de production le diminue, et un paiement client met à jour l'encours et la trésorerie.

### Hypothèses de périmètre

- La V1 sert une entreprise / atelier. Le modèle doit toutefois contenir `organization_id` afin de permettre le multi-entreprise ultérieurement sans migration majeure.
- La devise par défaut est l'ariary malgache (`MGA`, affiché `Ar`) et tous les montants sont stockés en entiers (pas de flottants).
- Le backend ne calcule jamais une information critique uniquement dans le navigateur : prix, totaux, stock, solde et droits sont contrôlés côté serveur.
- Les intégrations comptables officielles, bancaires, Mobile Money, Booking/Airbnb et les documents fiscaux certifiés sont hors V1, mais des points d'extension sont prévus.

---

## 2. Utilisateurs et droits

L'authentification est obligatoire pour toutes les routes métier. Le système comporte les rôles suivants ; un utilisateur peut posséder plusieurs rôles.

| Rôle | Accès principal |
| --- | --- |
| `ADMIN` | Paramétrage, utilisateurs, tous les modules et annulations exceptionnelles. |
| `COMMERCIAL` | Clients, produits, devis, commandes, factures et paiements clients. |
| `PRODUCTION_MANAGER` | Planning, ordres de fabrication, contrôle qualité et machines. |
| `OPERATOR` | Tâches de production attribuées et relevés de production. |
| `STOCK_MANAGER` | Articles, mouvements, inventaires, fournisseurs, réceptions et achats. |
| `ACCOUNTANT` | Comptes financiers, transactions, encaissements, dépenses, exports et rapports financiers. |
| `HR_MANAGER` | Employés, présences, tâches RH et rémunérations. |
| `VIEWER` | Consultation des données autorisées, sans écriture. |

Les permissions seront contrôlées par des guards NestJS (`JwtAuthGuard` et `RolesGuard`), au niveau des contrôleurs et, si nécessaire, des services. Toute création, modification, suppression, changement de statut, mouvement de stock et écriture financière doit être auditée.

---

## 3. Périmètre fonctionnel

### 3.1 Socle commun — priorité P0

- Connexion, renouvellement de session, déconnexion et récupération de mot de passe.
- Gestion des utilisateurs, rôles et profil connecté.
- Gestion de l'organisation : nom commercial, adresse, devise, fuseau horaire, préférences et seuils d'alertes.
- Recherche, filtres, tri, pagination serveur et exports asynchrones.
- Pièces jointes (bon de commande, facture, photo de contrôle, etc.) avec accès protégé.
- Journal d'audit et centre de notifications.

### 3.2 Commerce — priorité P0

#### Clients

- Créer, consulter, modifier, archiver et rechercher un client.
- Gérer les types `PARTICULAR`, `COMPANY` et `RESELLER`.
- Conserver les coordonnées, ville, notes et éventuels contacts secondaires d'entreprise.
- Afficher les commandes, factures, paiements, chiffre d'affaires et encours du client.
- Ne jamais supprimer physiquement un client ayant un document commercial ; l'archiver.

#### Catalogue de produits

- Gérer les produits finis vendus : référence unique, nom, catégorie, prix de vente, coût prévisionnel, unité, poste/machine et durée de production estimée.
- Catégories initiales : `DTF`, `TEXTILE`, `LASER`, `ACRYLIC`, `WOOD`, `PERSONALIZATION`, `ACCESSORIES`.
- Gérer les articles internes (film, encres, poudres, supports, emballages) indépendamment du catalogue vendu.
- Prévoir une nomenclature (`BOM`) facultative : quantité de chaque article interne consommée pour produire une unité d'un produit fini.
- Le prix historique d'une ligne de commande ne doit pas changer lorsqu'un produit est modifié ultérieurement.

#### Devis, commandes, ventes et factures

- Créer un devis brouillon contenant une ou plusieurs lignes, quantités, prix unitaires, remises, taxes éventuelles, validité et notes.
- Envoyer, accepter, refuser, expirer et convertir un devis accepté en commande.
- Créer une commande directement, avec échéance, priorité, lignes, acompte éventuel, opérateur/poste prévu et instructions.
- Suivre le statut des commandes :
  `NEW` → `CONFIRMED` → `TO_PRODUCE` → `IN_PRODUCTION` → `QUALITY_CONTROL` → `READY` → `DELIVERED` → `COMPLETED`.
  États exceptionnels : `ON_HOLD`, `BLOCKED`, `CANCELLED`.
- Enregistrer les livraisons/retraits et les ventes directes.
- Générer une facture numérotée à partir d'une commande ou d'une vente, et suivre les états `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`.
- Enregistrer des paiements partiels ou complets et calculer l'encours à partir des paiements validés, jamais à partir d'un champ modifiable manuellement.

### 3.3 Production et qualité — priorité P0

- Transformer une commande confirmée en un ou plusieurs ordres/tâches de production.
- Attribuer une tâche à une machine et à un opérateur, avec priorité, échéance, quantité attendue et instructions.
- Présenter un tableau de production par étapes : `TO_PRODUCE`, `IN_PROGRESS`, `QUALITY_CONTROL`, `DONE`.
- Enregistrer les relevés de production : date/heure, quantités conformes, rebutées, opérateur, durée, paramètres du poste, observations et pièces jointes éventuelles.
- Pour le DTF : surface imprimée, film, encre, poudre, déchets ; pour le laser : matériau, épaisseur, dimensions, découpe/gravure ; pour la presse : température, durée, pression ; les paramètres doivent être extensibles en JSON validé par type de poste.
- Enregistrer la décision de contrôle qualité : `PENDING`, `PASSED`, `REWORK`, `REJECTED`, avec contrôleur, motif, quantité et date.
- Déduire les composants de stock selon la nomenclature au démarrage ou à la validation de production, selon une règle de paramétrage. Toute déduction doit créer un mouvement de stock traçable.

### 3.4 Stock, inventaires et achats — priorité P0

#### Stock

- Gérer les articles de stock interne : référence, libellé, catégorie, unité, seuil minimum, coût unitaire moyen et statut calculé.
- Statuts calculés : `OUT_OF_STOCK` si quantité ≤ 0 ; `CRITICAL` si quantité < 60 % du minimum ; `LOW` si quantité < minimum ; `IN_STOCK` sinon.
- Enregistrer des mouvements immuables : entrée, sortie, ajustement positif/négatif, consommation de production, réception, transfert et annulation compensatrice.
- Chaque mouvement comporte article, quantité signée, coût unitaire, motif, source/destination, référence externe, note, auteur et date.
- Interdire le stock négatif en V1, sauf permission explicite `ALLOW_NEGATIVE_STOCK` définie au niveau de l'organisation. Les mises à jour de quantité doivent être transactionnelles et verrouillées pour éviter les doubles consommations.
- Calculer la valeur du stock selon une méthode choisie et documentée. Recommandation V1 : coût moyen pondéré.

#### Inventaires

- Créer une campagne d'inventaire (`DRAFT`, `IN_PROGRESS`, `VALIDATED`, `CANCELLED`).
- Figer le stock théorique au démarrage, saisir les quantités comptées, justifier les écarts et valider les ajustements en un seul traitement transactionnel.
- Conserver le rapport d'écarts et l'auteur de chaque comptage.

#### Fournisseurs et achats

- Gérer les fournisseurs, leurs contacts, catégories, notes, conditions et encours.
- Créer des commandes fournisseurs avec lignes, coûts attendus, échéance et statuts `DRAFT`, `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`.
- Enregistrer des réceptions partielles ou complètes ; chaque réception validée crée les mouvements d'entrée de stock correspondants et met à jour le coût moyen.
- Suivre les factures fournisseurs et paiements si le module finance est activé.

### 3.5 Finance — priorité P0

- Gérer les comptes `CASH`, `BANK` et `MOBILE_MONEY`, avec solde calculé et période de rapprochement.
- Enregistrer les transactions de trésorerie de type `INCOME`, `EXPENSE` et `TRANSFER`, avec date, montant, catégorie, compte, bénéficiaire/tiers, justificatif et référence.
- Catégories initiales : vente, acompte client, autre revenu, achats, frais généraux, logistique, maintenance, paie ; elles doivent être paramétrables.
- Lier automatiquement un paiement client à une transaction de trésorerie et à une facture/commande. Lier de la même façon un paiement fournisseur lorsqu'il existe.
- Les écritures liées ne sont pas supprimables ; une correction se fait par annulation ou écriture inverse, avec justification et audit.
- Proposer les vues caisse, banque, revenus, dépenses, charges et dashboard financier. La saisie manuelle d'une transaction doit rester possible pour les opérations hors documents.
- Prévoir un statut de rapprochement bancaire : `UNRECONCILED`, `RECONCILED`, `VOID`.

### 3.6 Personnel et machines — priorité P1

#### Personnel

- Gérer les employés : identité, poste, contrat, salaire mensuel, statut actif/inactif et coordonnées sensibles protégées.
- Enregistrer les présences (`PRESENT`, `ABSENT`, `LATE`, `LEAVE`), heures d'arrivée/départ et temps travaillé par jour.
- Créer et attribuer des tâches internes, avec état, échéance, consignes et éventuel lien à une commande.
- Préparer les données de rémunération (période, brut, primes, retenues, net, état `DRAFT`/`VALIDATED`/`PAID`) ; le calcul légal de paie et la déclaration sociale sont hors V1 à confirmer.

#### Machines et maintenance

- Gérer le parc : nom, type, état `ACTIVE`, `MAINTENANCE`, `OFFLINE`, `ATTENTION`, date de mise en service et critères de maintenance.
- Enregistrer les compteurs d'utilisation (heures, cycles, surface, jobs selon le poste) et les incidents.
- Planifier et suivre les maintenances préventives/correctives : type, échéance, responsable, intervention, coût, résultat, immobilisation et prochaine échéance.
- Une machine indisponible ne peut pas recevoir une nouvelle tâche de production sans dérogation administrateur.

### 3.7 Tableaux de bord, statistiques et rapports — priorité P1

- Produire des indicateurs filtrables par période, machine, opérateur, produit, client et catégorie.
- Dashboard opérationnel : commandes à surveiller, tâches par étape, charge par machine, ruptures/stock faible et notifications.
- Dashboard financier : revenus, dépenses, résultat, solde par compte et créances clients.
- Statistiques : ventes, marges, meilleures références, rentabilité par catégorie/produit/client/machine, production, qualité et personnel.
- Générer des rapports CSV et XLSX en V1 ; PDF en P1. Les exports lourds sont réalisés en tâche asynchrone et téléchargeables pendant une durée limitée.

---

## 4. Règles métier critiques

1. **Montants et dates.** Les montants sont des entiers positifs en `MGA` (ex. `35000`), les dates sont des ISO 8601 avec fuseau de l'organisation. Les montants négatifs sont réservés aux écritures techniques compensatrices.
2. **Numérotation.** Les références (`DEV-`, `CMD-`, `FAC-`, `PO-`, `REC-`, etc.) sont attribuées côté serveur, uniques par organisation et non réutilisées. Les UUID internes ne sont pas exposés comme seule référence métier dans l'interface.
3. **Détermination des totaux.** Le serveur recalcule sous-total, remise, taxes et total depuis les lignes reçues. Il ignore tout total client divergent.
4. **Conversion d'un devis.** La conversion est idempotente : plusieurs clics ou requêtes répétées ne peuvent produire qu'une seule commande liée au devis.
5. **Transitions.** Les changements de statut sont validés par une machine à états. Un état terminal (`CANCELLED`, `COMPLETED`) ne peut être modifié que selon une procédure d'annulation/réouverture auditée.
6. **Paiements.** La somme des paiements validés ne peut pas dépasser le total du document sans règle explicite de trop-perçu. Le statut de paiement est calculé.
7. **Stock.** Le solde d'un article provient de son stock initial et de la somme de ses mouvements ; aucune mise à jour directe de quantité n'est admise. Les corrections créent un mouvement d'ajustement.
8. **Réception.** Une réception ne peut être validée qu'une fois ; une réception partielle ne clôture une commande fournisseur que si toutes ses lignes sont reçues ou annulées.
9. **Production.** Une quantité déclarée conforme + rebutée ne peut pas dépasser la quantité de tâche sans autorisation du responsable de production. Le contrôle qualité porte sur des quantités traçables.
10. **Finance.** Toute transaction générée par un paiement, une réception ou une paie référence son objet source. La suppression est remplacée par un contre-mouvement.
11. **Archivage et audit.** Les documents commerciaux, mouvements de stock et transactions financières ne sont pas supprimés physiquement. Les données personnelles d'employés suivent une politique de conservation configurable.

---

## 5. Modèle de données fonctionnel

Les noms ci-dessous sont indicatifs ; les clés primaires peuvent être des UUID. Toutes les tables métier portent au minimum `id`, `organization_id`, `created_at`, `updated_at` et, pour les données sensibles, `created_by` / `updated_by`.

| Domaine | Entités principales | Données essentielles |
| --- | --- | --- |
| Identité | `organizations`, `users`, `roles`, `user_roles`, `sessions` | identité, email unique, mot de passe haché, état, préférences, rôles. |
| Paramétrage | `organization_settings`, `sequences`, `categories`, `tax_rates` | devise, timezone, alertes, numérotation, catégories et taxes. |
| CRM | `customers`, `customer_contacts` | identité, type, entreprise, téléphone, e-mail, ville, notes, archive. |
| Catalogue | `products`, `product_categories`, `product_recipes`, `product_recipe_items` | référence, prix, coût estimé, poste, durée, composants et quantités. |
| Vente | `quotes`, `quote_lines`, `sales_orders`, `sales_order_lines`, `deliveries`, `invoices`, `invoice_lines`, `payments` | numéros, statuts, snapshots de prix, échéances, remises, taxes, liens entre documents. |
| Production | `production_orders`, `production_tasks`, `production_records`, `quality_checks` | quantités, machine/opérateur, priorité, étapes, paramètres JSON, décision qualité. |
| Stock | `stock_items`, `stock_locations`, `stock_balances`, `stock_movements`, `inventory_counts`, `inventory_lines` | unité, seuil, coût moyen, quantité, raison, source, inventaire. |
| Achats | `suppliers`, `purchase_orders`, `purchase_order_lines`, `goods_receipts`, `goods_receipt_lines`, `supplier_invoices` | fournisseur, coûts, statuts, réceptions et encours. |
| Finance | `financial_accounts`, `financial_transactions`, `financial_transaction_links`, `reconciliations` | type, compte, catégorie, montant, statut de rapprochement, référence source. |
| RH | `employees`, `attendance_records`, `employee_tasks`, `payroll_runs`, `payroll_lines` | présence, horaires, performances, salaire, périodes de paie. |
| Machines | `machines`, `machine_usage_records`, `machine_incidents`, `maintenance_orders` | état, compteurs, incidents, interventions et échéances. |
| Transverse | `notifications`, `attachments`, `audit_logs`, `export_jobs` | destinataire, fichier, action/auteur/avant-après, statut d'export. |

### Relations minimales

```text
Client ──< Devis ──< Lignes devis
   │          │ conversion
   └──────< Commande ──< Lignes commande ──< Tâches production ──< Relevés / Contrôles qualité
                  │                   │
                  │                   └──────< Mouvements de stock >────── Article de stock
                  ├──────< Facture ──< Paiements ──< Transactions financières >──── Compte financier
                  └──────< Livraison

Fournisseur ──< Commande fournisseur ──< Réception ──< Mouvements de stock
Machine ──< Tâches production / Relevés d'utilisation / Incidents / Maintenances
Employé ──< Présences / Tâches / Relevés de production / Contrôles qualité
```

---

## 6. Contrat d'API REST (`/api/v1`)

### Conventions communes

- Format JSON, `Content-Type: application/json`, dates ISO 8601 UTC ou avec offset.
- Réponses de liste : `{ "data": [], "meta": { "page", "pageSize", "total", "totalPages" } }`.
- Paramètres communs : `page`, `pageSize` (maximum 100), `q`, `sortBy`, `sortOrder`, `from`, `to`, `status`.
- Erreurs NestJS normalisées : `{ "statusCode", "code", "message", "details", "traceId" }`.
- Les créations critiques acceptent un en-tête `Idempotency-Key` (conversion de devis, paiements, réception, mouvements, export).
- Les routes protégées exigent `Authorization: Bearer <access_token>`.

### Authentification et paramétrage

| Méthode | Route | Fonction |
| --- | --- | --- |
| `POST` | `/auth/login` | Connexion et émission des tokens. |
| `POST` | `/auth/refresh` | Renouvellement d'access token. |
| `POST` | `/auth/logout` | Révocation de session / refresh token. |
| `POST` | `/auth/forgot-password` | Demande de réinitialisation. |
| `POST` | `/auth/reset-password` | Réinitialisation avec jeton. |
| `GET/PATCH` | `/me` | Profil et préférences de l'utilisateur connecté. |
| `GET/POST/PATCH` | `/users`, `/users/:id` | Administration utilisateurs et rôles. |
| `GET/PATCH` | `/settings/organization` | Profil et préférences de l'atelier. |
| `GET/POST/PATCH` | `/settings/categories` | Catégories opérationnelles et financières. |

### Commerce

| Ressource | Routes requises |
| --- | --- |
| Clients | `GET/POST /customers`, `GET/PATCH /customers/:id`, `POST /customers/:id/archive`, `GET /customers/:id/summary`, `GET /customers/:id/orders`. |
| Produits | `GET/POST /products`, `GET/PATCH /products/:id`, `POST /products/:id/archive`, `GET/PUT /products/:id/recipe`. |
| Devis | `GET/POST /quotes`, `GET/PATCH /quotes/:id`, `POST /quotes/:id/send`, `POST /quotes/:id/accept`, `POST /quotes/:id/reject`, `POST /quotes/:id/convert-to-order`. |
| Commandes | `GET/POST /orders`, `GET/PATCH /orders/:id`, `GET /orders/:id`, `POST /orders/:id/status`, `POST /orders/:id/cancel`, `POST /orders/:id/deliver`. |
| Factures / paiements | `GET/POST /invoices`, `GET /invoices/:id`, `POST /invoices/:id/issue`, `POST /invoices/:id/cancel`, `POST /invoices/:id/payments`, `GET /payments`. |

### Production et machines

| Ressource | Routes requises |
| --- | --- |
| Planning et tâches | `GET /production/tasks`, `POST /production/tasks`, `GET/PATCH /production/tasks/:id`, `POST /production/tasks/:id/assign`, `POST /production/tasks/:id/transition`. |
| Relevés et qualité | `POST /production/tasks/:id/records`, `GET /production/records`, `POST /quality-checks`, `PATCH /quality-checks/:id`. |
| Machines | `GET/POST /machines`, `GET/PATCH /machines/:id`, `POST /machines/:id/usage-records`, `POST /machines/:id/incidents`. |
| Maintenance | `GET/POST /maintenance-orders`, `GET/PATCH /maintenance-orders/:id`, `POST /maintenance-orders/:id/complete`. |

### Stock et achats

| Ressource | Routes requises |
| --- | --- |
| Articles stock | `GET/POST /stock/items`, `GET/PATCH /stock/items/:id`, `GET /stock/items/:id/movements`, `GET /stock/alerts`. |
| Mouvements | `GET /stock/movements`, `POST /stock/movements`, `POST /stock/movements/:id/reverse`. |
| Inventaires | `GET/POST /inventories`, `GET /inventories/:id`, `PATCH /inventories/:id/lines/:lineId`, `POST /inventories/:id/start`, `POST /inventories/:id/validate`, `POST /inventories/:id/cancel`. |
| Fournisseurs | `GET/POST /suppliers`, `GET/PATCH /suppliers/:id`, `POST /suppliers/:id/archive`. |
| Commandes achats | `GET/POST /purchase-orders`, `GET/PATCH /purchase-orders/:id`, `POST /purchase-orders/:id/send`, `POST /purchase-orders/:id/cancel`. |
| Réceptions | `GET/POST /goods-receipts`, `GET /goods-receipts/:id`, `POST /goods-receipts/:id/validate`, `POST /goods-receipts/:id/cancel`. |

### Finance, RH, reporting et transverse

| Ressource | Routes requises |
| --- | --- |
| Comptes / finance | `GET/POST /finance/accounts`, `GET/PATCH /finance/accounts/:id`, `GET/POST /finance/transactions`, `GET /finance/dashboard`, `POST /finance/transactions/:id/reverse`, `POST /finance/reconciliations`. |
| Employés / RH | `GET/POST /employees`, `GET/PATCH /employees/:id`, `GET/POST /attendance`, `GET/POST /employee-tasks`, `GET/POST /payroll-runs`, `POST /payroll-runs/:id/validate`, `POST /payroll-runs/:id/pay`. |
| Insights | `GET /dashboard`, `GET /analytics/sales`, `GET /analytics/production`, `GET /analytics/stock`, `GET /analytics/finance`, `GET /analytics/profitability`. |
| Exports | `POST /exports`, `GET /exports`, `GET /exports/:id/download`. |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`. |
| Fichiers / audit | `POST /attachments`, `GET /attachments/:id/download`, `GET /audit-logs` (administrateur). |

### Exemple de création de commande

```json
POST /api/v1/orders
{
  "customerId": "uuid-client",
  "dueDate": "2026-09-24",
  "priority": "HIGH",
  "notes": "Valider le visuel avant production.",
  "lines": [
    {
      "productId": "uuid-produit",
      "quantity": 12,
      "unitPrice": 35000,
      "discountAmount": 0
    }
  ],
  "initialPayment": {
    "amount": 100000,
    "accountId": "uuid-caisse",
    "method": "CASH"
  }
}
```

Le serveur renvoie la commande, ses lignes avec prix figés, les montants recalculés et, si l'acompte est accepté, le paiement et la transaction financière liés.

---

## 7. Architecture technique demandée

### 7.1 Stack recommandée

- **Runtime :** Node.js LTS.
- **API :** NestJS et TypeScript strict.
- **Base de données :** PostgreSQL.
- **Accès aux données :** Prisma ORM (migrations versionnées) ; TypeORM est acceptable uniquement si validé avant démarrage.
- **Validation :** `class-validator` / `class-transformer` avec `ValidationPipe` globale, whitelist et interdiction des propriétés inconnues.
- **Authentification :** JWT court + refresh token stocké de façon sécurisée et révocable ; mots de passe hachés avec Argon2id.
- **Documentation :** Swagger / OpenAPI disponible hors production ou protégée en production.
- **Asynchrone :** Redis + BullMQ pour exports, e-mails, calculs différés et notifications planifiées.
- **Stockage de fichiers :** stockage objet compatible S3 (MinIO local accepté en développement), avec URLs signées.
- **Logs et observabilité :** logs JSON structurés, `traceId`, endpoint `/health`, métriques et suivi d'erreurs.
- **Conteneurisation :** Docker Compose pour API, PostgreSQL, Redis et MinIO en développement.

### 7.2 Découpage NestJS

```text
src/
  common/             # guards, decorators, filtres, interceptors, pagination
  config/             # validation des variables d'environnement
  auth/ users/ roles/ organizations/
  customers/ products/ quotes/ orders/ invoices/ payments/
  production/ quality/ machines/ maintenance/
  stock/ inventories/ suppliers/ purchases/ receipts/
  finance/ employees/ attendance/ payroll/
  analytics/ reports/ exports/ notifications/ attachments/ audit/
  database/            # Prisma, transactions et seeds de développement
```

Chaque module suit la séparation contrôleur → DTO → service → dépôt/ORM. Les services chargés d'une opération transversale (ex. réception, paiement, validation d'inventaire) orchestrent tous les effets dans une transaction PostgreSQL unique.

---

## 8. Sécurité, qualité et exploitation

### Sécurité

- HTTPS obligatoire en production, CORS limité aux domaines frontend autorisés et rate limiting sur les routes publiques.
- Secrets uniquement via variables d'environnement ou coffre de secrets ; jamais dans le dépôt.
- Hachage Argon2id, jetons de réinitialisation à usage unique et expiration courte.
- Chiffrement ou contrôle d'accès renforcé pour données RH, justificatifs et exports.
- Vérification d'autorisation sur l'organisation pour chaque ressource (`organization_id`) afin d'éviter toute fuite inter-tenant.
- Validation du type, poids et contenu des fichiers joints ; antivirus en production si disponible.

### Qualité

- Lint TypeScript, formatage et compilation stricte requis dans la CI.
- Tests unitaires des services et règles métier ; tests d'intégration sur PostgreSQL ; tests e2e des scénarios critiques.
- Contrat OpenAPI maintenu à jour et testé contre les DTO.
- Migrations testées en environnement de préproduction, avec sauvegarde avant migration de production.

### Exigences non fonctionnelles

| Sujet | Exigence V1 |
| --- | --- |
| Performance | 95 % des lectures courantes en moins de 500 ms hors réseau ; listes paginées et indexées. |
| Disponibilité | Redémarrage sans perte de transactions validées ; sauvegarde quotidienne de la base. |
| Traçabilité | Audit de toutes les écritures sensibles, avec auteur, horodatage, valeur avant/après et motif. |
| Fiabilité | Opérations stock/finance atomiques, idempotentes lorsque nécessaire et protégées contre les doubles envois. |
| Localisation | Interface et messages API en français ; timezone configurable, défaut `Indian/Antananarivo`. |
| Conservation | Politique documentée de sauvegarde, restauration et archivage ; exports temporaires supprimés automatiquement. |

---

## 9. Critères d'acceptation

Le backend sera accepté lorsque les scénarios suivants sont démontrés sur une base PostgreSQL vide puis avec données de test :

1. Un administrateur crée des utilisateurs, leur assigne un rôle, et une route non autorisée répond `403`.
2. Un commercial crée un client, un produit, un devis multiligne puis convertit le devis une seule fois en commande.
3. Une commande avec acompte génère un paiement et une transaction de caisse ; l'encours client, le solde de compte et le dashboard sont cohérents.
4. Une tâche de production peut passer uniquement par les étapes autorisées. Un relevé conforme peut faire avancer la quantité produite et consommer les composants définis.
5. Un contrôle qualité rejeté conserve la traçabilité et ne marque pas la commande comme prête.
6. Une réception fournisseur partielle crée une entrée de stock exacte, met à jour le coût moyen et ne peut pas être validée deux fois.
7. Un ajustement d'inventaire crée des mouvements plutôt que de modifier directement le stock ; les quantités et valeurs sont recalculées.
8. Une transaction financière liée à un paiement ne peut être supprimée ; une annulation crée une écriture de compensation auditée.
9. Les listes clients, produits, commandes, stock et transactions supportent recherche, filtres, tri et pagination serveur.
10. Les rapports de ventes, production, stock et finance retournent des chiffres provenant des données persistées, non de valeurs mockées.
11. Swagger expose toutes les routes, DTO, réponses d'erreur et mécanismes d'authentification.
12. Les tests e2e des flux commande → production → stock → paiement passent dans la CI.

---

## 10. Découpage de livraison proposé

| Lot | Contenu | Dépendances |
| --- | --- | --- |
| 0 — Fondation | NestJS, PostgreSQL, Prisma, Docker, CI, config, santé, Swagger, auth, rôles, audit. | Aucune |
| 1 — Référentiels | Organisation, utilisateurs, clients, catégories, produits, articles de stock, fournisseurs, machines. | Lot 0 |
| 2 — Commerce | Devis, commandes, lignes, statuts, factures, paiements client et vues CRM. | Lots 0–1 |
| 3 — Stock & achats | Mouvements, inventaires, commandes fournisseurs, réceptions et alertes. | Lots 1–2 |
| 4 — Production | Tâches, relevés, qualité, consommation de nomenclature et planning. | Lots 1–3 |
| 5 — Finance | Comptes, transactions, rapprochement, dashboard et encours. | Lots 2–3 |
| 6 — RH, machines, reporting | Présences, paie préparatoire, maintenance, analytics, exports et notifications. | Lots 1–5 |

Après chaque lot, le frontend remplace les sources mockées du module concerné par un client API typé généré ou maintenu à partir d'OpenAPI. Les états locaux ne doivent rester que pour l'UI (filtres, modales, thème), jamais comme source de vérité métier.

---

## 11. Points à décider avant développement

Ces décisions ne bloquent pas la rédaction du backend mais doivent être validées avant les modules correspondants :

1. Numérotation légale et format des factures à Madagascar, taxes applicables et besoin de facture pro forma.
2. Règle exacte de consommation de stock : à la création, au lancement ou à la validation de production ; gestion des rebuts et retours.
3. Méthode de valorisation à confirmer (coût moyen pondéré recommandé pour V1, ou FIFO).
4. Politique de stock négatif et processus de dérogation.
5. Processus de livraison : retrait, livraison interne, transporteur, preuve de livraison et frais.
6. Règles de paie et données RH qui peuvent légalement être stockées.
7. Moyens de paiement et éventuelles intégrations ultérieures (banque, MVola, Orange Money, Airtel Money).
8. Besoin réel de multi-entreprise / multi-site, entrepôts multiples et multi-devises.
9. Politique de sauvegarde, hébergement, durée de conservation et personnes habilitées à consulter les données sensibles.

