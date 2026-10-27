# Étapes réalisées — lot 1 : authentification

**Date :** 23 septembre 2026  
**Base de données :** MySQL 8  
**Statut :** implémenté dans le code, à installer et exécuter localement.

## 1. Initialisation du backend

- Création d'un projet NestJS isolé dans `backend/` pour ne pas mélanger l'API avec le frontend Vite existant.
- Configuration TypeScript stricte, scripts de build, lint, tests et migrations TypeORM.
- Ajout de Docker Compose pour MySQL 8 et d'un fichier `.env.example` sans secret réel.

## 2. Schéma MySQL et migrations

- Ajout des tables `organizations`, `users`, `password_reset_tokens` et `audit_logs` via la migration initiale versionnée.
- Aucun `synchronize: true` : le schéma est contrôlé exclusivement par migrations.
- Les mots de passe et refresh tokens ne sont jamais stockés en clair.

## 3. Authentification et autorisations

- Inscription initiale : création atomique d'une organisation et de son administrateur.
- Connexion par e-mail / mot de passe avec hachage Argon2id.
- Access token JWT court et refresh token JWT long, révocable et renouvelé à chaque rafraîchissement.
- Déconnexion et changement de mot de passe qui invalident le refresh token stocké.
- Récupération de mot de passe via un jeton aléatoire à usage unique, haché en base et expirant par défaut après 30 minutes.
- Guard JWT global, décorateur `@Public()`, décorateur `@CurrentUser()` et contrôle de rôles `@Roles()`.
- Rôles initiaux : administrateur, commercial, production, opérateur, stock, comptable, RH et lecture seule.

## 4. Hooks métier et audit

- `AuthLifecycleHooks` centralise les événements d'inscription, connexion, rafraîchissement, déconnexion et changement de mot de passe.
- Ces hooks alimentent le journal d'audit et constituent le point d'extension pour les futurs e-mails, notifications et événements métier.
- Les entités normalisent e-mail et slug avant insertion/mise à jour.

## 5. Sécurité et qualité

- Validation globale stricte des DTO, CORS configurable, Helmet, limitation de débit et réponses d'erreur normalisées.
- Swagger documente les routes d'authentification.
- Tests unitaires de base pour les fonctions pures d'authentification.

## 6. Étapes à exécuter par l'équipe

1. Copier `.env.example` vers `.env` et remplacer les deux secrets JWT.
2. Démarrer MySQL avec `docker compose up -d mysql`.
3. Lancer `npm install`, puis `npm run migration:run`.
4. Lancer `npm run lint && npm run test && npm run build`.
5. Démarrer l'API avec `npm run start:dev`, créer le premier compte via Swagger ou `POST /auth/register`.

## 7. Suite recommandée

- Ajouter la vérification d'e-mail et la réinitialisation de mot de passe avec un fournisseur d'e-mail réel.
- Ajouter la gestion administrateur des comptes et la révocation de toutes les sessions.
- Remplacer les données mockées du frontend par un client API typé, en commençant par l'écran profil/session.
- Implémenter ensuite les référentiels : clients, produits, articles de stock et fournisseurs.

## 8. Intégration frontend

- Écrans ajoutés : connexion, inscription et réinitialisation de mot de passe.
- Routes ERP protégées avec `ProtectedRoute`; routes d’authentification réservées aux visiteurs avec `PublicOnlyRoute`.
- `AuthProvider` et `useAuth` centralisent restauration de session, rotation du refresh token, déconnexion et changement de mot de passe.
- La barre utilisateur affiche le compte connecté et propose les modales de déconnexion / changement de mot de passe.
- La compilation frontend `npm run build` a réussi le 23 septembre 2026.

## 9. Validation backend à terminer

L’installation npm du dossier `backend/` a été interrompue par l’environnement avant la création du lockfile. À exécuter localement : `npm install`, `npm run lint`, `npm run test`, `npm run build`, puis `npm run migration:run`.

## Gestion des rôles (24 septembre 2026)

- Ajout des endpoints administrateur de liste des membres et de mise à jour des rôles.
- Isolation organisationnelle : un administrateur ne peut agir que sur les utilisateurs de son atelier.
- Protection du dernier administrateur et traçabilité `USER_ROLES_UPDATED`.
- Ajout de la migration `AddUserRoleAuditEvent20260924000000`, appliquée localement.
- Ajout de l’écran `/utilisateurs`, visible uniquement pour les administrateurs.
- L’administrateur crée les membres de son atelier, choisit leurs rôles et définit un mot de passe temporaire ; aucun rôle n’est sélectionnable sur l’écran de connexion.
- Ajout de la migration de réparation `ReconcileUserRolesColumn20260924020000` pour les bases existantes qui n’avaient pas encore la colonne `users.roles`.

## Suivi de l'intégration ERP — mise à jour le 17 octobre 2026

- Les modules Clients, Produits et Fournisseurs sont raccordés à leurs écrans ERP et leurs migrations sont appliquées.
- Le module Stock dispose de ses entités, routes, validations, audit, écran connecté et migration `Stock20260926030000`, appliquée et vérifiée le 26 septembre 2026.
- Les entrées, sorties et ajustements gardent un historique ; les écritures de quantité et de mouvement sont transactionnelles.
- Les modals et panneaux sont rendus dans le portail du document pour rester ancrés à la fenêtre ; le focus clavier reste confiné et revient au contrôle déclencheur à la fermeture.
- Le module Commandes dispose de ses routes, validations, audit, écran connecté et migration `Orders20260928000000`, appliquée le 28 septembre 2026.
- Le module Production est raccordé aux commandes : planification, affectation par référence Employé, suivi des étapes et mise à jour transactionnelle du statut Commandes. Migration `Production20260928010000` appliquée le 28 septembre 2026.
- Le planning réserve maintenant des créneaux date/heure, avec détection des chevauchements machine/opérateur, audit et édition depuis `/planning`. Migration `ProductionSchedule20261017020000` appliquée et vérifiée le 17 octobre 2026 ; 28 migrations sont enregistrées sur la base configurée.
- Les écrans Production, DTF, laser, presse et qualité lisent désormais les tâches persistées ; les indicateurs fictifs de capacité et de consommation ont été retirés.
- Le module Machines et maintenance est raccordé ; la migration `Machines20260929000000` a été appliquée et vérifiée le 29 septembre 2026. Les Produits choisissent maintenant une machine enregistrée.
- Le module Employés fournit désormais un annuaire API isolé par organisation, avec création, modification et archivage réservés à ADMIN et HR_MANAGER. Migration `Employees20260929010000` appliquée et vérifiée le 29 septembre 2026. L’annuaire ne contient pas de données de paie.
- Le module Présences est raccordé à l’annuaire : pointages quotidiens, consultation par date, durée calculée, journalisation et accès ADMIN/HR_MANAGER. Migration `Attendance20260930000000` appliquée et vérifiée le 30 septembre 2026.
- Les tâches Production référencent maintenant un Employé actif ; migration `ProductionEmployee20260930010000` appliquée et vérifiée le 30 septembre 2026.
- La page `/taches` est raccordée au nouveau module de tâches RH : liste, création, affectation, modification du statut et archivage. Migration `HrTasks20260930020000` appliquée et vérifiée le 30 septembre 2026 ; quinze migrations sont exécutées.

- Le registre Rémunération est connecté, séparé de l’annuaire Employés et réservé à ADMIN/HR_MANAGER ; migration PayrollCompensation20261001000000 appliquée et vérifiée le 1er octobre 2026.
- Le registre Finance couvre les entrées, dépenses, soldes initiaux, soldes de comptes et série mensuelle ; accès ADMIN/ACCOUNTANT.
- La réception des paiements client est reliée aux commandes. L’écriture Finance et la mise à jour du solde dû sont atomiques et auditées ; ADMIN, ACCOUNTANT et COMMERCIAL peuvent enregistrer ces paiements.
- Migration `FinanceTransactions20261001010000` et migration `LinkedOrderPayments20261001020000` appliquées et vérifiées le 1er octobre 2026 (18 migrations).
- Les anciens montants `paidAmount` restent inchangés ; aucun encaissement historique n’est créé artificiellement.
- Les transferts Caisse/Banque/Mobile Money sont inscrits par deux mouvements équilibrés dans une transaction ; le solde global reste inchangé et revenus/dépenses ne sont pas affectés.
- Migration `FinanceTransfers20261001030000` appliquée et vérifiée le 1er octobre 2026 (19 migrations).
- Les rapprochements bancaires contrôlent les soldes d’ouverture/clôture, le pointage de chaque mouvement et l’écart final. Les périodes clôturées refusent les écritures rétroactives ; l’import des relevés n’est pas inclus.
- Migration `BankReconciliation20261001040000` appliquée et vérifiée le 1er octobre 2026 (20 migrations).
- Le Dashboard agrège les données persistées de Finance, Commandes, Production et Stock ; les montants Finance sont limités aux rôles autorisés. Aucun changement de schéma n’est requis.
- Les pages Statistiques et Rapports utilisent les agrégats métier. Les fichiers CSV sont générés depuis les données API ; PDF/XLSX côté serveur ne sont pas inclus.

- Le module Devis est raccordé à une API isolée par organisation : création liée au catalogue, statuts contrôlés, audit et conversion transactionnelle en commande au prix convenu. Migration `Quotes20261002000000` appliquée et vérifiée le 2 octobre 2026 : vingt-et-une migrations exécutées. Consulter `quotes-api.md`.
- La page `/devis` utilise maintenant l’API pour la liste, la recherche, les filtres, les indicateurs, les transitions et la conversion en commande. L’envoi d’e-mail reste hors périmètre.

- La page `/mouvements` utilise le nouvel endpoint paginé `GET /stock/movements`, avec recherche et filtres. La création garde le formulaire Stock existant et ses droits ; aucun changement de schéma n'est requis. Voir `stock-api.md`.
- La page `/inventaire` utilise les articles API et permet de saisir les quantités physiques. `POST /stock/items/:id/count` calcule l'écart et inscrit un ajustement atomique dans l'historique Stock, y compris lorsque l'écart est nul. Aucun changement de schéma n'est requis ; voir `stock-api.md`.
- La page `/ventes` lit les commandes via `GET /orders`, filtre les résultats et calcule les montants commandés, encaissés et dus à partir des champs persistés. La création utilise le formulaire partagé et `POST /orders`, réservés à ADMIN et COMMERCIAL ; aucun changement de schéma n'est requis.
- La page `/planning` utilise les tâches persistées de Production, enregistre les créneaux date/heure et permet de les modifier ou retirer. Le backend empêche les chevauchements machine/opérateur et trace les changements ; voir `production-api.md`. La migration `ProductionSchedule20261017020000` ajoute les colonnes de créneau et doit être exécutée sur chaque base.
- La page `/receptions` utilise les fournisseurs et articles API pour les entrées hors commande. Les administrateurs et responsables de stock peuvent aussi réceptionner partiellement ou complètement une commande fournisseur ; le bon groupé, le statut Achat, les mouvements Stock et les quantités sont sauvegardés atomiquement. Migration `PurchaseReceipts20261017000000` appliquée le 17 octobre 2026 ; vingt-six migrations sont enregistrées sur la base configurée.
- La page `/achats` est raccordée à `GET /purchases` et `POST /purchases` : commandes multi-articles, totaux calculés côté serveur, recherche, détail et suivi des quantités reçues. La migration initiale `Purchases20261008000000` a été appliquée le 8 octobre 2026. Voir `purchases-api.md`.
- La cloche ERP utilise `GET /notifications` et `POST /notifications/read` pour afficher les activités auditées et les alertes réelles de stock, échéance commande et maintenance, filtrées selon le rôle. Le compteur et le marquage lu/non lu sont persistés par utilisateur. `GET/PUT /notifications/preferences` raccorde les réglages individuels dans `/parametres`. Le fil se recharge à l'ouverture, au retour sur l'onglet et chaque minute quand l'application est visible. Les migrations de notification sont enregistrées et les tables `notification_preferences` et `notification_reads` sont présentes dans la base configurée (vérification du 16 octobre 2026). Les dates de commande restent calendaires ; les envois navigateur, e-mail et SMS restent à intégrer. Voir `notifications-api.md`.
- `/parametres` lit et met à jour le nom, l’adresse, la devise et le fuseau de l’organisation depuis `/organizations/me/settings`. Le `PUT` est réservé aux administrateurs. La devise modifie l’unité affichée sans convertir les données historiques ; le fuseau alimente les alertes de date et la validation du profil. Les préférences de notification restent individuelles. La migration `OrganizationSettings20261016010000` a été appliquée le 16 octobre 2026. Voir `organizations-api.md`.
- La sauvegarde des paramètres et son audit sont atomiques. Le nom est affiché dans la navigation, la devise met à jour les montants, les formulaires et les exports CSV de l’ERP, et les libellés suivent la devise de l’organisation. Les valeurs numériques déjà enregistrées ne sont pas converties.
- Le profil utilisateur est accessible par `/profil` depuis le menu du compte. `GET/PATCH /auth/me/profile` gère le prénom, le nom, le téléphone, l'adresse, la date de naissance et la description ; l'e-mail, l'organisation, le statut et les rôles restent en lecture seule. Les routes protégées `PUT/GET/DELETE /auth/me/profile/photo` gèrent les photos JPG/PNG jusqu'à 2 Mo, contrôlées par type MIME et signature. La migration `UserProfiles20261016000000` a été appliquée à la base configurée le 16 octobre 2026. Pour une nouvelle base, lancer `npm run migration:run` depuis `backend/`. La page réutilise également le changement de mot de passe sécurisé. Voir `auth-api.md`.

## Factures — 17 octobre 2026

- [x] Émettre une facture à partir d'une commande enregistrée et garder un instantané du client et de l'article.
- [x] Calculer le solde depuis les paiements Finance existants, sans créer d'encaissement en double.
- [x] Remplacer la page de démonstration par la liste API et la modale d'émission.
- [x] Documenter les routes dans [`invoices-api.md`](invoices-api.md).
- [x] Appliquer la migration `Invoices20261017010000` à la base MySQL configurée le 17 octobre 2026. La migration devra être exécutée dans chaque autre environnement.

## Envoi des devis par e-mail — 27 octobre 2026

- [x] Ajouter `POST /quotes/:id/send` : le serveur vérifie l'adresse du client, envoie le détail du devis avec SMTP et enregistre le statut ainsi que l'audit après acceptation du destinataire.
- [x] Remplacer l'action « Marquer envoyé » par « Envoyer par e-mail » dans `/devis`.
- [x] Documenter l'activation SMTP et les réponses en cas d'échec. Aucune migration n'est nécessaire.
- [ ] Renseigner les identifiants SMTP du fournisseur dans les variables de l'API pour activer l'envoi en production.
