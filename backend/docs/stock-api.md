# API Stock

Base : `/api/v1/stock`. Toutes les routes requièrent un jeton Bearer et sont limitées à l'organisation de l'utilisateur connecté.

## Articles

- `GET /items` — liste les articles actifs avec quantité, seuil, coût unitaire, valeur estimée et statut calculé.
- `POST /items` — crée une référence avec une quantité initiale de zéro. Réservé aux rôles `ADMIN` et `STOCK_MANAGER`.
- `PATCH /items/:id` — modifie le nom, la référence, la catégorie, le seuil, l'unité ou le coût. Réservé à `ADMIN` et `STOCK_MANAGER`.
- `DELETE /items/:id` — archive logiquement un article dont la quantité est à zéro. Réservé à `ADMIN`.

Exemple de création :

```json
{
  "name": "Encre blanche DTF",
  "reference": "STK-001",
  "category": "Consommables",
  "minimumQuantity": 5,
  "unit": "litres",
  "unitCost": 42000
}
```

La référence est unique par organisation, y compris après archivage. Pour ajouter le stock initial, enregistrer ensuite un mouvement d'entrée afin que l'historique conserve la réception.

## Mouvements

- `POST /movements` — enregistre une entrée, une sortie ou un ajustement. Autorisé à `ADMIN`, `STOCK_MANAGER`, `PRODUCTION_MANAGER` et `OPERATOR`.
- `POST /items/:id/count` — enregistre le comptage physique comme ajustement, après recalcul atomique de l'écart sous verrou. Le comptage et le mouvement sont limités à l'organisation ; mêmes rôles que les mouvements.
- `GET /movements` — retourne une page de mouvements de toute l'organisation ; filtres facultatifs `page`, `pageSize` (maximum 100), `kind`, `itemId` et `search`. La recherche couvre article, référence, origine, note et auteur. Les articles archivés restent visibles dans l'historique.
- `GET /items/:id/movements` — retourne les 50 derniers mouvements d'un article actif.

Exemple d'entrée :

```json
{
  "itemId": "UUID_DE_L_ARTICLE",
  "kind": "ENTRY",
  "quantity": 24,
  "source": "Fournisseur",
  "notes": "Bon de livraison #245"
}
```

Pour `EXIT`, `quantity` reste positive et est soustraite du stock. Pour `ADJUSTMENT`, fournir aussi `direction: "INCREASE"` ou `"DECREASE"`. Le serveur met à jour la quantité et crée l'historique dans la même transaction. Une sortie qui rendrait la quantité négative est refusée.

Pour un inventaire physique, envoyer `POST /items/:id/count` avec la quantité effectivement comptée dans `quantity` et une note facultative. Le serveur verrouille l'article, calcule l'écart depuis la quantité courante, met à jour l'article et inscrit un ajustement `Inventaire` dans la même transaction. Un écart nul est également conservé pour tracer le comptage. La quantité comptée doit être un entier positif ou nul ; un écart supérieur à la capacité du delta signé est refusé.

Chaque mouvement conserve son delta signé, les quantités avant/après, l'utilisateur, l'origine/destination, la note et la date. Les écritures de stock et les créations/mises à jour/archivages d'articles sont aussi consignées dans `audit_logs`.

L'écran `/receptions` permet aux rôles `ADMIN` et `STOCK_MANAGER` de réceptionner une commande fournisseur via `POST /purchases/:id/receipts`. Les bons sont listés avec `GET /purchases/receipts`; chaque réception ajuste le stock, le cumul reçu de la commande et son statut dans une transaction. Les autres rôles autorisés à créer des mouvements peuvent enregistrer une entrée hors commande via `POST /movements`.

## Migration

La migration `Stock20260926030000` crée `stock_items` et `stock_movements`, leurs clés étrangères et leurs index. Elle n'importe pas les anciennes lignes de démonstration du frontend : le catalogue démarre vide par organisation.
