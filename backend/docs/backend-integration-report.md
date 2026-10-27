# Rapport d'intégration backend ERP

**Mise à jour :** 27 octobre 2026

Ce document suit le raccordement des écrans ERP aux API et à la base MySQL, module par module. Les migrations sont versionnées ; aucune synchronisation automatique du schéma n'est activée.

## État des modules

| Module                | API et base                                                         | Interface                                            | État         |
| --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- | ------------ |
| Authentification      | Complétées                                                          | Connectée                                            | Déjà intégré |
| Utilisateurs et rôles | Liste, création, rôles et profil étendu ; migrations appliquées     | Gestion membres et `/profil` raccordés               | Intégré      |
| Clients               | Complétées, migration appliquée                                     | Connectée                                            | Intégré      |
| Produits              | Complétées, migration appliquée                                     | Connectée                                            | Intégré      |
| Fournisseurs          | Complétées, migration appliquée                                     | Connectée                                            | Intégré      |
| Stock                 | Articles, mouvements paginés et comptage atomique                   | Catalogue, journal et inventaire connectés           | Intégré      |
| Commandes             | Complétées, migration appliquée                                     | Connectée                                            | Intégré      |
| Ventes                | API Commandes et paiements existante                                | Liste, filtres et indicateurs connectés              | Intégré      |
| Factures              | Émission depuis commande, migration appliquée                       | Liste, recherche et soldes connectés                 | Intégré      |
| Devis                 | API et migration appliquées ; envoi SMTP disponible                 | Connectée, envoi par e-mail et filtres dynamiques    | Intégré      |
| Production            | Complétées, migration appliquée                                     | Connectée                                            | Intégré      |
| Planning              | Créneaux persistés, contrôles de chevauchement et audit              | Liste, création, modification et retrait connectés   | Intégré      |
| Achats                | Commandes fournisseurs multi-lignes et réceptions, migrations appliquées | Création, consultation et suivi des réceptions connectés | Intégré   |
| Réceptions            | Bons liés aux commandes et entrées Stock hors commande              | Réceptions multi-lignes et historique connectés      | Intégré      |
| Employés              | Annuaire connecté, migration appliquée                              | Connectée (liste, ajout, modification, archivage)    | Intégré      |
| Tâches RH             | API et migration appliquées                                         | Connectée (liste, création, modification, archivage) | Intégré      |
| Rémunération          | API et migration appliquées                                         | Connectée (consultation et mise à jour)              | Intégré      |
| Présences             | Connectées, migration appliquée                                     | Connectée                                            | Intégré      |
| Machines              | Complétées, migration appliquée                                     | Connectée                                            | Intégré      |
| Finance               | Registre, paiements, transferts et rapprochements appliqués         | Interface connectée                                  | Intégré      |
| Dashboard             | Agrégats organisationnels, sans migration                           | Connectée, données simulées retirées                 | Intégré      |
| Statistiques          | Agrégats de ventes, marge estimée, production et stock              | Connectée aux données API                            | Intégré      |
| Rapports              | Exports CSV construits depuis les agrégats Dashboard                | Connectée ; Finance/RH soumis aux rôles              | Intégré      |
| Notifications         | Activités, alertes calculées et préférences ; migrations appliquées | Cloche et réglages ERP raccordés                     | Intégré      |

## Préparation du déploiement Vercel — 19 octobre 2026

- Le frontend utilisait `http://localhost:3001/api/v1` par défaut même dans un bundle de production ; depuis Vercel, cette adresse pointe sur l'ordinateur du visiteur et explique l'erreur « Impossible de joindre le serveur ».
- En développement local, cette valeur de secours est conservée. En production, l'absence de `VITE_API_URL`, une URL locale, relative ou en HTTP affiche désormais une erreur de configuration explicite. Les erreurs réseau indiquent l'origine réellement ouverte dans le navigateur pour le diagnostic CORS, même si le domaine Vercel change.
- CORS autorise par défaut le domaine `https://zo-print.vercel.app`, et conserve les origines de développement locales. Le nouveau domaine frontend doit être ajouté précisément à `FRONTEND_ORIGINS` côté API.
- Ajout du guide [`vercel-deployment.md`](vercel-deployment.md) : le frontend Vite et l'API NestJS sont déployés depuis le même dépôt dans deux projets Vercel, puis reliés par `VITE_API_URL`.
- Vercel exécute NestJS dans une fonction serverless ; une base de données distante reste indispensable. Le guide propose TiDB Cloud Starter en mode compatible MySQL pour un essai sans frais, avec TLS obligatoire, quotas et différences de compatibilité à considérer.
- Le transfert prévu conserve les enregistrements applicatifs et l'historique TypeORM : sauvegarde de la base locale complète, import dans une base TiDB vide, comparaison des données, puis exécution des seules migrations en attente. La base locale et le dump doivent être gardés jusqu'à validation fonctionnelle. Aucun transfert n'a encore été exécuté, car la base distante n'est pas créée et ses identifiants ne sont pas disponibles.
- Le backend accepte maintenant `MYSQL_SSL` et limite son pool par `MYSQL_CONNECTION_LIMIT` afin de connecter une base TLS et réduire les connexions simultanées en serverless. Le mode local conserve TLS désactivé par défaut.
- Le domaine Vercel précédent a été supprimé. La création des deux projets, la base distante, les variables secrètes, l'application des migrations et les redéploiements restent à effectuer dans les comptes externes ; aucune valeur secrète n'est stockée dans Git.

## Module Clients — 26 septembre 2026

- Ajout d'une entité Client rattachée à l'organisation, avec archivage logique.
- Ajout des routes liste, création, modification et archivage ; les écritures sont limitées aux rôles commerciaux et administrateurs, l'archivage aux administrateurs.
- Ajout de validation des coordonnées, d'isolation par organisation et d'événements d'audit.
- Remplacement des clients simulés de l'écran `/clients` par les données API : chargement, recherche, filtre, fiche, ajout, modification et archivage.
- Les chiffres de commandes et de revenus ont été retirés de la fiche tant que les modules Commandes et Finance ne les calculent pas.
- L'écran d'ajout de commande utilise encore sa liste de clients simulée ; ce raccordement sera traité dans le module Commandes.
- Migration `Clients20260926000000` appliquée avec succès à la base configurée le 26 septembre 2026 ; elle a créé `clients` et converti le champ d'événement d'audit en `VARCHAR(64)`.
- Tests et builds non exécutés dans cette tranche.

## Module Produits — 26 septembre 2026

- Ajout de l'entité Produit et de la migration `Products20260926010000`, avec référence unique par organisation, prix, coût, quantité initiale, catégorie et paramètres de production.
- Ajout des routes liste, création, modification et archivage. Toutes les opérations sont limitées aux données de l'organisation ; la création et la modification sont réservées aux rôles ADMIN, COMMERCIAL et PRODUCTION_MANAGER, l'archivage aux administrateurs.
- Ajout de la validation des champs, de la détection des références en double et des événements d'audit.
- Remplacement des données simulées de l'écran `/products` par l'API : recherche, filtre catégorie, affichage tableau/grille, formulaires de création et de modification, archivage réservé aux administrateurs, et indicateurs calculés sur les produits chargés.
- Le champ stock saisi à la création correspond à une quantité initiale ; les mouvements et ajustements seront intégrés dans le module Stock.
- Migration `Products20260926010000` appliquée avec succès le 26 septembre 2026 ; elle a créé la table `products`, son index unique par organisation et sa clé étrangère.
- Tests et builds non exécutés dans cette tranche.

## Module Fournisseurs — 26 septembre 2026

- Ajout du référentiel fournisseurs avec catégorie, personne à contacter, téléphone, e-mail, ville et notes internes ; les soldes et volumes de commandes restent à calculer par les modules Achats et Finance.
- Ajout des routes liste, création, modification et archivage, avec isolation par organisation et audit. ADMIN, COMMERCIAL et STOCK_MANAGER peuvent créer/modifier ; l'archivage est réservé aux ADMIN.
- Remplacement de la liste simulée de `/fournisseurs` par les données API : recherche, filtre par catégorie, création, modification et archivage.
- Repositionnement global des modals et panneaux dans le portail du document, hors des pages animées ; focus confiné au clavier, retour au déclencheur, et adaptation aux petits écrans.
- Migration `Suppliers20260926020000` appliquée avec succès le 26 septembre 2026 ; elle a créé `suppliers`, son index organisation/nom et sa clé étrangère.
- Correction du mapping TypeORM `contactName` vers la colonne SQL `contact_name` après l’erreur de lecture remontée par MySQL ; aucune migration supplémentaire n’est nécessaire.
- Tests et builds non exécutés dans cette tranche.

## Module Stock — 26 septembre 2026

- Ajout du catalogue des articles de stock interne avec référence unique par organisation, unité, seuil minimum, coût unitaire, quantité et archivage logique.
- Ajout des routes de consultation, création, modification, archivage et historique des mouvements. ADMIN et STOCK_MANAGER gèrent le catalogue ; seul ADMIN archive un article, uniquement lorsque la quantité est nulle.
- Les rôles ADMIN, STOCK_MANAGER, PRODUCTION_MANAGER et OPERATOR peuvent enregistrer des entrées, sorties et ajustements. Les mouvements et la mise à jour de quantité sont transactionnels ; une sortie ne peut pas créer de stock négatif.
- Remplacement des données et indicateurs simulés sur `/stock` par les articles API ; ajout de la création d'article, de l'édition, des mouvements et de l'historique réel dans le panneau de détail.
- Les articles commencent à zéro ; une entrée crée l'historique du stock initial. Les anciennes données de démonstration ne sont pas importées.
- Migration `Stock20260926030000` appliquée avec succès le 26 septembre 2026 : tables `stock_items` et `stock_movements`, contraintes organisation/article et index de consultation.
- Documentation API : [`stock-api.md`](stock-api.md).
- La migration a été appliquée puis vérifiée : les huit migrations du projet sont marquées comme exécutées. Tests et builds non exécutés dans cette tranche.

## Journal des mouvements Stock — 8 octobre 2026

- Ajout de `GET /api/v1/stock/movements` avec pagination, filtres par type/article et recherche dans les champs métier ; l'organisation provient toujours du jeton.
- Raccordement de `/mouvements` aux mouvements persistés et au formulaire réel d'entrée, sortie ou ajustement. Les filtres, la pagination et les compteurs reflètent la réponse API.
- Les rôles autorisés à créer les mouvements restent ADMIN, STOCK_MANAGER, PRODUCTION_MANAGER et OPERATOR. La lecture reste limitée à l'organisation.
- Aucune migration n'est nécessaire ; la table existante `stock_movements` est utilisée. Tests et builds non exécutés dans cette tranche.

## Inventaire physique — 8 octobre 2026

- Remplacement de la vue de démonstration `/inventaire` par le catalogue stocké, la recherche et la saisie des quantités comptées.
- Ajout de `POST /api/v1/stock/items/:id/count`. Le serveur verrouille l'article, recalcule l'écart à partir de sa quantité réelle, puis met à jour le stock et crée un mouvement `ADJUSTMENT` de source `Inventaire` dans une transaction.
- Les comptages sans écart sont eux aussi inscrits au journal. Les quantités sont entières ; les écritures suivent les rôles autorisés pour les mouvements Stock.
- Aucune migration n'est nécessaire. Tests et builds non exécutés dans cette tranche.

## Module Ventes — 8 octobre 2026

- Remplacement de la vue de démonstration `/ventes` par la liste des commandes de l'organisation via `GET /api/v1/orders`.
- La recherche et le filtre de statut utilisent les commandes persistées. Les indicateurs de montant commandé, encaissé et restant sont calculés depuis `total` et `paidAmount` de chaque commande.
- Le formulaire de création réutilise le composant Commandes et enregistre via `POST /api/v1/orders`. ADMIN et COMMERCIAL peuvent créer ; les paiements continuent d'être saisis depuis le détail Commandes et sont inscrits dans Finance.
- Aucune nouvelle route ni migration n'est nécessaire. Tests et builds non exécutés dans cette tranche.

## Planning de production — 8 octobre 2026

- Remplacement de la vue de démonstration `/planning` par les tâches de production persistées via `GET /api/v1/production/tasks`, avec recherche, filtre d'étape, échéance, commande, machine, opérateur et priorité.
- ADMIN et PRODUCTION_MANAGER peuvent planifier une commande confirmée non encore affectée via `GET /production/orders` et `POST /production/tasks`. La tâche et le passage de la commande à « À produire » suivent la transaction backend existante.
- À cette étape, l'échéance affichée venait de la commande et la machine du produit ; les créneaux horaires n'étaient pas encore stockés. Cette limite a été levée le 17 octobre 2026, voir « Créneaux du Planning » ci-dessous.
- Aucune nouvelle route ni migration n'est nécessaire. Tests et builds non exécutés dans cette tranche.

## Réceptions fournisseurs — 8 octobre 2026

- Remplacement de la vue de démonstration `/receptions` par les fournisseurs, articles et entrées du journal Stock provenant des API existantes.
- L'enregistrement d'une ligne de réception crée une entrée Stock avec le nom du fournisseur comme origine, la quantité reçue et une note/référence de bon de livraison. La mise à jour du stock, l'historique et l'audit utilisent la transaction Stock existante ; le mouvement conserve le nom, pas une relation fournisseur.
- Les rôles d'écriture sont ceux du mouvement Stock : ADMIN, STOCK_MANAGER, PRODUCTION_MANAGER et OPERATOR. Aucune migration ni route nouvelle n'est nécessaire.
- Il n'existe pas encore de document de réception parent, de lien à une commande fournisseur ou de réception multi-articles ; chaque ligne est enregistrée séparément dans Stock. Le module reste partiel sur ces workflows.
- Tests et builds non exécutés dans cette tranche.

## Achats fournisseurs — 8 octobre 2026

- Ajout des entités `PurchaseOrder` et `PurchaseOrderLine`, des validations, de `GET /api/v1/purchases` et `POST /api/v1/purchases`, isolés par organisation et réservés aux rôles ADMIN et STOCK_MANAGER.
- Une commande contient un fournisseur actif et une à cent lignes d'articles Stock actifs. Les totaux sont recalculés côté serveur et les noms, références et unités sont conservés comme instantanés.
- L'écran `/achats` est maintenant raccordé : liste, recherche, détail des lignes, indicateurs et formulaire multi-articles avec coût unitaire et date de livraison prévue.
- La migration `Purchases20261008000000` crée les tables `purchase_orders` et `purchase_order_lines` ; elle a été appliquée avec succès à la base MySQL configurée le 8 octobre 2026, portant le total à vingt-deux migrations.
- Les commandes ne changent pas le stock. `/receptions` continue d'enregistrer chaque réception comme une entrée indépendante ; l'association à une commande, les réceptions partielles et la clôture/annulation des commandes restent à intégrer.
- Documentation API : [`purchases-api.md`](purchases-api.md). Tests et builds non exécutés dans cette tranche.

## Module Commandes — 28 septembre 2026

- Ajout du référentiel de commandes lié aux clients et produits existants, avec numéro unique par organisation et instantanés du client, produit, prix et machine au moment de la création.
- Les routes permettent de lister les commandes, d'en créer et d'en changer le statut. La création est réservée à ADMIN et COMMERCIAL ; ADMIN, COMMERCIAL, PRODUCTION_MANAGER et OPERATOR peuvent changer les statuts.
- Le total est recalculé côté serveur depuis le prix du produit ; client et produit doivent être actifs et rattachés à la même organisation. Les nouvelles commandes commencent sans paiement ; les paiements passent par Finance.
- Remplacement des données de `/commandes` par l'API : recherche, filtre statut, indicateurs calculés, détail et mise à jour du statut. Le formulaire partagé du dashboard charge lui aussi les clients et produits API et crée une commande persistée.
- Le formulaire actuel porte sur un produit par commande. Les paiements sont maintenant enregistrés depuis le détail commande et le solde dû est calculé depuis `total - paidAmount`.
- Migration `Orders20260928000000` appliquée avec succès le 28 septembre 2026 : table `orders`, clés étrangères vers `organizations`, `clients` et `products`, index de recherche et unicité du numéro de commande par organisation.
- Documentation API : [`orders-api.md`](orders-api.md).
- Migration appliquée avec succès et vérifiée : `migration:show` confirme les neuf migrations exécutées. Tests et builds non exécutés dans cette tranche.

## Correction de création Commande — 17 octobre 2026

- Correction de l'erreur de validation de priorité visible dans la modale « Nouvelle commande » : la valeur historique d'interface `Urgent` est normalisée en `Urgente` par le DTO avant validation et enregistrement.
- Les options du formulaire utilisent maintenant des valeurs explicites conformes à l'énumération backend (`Normale`, `Haute`, `Urgente`). Aucune migration n'est nécessaire ; les valeurs stockées restent canoniques.

## Module Production — 28 septembre 2026

- Ajout de l’entité `ProductionTask` et des routes de liste, commandes disponibles, planification, affectation et avancement des étapes.
- Une commande confirmée planifiée crée une tâche liée et passe au statut `À produire` dans une transaction. Le passage au statut `À produire`, `En production` ou `Contrôle qualité` depuis Commandes crée aussi la tâche si nécessaire.
- La progression `À produire` → `En production` → `Contrôle qualité` → `Terminé` met à jour la commande dans la même transaction. Les organisations sont isolées, une seule tâche est autorisée par commande et les actions sont auditées.
- ADMIN et PRODUCTION_MANAGER planifient/affectent ; ADMIN, PRODUCTION_MANAGER et OPERATOR avancent une tâche.
- Remplacement des tâches simulées du tableau Production et des postes DTF, laser, presse et qualité par les tâches API. Les retards sont calculés depuis l’échéance. Les chiffres de capacité, consommation, temps machine et taux de rejet ont été retirés car ils ne proviennent pas encore de données persistées.
- Le catalogue Machines est géré dans un module séparé ; les commandes conservent le nom machine comme instantané texte. Les tâches Production peuvent maintenant référencer un Employé actif ; les anciens noms libres restent des instantanés jusqu’à une affectation manuelle.
- Migration `Production20260928010000` : table `production_tasks`, unicité de commande, index organisation/étape et clés étrangères vers l’organisation et la commande.
- L’affectation par nom libre est remplacée dans l’écran par une sélection d’employé actif. Migration `ProductionEmployee20260930010000` appliquée le 30 septembre 2026 ; les anciens noms ne sont pas auto-convertis.
- Documentation API : [`production-api.md`](production-api.md).
- Migration appliquée et vérifiée le 28 septembre 2026. Tests et builds non exécutés dans cette tranche.

## Module Machines — 29 septembre 2026

- Ajout des API de parc machines : consultation, création et changement d’état, avec noms uniques par organisation et audit.
- Ajout des interventions de maintenance persistées : planification préventive/corrective, démarrage, clôture et annulation. Une intervention en cours place la machine en maintenance ; sa clôture restaure l’état précédent si personne ne l’a modifié entre-temps.
- La migration `Machines20260929000000` crée `machines` et `machine_maintenances` et reprend les noms machine déjà présents dans le catalogue Produits pour préserver la cohérence.
- Le formulaire Produits propose maintenant le parc enregistré ; le backend refuse un nom de machine absent ou rattaché à un autre atelier.
- Les écrans Machines et Maintenance consomment les API. `/utilisation` affiche un décompte des ordres actifs venant de Production ; les pourcentages horaires, volumes, incidents et anciennes échéances simulés ont été retirés.
- ADMIN et PRODUCTION_MANAGER gèrent machines et maintenances ; tous les utilisateurs authentifiés de l’organisation peuvent les consulter.
- Documentation API : [`machines-api.md`](machines-api.md).
- Migration appliquée et vérifiée le 29 septembre 2026 : onze migrations exécutées. Tests et builds non exécutés dans cette tranche.

## Module Employés — 29 septembre 2026

- Ajout de l’entité Employé avec nom, poste, coordonnées, statut actif/inactif et archivage logique, isolée par organisation.
- Ajout des routes liste, création, modification et archivage, avec journalisation d’audit. Tout utilisateur authentifié peut lire l’annuaire ; ADMIN et HR_MANAGER peuvent le gérer.
- L’écran `/employes` lit les dossiers persistés, permet la recherche, l’ajout, la modification, l’inactivation et l’archivage. Les anciennes lignes de démonstration n’ont pas été importées ; elles doivent être recréées si elles correspondent à de vrais employés. Les données de présence, performance et salaire simulées ont été retirées de cet écran.
- L’API d’annuaire ne stocke et ne renvoie aucun salaire. La vue Rémunération reste simulée, mais sa route et son lien de menu sont réservés à ADMIN et HR_MANAGER jusqu’à l’intégration de routes de paie dédiées.
- La migration `Employees20260929010000` crée la table `employees`, ses index et sa clé étrangère vers `organizations`.
- Documentation API : [`employees-api.md`](employees-api.md).
- Migration appliquée et vérifiée le 29 septembre 2026 : douze migrations exécutées. Tests et builds non exécutés dans cette tranche.

## Module Présences — 30 septembre 2026

- L’API retourne pour une date choisie une ligne par dossier Employé non archivé ; les employés sans fiche ce jour-là sont indiqués « À saisir ».
- ADMIN et HR_MANAGER peuvent consulter et saisir/corriger les pointages. Les autres rôles n’accèdent ni à la route API ni à la page.
- Chaque employé a au plus un pointage par jour. Les statuts sont présent, retard, absent et congé ; les heures d’arrivée et de départ sont validées côté backend, et la durée est calculée en minutes.
- L’écran `/presences` utilise les employés et pointages API, permet de choisir une date et de saisir ou corriger les heures. Les indicateurs affichés sont calculés sur les lignes chargées.
- Les lignes de démonstration de présence n’ont pas été importées ; les dates commenceront sans pointage et peuvent être remplies dans l’écran.
- Les pointages et corrections alimentent l’audit. Les heures de nuit qui traversent minuit et les pauses ne sont pas calculées dans ce lot.
- Migration `Attendance20260930000000` appliquée et vérifiée le 30 septembre 2026 : treize migrations exécutées.
- Documentation API : [`attendance-api.md`](attendance-api.md). Tests et builds non exécutés dans cette tranche.

## Liaison Production–Employés — 30 septembre 2026

- Les tâches peuvent référencer un dossier Employé actif de la même organisation ; l’affectation et la désaffectation sont auditées.
- Le tableau Production charge le répertoire Employés pour ses choix d’affectation. Les anciens noms libres sont conservés en affichage jusqu’à ce qu’un gestionnaire les remplace ou désaffecte la tâche.
- Migration `ProductionEmployee20260930010000` appliquée et vérifiée : quatorze migrations exécutées.

## Module Tâches RH — 30 septembre 2026

- Ajout de l’entité `EmployeeTask` pour les consignes internes, avec échéance, description facultative, statut, affectation facultative à un employé actif et archivage logique.
- Routes de liste, création, modification et archivage limitées à ADMIN et HR_MANAGER ; chaque requête est isolée par organisation et les écritures alimentent l’audit.
- Remplacement des données de démonstration de `/taches` par l’API : recherche, indicateurs calculés, attribution, avancement, modification et archivage.
- L’accès à la page et aux routes est réservé aux responsables RH et administrateurs. Les employés inactifs et ceux d’une autre organisation ne peuvent pas être affectés.
- Migration `HrTasks20260930020000` appliquée et vérifiée le 30 septembre 2026 : quinze migrations exécutées.
- Documentation API : [`hr-tasks-api.md`](hr-tasks-api.md).

## Module Rémunération — 1 octobre 2026

- Ajout d’un référentiel distinct de l’annuaire Employés pour le salaire mensuel de base en Ariary et sa date d’effet.
- L’écran /remuneration lit les dossiers Employé et permet à ADMIN et HR_MANAGER de renseigner ou mettre à jour les montants des employés actifs. Les indicateurs sont calculés à partir des dossiers chargés.
- L’API GET /payroll/salaries retourne les employés non archivés ; PUT /payroll/salaries/:employeeId crée ou remplace leur salaire de base.
- Les routes contrôlent le rôle, l’organisation, l’activité de l’employé, le montant entier positif et la date ; les changements sont journalisés.
- Migration PayrollCompensation20261001000000 appliquée et vérifiée le 1er octobre 2026 : seize migrations exécutées.
- Les anciennes valeurs de démonstration ne sont pas importées. Cette étape ne calcule pas la paie nette, les retenues ou cotisations et ne crée pas de bulletins ni d’ordres de paiement ; elle ne conserve pas d’historique contractuel structuré.
- Documentation API : payroll-api.md.

## Module Finance — 1 octobre 2026

- Création d’un registre organisationnel de mouvements immuables : entrées, dépenses et soldes initiaux sur Caisse, Banque ou Mobile Money.
- API de création, liste paginée/recherchable et résumé de soldes et agrégats mensuels. Les catégories et montants sont validés ; chaque création est auditée.
- ADMIN et ACCOUNTANT peuvent accéder aux routes et écrans Finance. Les autres rôles ne voient pas les liens et sont redirigés ; l’API applique le même contrôle.
- Remplacement des transactions, soldes, indicateurs et courbe simulés sur /finance, /caisse, /banque, /revenus, /depenses et /charges par les données persistées.
- Le registre est append-only : une erreur se corrige par une écriture compensatrice. Aucun mouvement fictif n’est importé.
- Migration FinanceTransactions20261001010000 appliquée et vérifiée le 1er octobre 2026 : dix-sept migrations exécutées.
- Les paiements clients sont désormais reliés aux commandes : les créations depuis le détail commande alimentent le registre de caisse/banque et mettent à jour `paidAmount` de façon transactionnelle. ADMIN, ACCOUNTANT et COMMERCIAL peuvent saisir un règlement ; les autres écritures Finance restent réservées à ADMIN et ACCOUNTANT.
- Le module Commandes affiche les montants reçus et les créances restantes ; aucun ancien paiement n’est inventé dans le registre.
- Migration `LinkedOrderPayments20261001020000` appliquée et vérifiée le 1er octobre 2026 : dix-huit migrations exécutées.
- Les transferts Caisse/Banque/Mobile Money créent dans une transaction deux mouvements appariés : débit du compte source, crédit du destinataire et audit. Les transferts ne gonflent ni revenus ni dépenses.
- Les rapprochements Banque gèrent les périodes, soldes d’ouverture/clôture, pointage individuel des mouvements, calcul de l’écart, clôture et annulation avant pointage. Les périodes ne se chevauchent pas ; une période clôturée refuse les mouvements bancaires rétroactifs.
- Le pointage se fait manuellement à partir du relevé papier/PDF ; l’import automatique du relevé n’est pas inclus.
- La migration `BankReconciliation20261001040000` appliquée et vérifiée le 1er octobre 2026 porte le registre à vingt migrations. Documentation API : [`finance-api.md`](finance-api.md).

## Module Dashboard, Statistiques et Rapports — 2 octobre 2026

- Ajout de GET /api/v1/dashboard?period=month|quarter|year, avec indicateurs calculés depuis les commandes, les tâches Production, les niveaux de Stock et le registre Finance.
- Les requêtes sont limitées à l’organisation du jeton. Les montants Finance et leur série mensuelle ne sont renvoyés qu’aux rôles ADMIN et ACCOUNTANT.
- L’écran Dashboard ne lit plus de jeux de démonstration : commandes récentes, tâches urgentes/bloquées, seuils de stock, ventes par catégorie et indicateurs de période proviennent de l’API.
- Aucun changement de schéma ni migration n’est requis. Les données historiques fictives ne sont pas importées.
- Statistiques et Rapports consomment le même agrégat. Les exports CSV sont construits côté navigateur depuis la réponse de l’API ; PDF et XLSX ne sont pas générés.
- Finance n’est retourné qu’à ADMIN/ACCOUNTANT ; les compteurs RH ne sont retournés qu’à ADMIN/HR_MANAGER. Les données sont toujours limitées à l’organisation du jeton.
- Les marges sont estimatives : elles utilisent le coût actuel du produit et ne déduisent pas les frais fixes. Les exports de stock listent tous les articles sous le seuil ; l’écran Dashboard n’en affiche que quatre.
- La documentation de la route est dans dashboard-api.md. Tests et builds non exécutés dans cette tranche.

## Module Devis — 2 octobre 2026

- Ajout de l'entité `Quote` et des routes de liste, création, statut et conversion, isolées par organisation et réservées à ADMIN/COMMERCIAL.
- Un devis est lié à un client et un produit existants ; les libellés, références, machine, quantité et prix convenu sont conservés comme instantanés. Le total est recalculé côté serveur.
- Les transitions autorisées sont brouillon → envoyé → accepté (par conversion), refusé ou expiré. La conversion requiert un devis envoyé non expiré ; la création de commande, la mise à jour du devis et les audits sont atomiques et la route est idempotente.
- Raccordement de `/devis` : liste et indicateurs depuis l'API, recherche, filtre de statut, création, détail, transitions et lien vers la commande créée. Les données de démonstration sont retirées.
- Migration `Quotes20261002000000` appliquée et vérifiée le 2 octobre 2026 : vingt-et-une migrations exécutées. La table `quotes` contraint les références organisation, client, produit et commande. L'API ne transmet pas de courriel ; le statut « envoyé » est manuel.
- Documentation : [`quotes-api.md`](quotes-api.md). Tests et builds non exécutés dans cette tranche.

## Profil utilisateur — 16 octobre 2026

- La page protégée `/profil`, accessible depuis le menu du compte, permet de modifier le prénom, le nom, le téléphone, l'adresse, la date de naissance et la description. L'e-mail, l'organisation, le statut et les rôles sont affichés sans être modifiables par l'utilisateur.
- Ajout de `GET/PATCH /api/v1/auth/me/profile` et d'un événement d'audit lors d'une modification.
- Ajout de l'import, de l'affichage et de la suppression d'une photo JPG/PNG de 2 Mo maximum. Le contenu est stocké comme BLOB et transmis par une route protégée dédiée.
- La migration `UserProfiles20261016000000` a été exécutée avec succès le 16 octobre sur la base MySQL configurée : TypeORM confirme la création de `user_profiles` et son enregistrement. Le profil peut maintenant lire et enregistrer ses données dans cette base. Pour une autre base, exécuter `npm run migration:run` depuis `backend/`.
- Le changement de mot de passe du profil garde la vérification du mot de passe actuel et l'invalidation de la session. Documentation : [`auth-api.md`](auth-api.md). Tests et builds non exécutés dans cette tranche.
- Correction TypeScript : `InjectRepository` est importé depuis `@nestjs/typeorm`, tandis que `DataSource`, `QueryFailedError` et `Repository` restent importés depuis `typeorm`.

## Paramètres — 16 octobre 2026

- La page `/parametres` charge et enregistre le nom, l’adresse, la devise et le fuseau horaire de l’organisation via `GET/PUT /api/v1/organizations/me/settings`. La mise à jour est limitée aux administrateurs, isolée par l’organisation du jeton et inscrite dans l’audit.
- La sauvegarde des paramètres et son entrée d’audit sont atomiques. Les autres membres peuvent consulter ces réglages ; seul ADMIN peut les modifier.
- Le nom d’organisation est actualisé dans la navigation. La devise enregistrée alimente le formatage des montants ERP, des formulaires et des exports CSV sans convertir les valeurs enregistrées ; les libellés d’unité suivent le réglage. Le fuseau choisi alimente les alertes de date et la validation des dates de naissance.
- Les alertes de stock, maintenance et commandes restent des préférences personnelles. La page lit et enregistre ces valeurs avec `/api/v1/notifications/preferences`.
- La migration `OrganizationSettings20261016010000` a été appliquée avec succès le 16 octobre 2026 ; elle ajoute `organizations.address`. Documentation : [`organizations-api.md`](organizations-api.md). Tests et builds non exécutés.

## Achats et réceptions liées — 17 octobre 2026

- Les lignes de commande fournisseur conservent maintenant les quantités commandées, reçues et restantes. Le statut de la commande avance de `ORDERED` à `PARTIALLY_RECEIVED`, puis à `RECEIVED`.
- Ajout des bons de réception groupés : un bon peut recevoir plusieurs lignes, avec référence du bon fournisseur et note interne. Les rôles ADMIN et STOCK_MANAGER peuvent consulter et créer ces bons.
- Une réception verrouille la commande, vérifie l'organisation, les lignes et le restant à livrer, puis écrit le bon, ses lignes, les mouvements d'entrée Stock, les nouvelles quantités et le statut dans une seule transaction. Les dépassements ou articles archivés font échouer l'ensemble.
- `/receptions` propose maintenant le flux lié à une commande et conserve aussi la saisie d'entrée hors commande pour les rôles déjà autorisés. Le registre montre les bons groupés et l'historique complet des entrées Stock.
- Les anciennes entrées Stock restent visibles comme entrées hors commande ; elles ne sont pas attribuées rétroactivement à un achat.
- Les réceptions apparaissent également dans les notifications du périmètre Stock et sont auditables.
- Migration `PurchaseReceipts20261017000000` : ajout de `quantity_received`, extension du statut des commandes et création des tables `purchase_receipts` et `purchase_receipt_lines`. Appliquée à la base MySQL configurée le 17 octobre 2026 ; TypeORM confirme qu'il ne reste aucune migration en attente (26 enregistrées). Pour une autre base, exécuter `npm run migration:run` dans `backend/`.
- Documentation : [`purchases-api.md`](purchases-api.md) et [`stock-api.md`](stock-api.md). Tests et builds non exécutés.

## Factures — 17 octobre 2026

- Remplacement de la page de démonstration `/factures` par une liste issue de l'API, une recherche, des totaux facturés/encaissés/dus et l'émission depuis une commande existante.
- Ajout de `GET /invoices`, `GET /invoices/eligible-orders` et `POST /invoices/from-order/:orderId`. L'accès est réservé aux rôles ADMIN, ACCOUNTANT et COMMERCIAL, limité à l'organisation du jeton et journalisé par `INVOICE_ISSUED`, avec notification redirigeant vers la facture.
- La facture conserve une copie du client et de la ligne vendue. Les commandes annulées sont exclues ; une contrainte unique interdit plusieurs factures pour une commande. La date suit le fuseau de l'organisation. La génération et sa trace d'audit sont transactionnelles ; une répétition retourne la facture créée.
- Le statut et le solde sont calculés à partir des paiements Finance associés à la commande ; aucune écriture de paiement n'est dupliquée. Migration `Invoices20261017010000` appliquée le 17 octobre 2026 ; 27 migrations sont maintenant enregistrées sur la base configurée.
- La commande ne contient qu'un seul article. Les taxes, échéances, PDF et envoi client restent hors périmètre. Voir [`invoices-api.md`](invoices-api.md).

## Créneaux du Planning — 17 octobre 2026

- Ajout de créneaux date/heure persistés sur les tâches Production, avec création lors de la planification, modification et retrait depuis `/planning`. Les écrans Production existants peuvent continuer à créer une tâche sans créneau.
- Le backend valide la date et les heures, refuse les horaires invalides et les chevauchements sur une même machine ou un employé affecté. Les mises à jour sont sérialisées à l'échelle de l'organisation pour éviter deux réservations concurrentes sur le même créneau.
- Les changements sont audités sous `PRODUCTION_SCHEDULE_UPDATED` et apparaissent dans les notifications de Production. Les tâches terminées gardent leur créneau historique.
- Migration `ProductionSchedule20261017020000` : ajout de la date, de l'heure de début, de l'heure de fin et d'un index dans `production_tasks`. Appliquée à la base configurée le 17 octobre 2026 ; `migration:show` confirme 28 migrations enregistrées.
- Documentation : [`production-api.md`](production-api.md). Vérification automatisée non lancée dans cette tranche.

## Préparation du déploiement Vercel de l'API — 20 octobre 2026

- Le projet Vercel `makart-api` est configuré avec TiDB Cloud en TLS, les clés JWT et l'origine frontend. Les mots de passe et secrets ne sont pas recopiés dans le rapport.
- Le premier déploiement répondait HTTP 500. Les journaux ont montré des variables vides et des valeurs mal formatées. Les valeurs d'hôte MySQL, port, base, utilisateur, TLS, URL de réinitialisation et origine frontend ont été corrigées ; `MYSQL_PASSWORD` a été ressaisi par l'utilisateur dans l'invite sensible. Les deux clés JWT ont été générées séparément et conservées comme variables sensibles.
- Les valeurs nécessitant un type ou une URI stricts ont été réécrites sans retour de ligne final. Cela a corrigé la validation NestJS.
- Le déploiement Production final a réussi sous `https://makart-9kozln8rw-patrickmiavotra-3741s-projects.vercel.app`, avec l'alias stable `https://makart-api.vercel.app`.
- Vérification du 20 octobre 2026 : `GET https://makart-api.vercel.app/api/v1/health` renvoie HTTP 200 et `{"status":"ok", ...}`.
- L'ancien projet frontend étant absent, un nouveau projet `zo-print` a été créé et le dossier racine Vite y a été relié. `VITE_API_URL` a été configurée en Production avec `https://makart-api.vercel.app/api/v1`.
- Déploiement frontend Production réussi le 20 octobre 2026 ; l'alias stable est `https://zo-print.vercel.app`. Le build Vite est réussi.
- Vérifications : `/connexion` renvoie HTTP 200 ; le bundle de production contient bien l'URL d'API configurée ; `/api/v1/health` renvoie HTTP 200 depuis `https://zo-print.vercel.app` et retourne `Access-Control-Allow-Origin: https://zo-print.vercel.app`.
- La connexion avec un compte utilisateur existant n'a pas été testée dans un navigateur. Garder la base MySQL locale et son dump jusqu'à validation de la connexion et des écrans ERP depuis le site public.

## Import TiDB Cloud — 19 octobre 2026

- Diagnostic de l'import arrêté sur `FK_notification_preferences_user` : dans le dump MySQL, `users.id` est en `VARCHAR(36)`, alors que `notification_preferences.user_id` est en `CHAR(36)`. TiDB refuse cette différence de type pour la clé étrangère.
- Le même écart existe pour `notification_reads.user_id`, `user_profiles.user_id` et `purchase_receipts.actor_id`. La correction doit porter sur une copie du dump uniquement, en alignant ces colonnes sur `VARCHAR(36)` ; la sauvegarde originale est conservée.
- Le dump comprend `DROP TABLE IF EXISTS` pour les tables exportées et désactive temporairement les contrôles de clés étrangères. Une réimportation de la copie corrigée remplace les tables déjà importées partiellement dans la base TiDB cible. Import et vérification des lignes restent à effectuer avant d'exécuter les migrations en attente.
- L'utilisateur confirme le 19 octobre que l'import de la copie corrigée s'est terminé sans erreur et que les nombres de lignes des huit tables vérifiées (`users`, `organizations`, `clients`, `products`, `orders`, `purchase_orders`, `stock_items`, `finance_transactions`) correspondent entre MySQL local et TiDB.
- Tentative de `npm run migration:run` : la configuration l'oriente encore vers `127.0.0.1:3307` (MySQL local). La connexion a été refusée par l'environnement d'exécution (`EPERM`) avant toute migration ; aucune modification de schéma n'a été faite. Il faut renseigner l'hôte et le port TiDB dans `backend/.env`, puis exécuter la commande depuis le terminal local de l'utilisateur.
- Le 20 octobre, l'utilisateur a exécuté `npm run migration:run` depuis son terminal local avec la configuration TiDB : TypeORM se connecte, lit l'historique `migrations` et confirme `No migrations are pending`. Base importée, huit comptages comparés, schéma à jour.
- Le projet API Vercel `makart-api` a été lié depuis `backend/`. Le 20 octobre, `MYSQL_HOST` a été ajouté pour Production. Les autres variables requises et le déploiement restent à faire.

## Envoi des devis — 27 octobre 2026

- Ajout de `POST /api/v1/quotes/:id/send` et raccordement du bouton `/devis` à cette route.
- Le serveur envoie le détail du devis en texte et HTML à l'adresse de la fiche client. Le statut et l'audit ne sont enregistrés qu'après acceptation de l'adresse par SMTP ; en cas d'échec, le devis reste en brouillon.
- Aucune migration n'est nécessaire. Les identifiants SMTP restent à configurer dans les variables de l'API avant l'envoi en production ; aucun secret n'est stocké dans le dépôt.

## Étapes suivantes

- L'envoi des devis par e-mail utilise la configuration SMTP de l'API. Les identifiants SMTP restent à renseigner dans l'environnement de déploiement pour activer la livraison.
- Le backend expose `GET /api/v1/notifications`, `POST /api/v1/notifications/read`, `GET /api/v1/notifications/preferences` et `PUT /api/v1/notifications/preferences`. La cloche ERP affiche les activités auditées et les alertes calculées depuis les articles de stock, les commandes dues aujourd'hui/demain ou en retard, et les maintenances planifiées dans les cinq prochains jours ou en retard. Elle gère le compteur non lu, la navigation et la lecture persistante par compte. `/parametres` permet de régler ces alertes séparément pour chaque utilisateur.
- Les journaux du 16 octobre signalaient l'absence de `notification_preferences`. Lors de l'intervention profil, l'historique MySQL indiquait `Notifications20261008010000` comme exécutée ; une vérification d'`INFORMATION_SCHEMA` sur la base configurée a confirmé la présence de `notification_preferences` et `notification_reads`. Aucune migration Notification ne reste en attente dans cette base. Si l'API reproduit encore l'ancien message, vérifier qu'elle utilise cette même base puis la redémarrer.
- Les dates de commande sont calendaires, sans heure de livraison. Aucun envoi navigateur, e-mail ou SMS n’est inclus. Voir [`notifications-api.md`](notifications-api.md).
