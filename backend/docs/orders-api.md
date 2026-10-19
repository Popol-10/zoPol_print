# API Commandes

Base : `/api/v1/orders`. Les routes requièrent un jeton Bearer et chaque commande est limitée à l'organisation de l'utilisateur.

## Routes

- `GET /` — liste les commandes de l'organisation, récentes en premier.
- `POST /` — crée une commande pour un client et un produit actifs de la même organisation. Réservé à `ADMIN` et `COMMERCIAL`.
- `PATCH /:id/status` — change le statut d'une commande. Réservé à `ADMIN`, `COMMERCIAL`, `PRODUCTION_MANAGER` et `OPERATOR`.

## Création

```json
{
  "clientId": "UUID_DU_CLIENT",
  "productId": "UUID_DU_PRODUIT",
  "quantity": 3,
  "priority": "Haute",
  "dueDate": "2026-10-15"
}
```

Le prix unitaire et le total sont calculés côté serveur depuis le produit enregistré. Une nouvelle commande commence avec `paidAmount` à zéro ; les règlements se font dans Finance par `POST /api/v1/finance/orders/:orderId/payments`. Le client, le produit et la commande doivent appartenir à l’organisation de l’utilisateur. La commande conserve les noms, la référence, la machine et le prix comme instantanés afin que les changements ultérieurs au catalogue ne modifient pas les commandes existantes.

La priorité enregistrée par l'API est `Normale`, `Haute` ou `Urgente`. Pour compatibilité avec une interface déjà ouverte, la valeur `Urgent` est convertie en `Urgente` avant validation.

Quand le statut passe à `À produire`, `En production` ou `Contrôle qualité`, la tâche de production est créée ou synchronisée dans la même transaction que la commande. Voir [`production-api.md`](production-api.md).

Le formulaire actuel crée une ligne produit par commande. Toute nouvelle commande démarre au statut `Nouveau` et sans paiement ; les paiements partiels et le solde dû sont suivis depuis le détail Commandes et inscrits dans le registre Finance. Les commandes déjà créées gardent leur `paidAmount` existant sans création rétroactive de mouvements financiers. Les statuts sont validés par l’API et les changements sont consignés dans `audit_logs`.

La migration `Orders20260928000000` crée `orders` avec des clés étrangères vers `organizations`, `clients` et `products`, une référence de commande unique par organisation et des index de liste/statut.

## Utilisation dans l'écran Ventes

L'écran `/ventes` consomme `GET /orders` pour afficher les commandes, leurs statuts, leur total, le montant reçu et le solde restant. La création réutilise le formulaire commande et `POST /orders` ; les paiements passent par Finance depuis le détail d'une commande.
