# API Produits

Toutes les routes sont préfixées par `/api/v1` et exigent un access token Bearer. Les produits sont isolés par l'organisation du compte connecté.

## Routes

- `GET /api/v1/products` : liste les produits actifs de l'organisation.
- `POST /api/v1/products` : crée un produit. Réservé aux rôles `ADMIN`, `COMMERCIAL` et `PRODUCTION_MANAGER`.
- `PATCH /api/v1/products/:id` : modifie un produit de l'organisation. Réservé aux rôles `ADMIN`, `COMMERCIAL` et `PRODUCTION_MANAGER`.
- `DELETE /api/v1/products/:id` : archive le produit (suppression logique). Réservé au rôle `ADMIN`.

## Création

```json
{
  "name": "T-shirt DTF personnalisé",
  "reference": "ART-131",
  "category": "DTF",
  "price": 35000,
  "cost": 18500,
  "stock": 8,
  "unit": "unité",
  "machine": "Presse à chaud",
  "duration": "10 min",
  "color": "#fce7f3"
}
```

`name` (2–160 caractères), `reference` (2–64 caractères, unique par organisation), `category`, prix, coût, stock initial (entier, zéro autorisé), unité, machine, durée et couleur sont obligatoires. La référence est convertie en majuscules. La modification via `PATCH` accepte un sous-ensemble de ces champs. Les catégories possibles sont `DTF`, `Textile`, `Laser`, `Acrylique`, `Bois`, `Personnalisation` et `Accessoires`. Le prix doit être supérieur à zéro ; le coût peut être nul. Les montants acceptent deux décimales au plus. `stock` est un entier positif ou nul, limité à 2 147 483 647.

La réponse contient les champs du produit et ses dates de création et de mise à jour. Le stock enregistré ici est une quantité initiale ; les mouvements, seuils configurables et ajustements seront gérés dans le module Stock. Les marges affichées dans l'écran sont calculées à partir du prix et du coût enregistrés.

Les créations, modifications et archivages sont consignés dans `audit_logs`. L'archivage conserve l'enregistrement en base et l'exclut des listes courantes. Une référence reste réservée même après archivage.

La migration `Products20260926010000` crée la table `products`, son index de référence par organisation et sa clé étrangère vers `organizations`.
