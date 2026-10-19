# API Achats

Les routes sont préfixées par `/api/v1`. Elles exigent un jeton Bearer et limitent chaque lecture et écriture à l'organisation de l'utilisateur.

## Autorisations

- `ADMIN` et `STOCK_MANAGER` peuvent consulter, créer des commandes et enregistrer leurs réceptions.
- Les fournisseurs et articles référencés doivent être actifs et appartenir à la même organisation.
- La création est journalisée dans l'audit sous `PURCHASE_ORDER_CREATED`.

## Lister les commandes fournisseurs

`GET /purchases`

Retourne les commandes de l'organisation, de la plus récente à la plus ancienne, avec les lignes enregistrées et les instantanés du fournisseur et des articles.

```json
[
  {
    "id": "uuid",
    "purchaseNumber": "ACH-2026-1A2B3C4D",
    "supplierId": "uuid",
    "supplierName": "Fournisseur Exemple",
    "status": "ORDERED",
    "expectedDate": "2026-10-20",
    "notes": "Livraison le matin",
    "total": 125000,
    "lineCount": 1,
    "lines": [
      {
        "id": "uuid",
        "stockItemId": "uuid",
        "itemName": "T-shirt blanc",
        "itemReference": "TSH-WHT",
        "unit": "pièce",
        "quantityOrdered": 10,
        "quantityReceived": 0,
        "quantityRemaining": 10,
        "unitCost": 12500,
        "total": 125000
      }
    ],
    "createdAt": "2026-10-08T08:00:00.000Z",
    "updatedAt": "2026-10-08T08:00:00.000Z"
  }
]
```

## Créer une commande fournisseur

`POST /purchases`

```json
{
  "supplierId": "uuid",
  "expectedDate": "2026-10-20",
  "notes": "Livraison le matin",
  "lines": [
    { "stockItemId": "uuid", "quantity": 10, "unitCost": 12500 },
    { "stockItemId": "another-uuid", "quantity": 5, "unitCost": 4800.5 }
  ]
}
```

Le serveur attribue un numéro `ACH-AAAA-XXXXXXXX`, recalcule le total, stocke le nom/référence/unité des articles comme instantanés et crée la commande et ses lignes dans une transaction. Une commande comprend de 1 à 100 articles distincts. Les quantités sont des entiers positifs ; les coûts unitaires ont au plus deux décimales.

La création d'une commande ne modifie pas les quantités de Stock. À la réception, le serveur enregistre un bon groupé, crée une entrée de stock par ligne, augmente `quantityReceived` et recalcule l'état de commande (`ORDERED`, `PARTIALLY_RECEIVED` ou `RECEIVED`). Un article non commandé, une commande d'une autre organisation, une ligne inactive, une quantité supérieure au restant ou un stock qui dépasserait sa capacité fait échouer toute l'opération. Le bon, les lignes, mouvements de stock, quantités reçues, statut et audit sont enregistrés dans la même transaction.

## Consulter les bons de réception

`GET /purchases/receipts`

Retourne les 200 bons les plus récents de l'organisation avec commande, fournisseur, référence du bon fournisseur, auteur et lignes reçues.

## Enregistrer une réception partielle ou complète

`POST /purchases/:purchaseOrderId/receipts`

```json
{
  "deliveryReference": "BL-2026-018",
  "notes": "Deux cartons reçus, un carton reste attendu.",
  "lines": [{ "purchaseOrderLineId": "uuid-ligne", "quantity": 8 }]
}
```

Les quantités demandées doivent être positives et ne peuvent pas dépasser le restant à livrer de chaque ligne. Une même ligne ne peut figurer qu'une fois dans une réception. Les commandes entièrement reçues ne peuvent plus être réceptionnées. L'accès aux bons liés est réservé à `ADMIN` et `STOCK_MANAGER` ; les autres rôles autorisés à créer des mouvements Stock peuvent toujours enregistrer une entrée hors commande depuis `/receptions`. Les mouvements d'entrée enregistrés avant ce workflow restent dans l'historique Stock et ne sont pas associés rétroactivement à une commande.

## Migration

La migration `Purchases20261008000000` crée `purchase_orders` et `purchase_order_lines`, avec clés étrangères vers l'organisation, le fournisseur et l'article Stock. La migration `PurchaseReceipts20261017000000` ajoute le suivi des quantités reçues et crée les tables des bons et de leurs lignes. Elle a été appliquée à la base MySQL configurée le 17 octobre 2026. Pour une autre base, exécuter `npm run migration:run` depuis `backend/`.
