# API Dashboard, Statistiques et Rapports

Route authentifiée : `GET /api/v1/dashboard?period=month|quarter|year`

`period` est facultatif et vaut `month` par défaut. Les périodes désignent le mois, le trimestre ou l'année civile en cours, du premier jour jusqu'à aujourd'hui. La réponse indique `period`, `periodStart` et `periodEnd`.

## Données retournées

- `activeOrderCount`, `dueTodayCount` et `recentOrders` décrivent les commandes en cours, les échéances du jour et les cinq dernières commandes.
- `urgentOrBlockedOrders` contient au plus quatre commandes urgentes ou bloquées ; les commandes annulées sont exclues.
- `sales` contient le nombre de commandes, leur total et la marge estimée sur la période. Les commandes annulées sont exclues.
- `categorySales` regroupe ventes et marges estimées par catégorie. `productPerformance` fournit jusqu'aux huit produits les plus vendus, avec quantités, ventes, prix moyen, coût courant et marge estimée.
- `stock` contient le nombre de références actives et leur valeur au coût unitaire courant. `criticalStockCount` et `lowStockItems` décrivent les références à zéro ou sous leur seuil ; la liste est complète.
- `production` regroupe les tâches par étape pour les commandes de la période et fournit les totaux des tâches et des tâches terminées.
- `finance` contient les revenus, dépenses, résultat net estimé et les six derniers mois. Cette propriété vaut `null` pour les rôles sans accès Finance.
- `people` contient les employés actifs et les pointages du jour. Cette propriété vaut `null` pour les rôles sans accès RH.

## Accès et calculs

Toutes les requêtes sont isolées par l'organisation du jeton. Seuls ADMIN et ACCOUNTANT reçoivent `finance`. Seuls ADMIN et HR_MANAGER reçoivent `people`. Le taux de présence est calculé parmi les pointages enregistrés pour des employés actifs.

La marge estimée utilise la formule `total de commande - quantité × coût unitaire actuel du produit`. Elle ne reconstitue pas le coût historique si le catalogue a changé et ne déduit pas les frais fixes ; ce n'est pas un bénéfice comptable. La valeur du stock multiplie la quantité actuelle par le coût unitaire actuel.

Les écrans Statistiques et Rapports utilisent ces données. Les exports CSV sont assemblés côté navigateur en UTF-8, séparés par des points-virgules ; les rapports globaux omettent les sections Finance ou RH auxquelles l'utilisateur n'a pas accès. Les exports PDF/XLSX et un endpoint de fichier dédié ne sont pas inclus.

Cette route ne crée pas de table et ne nécessite pas de migration.
