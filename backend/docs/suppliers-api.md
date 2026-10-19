# API Fournisseurs

Toutes les routes sont préfixées par `/api/v1` et exigent un access token Bearer. Les fiches sont limitées à l’organisation du compte connecté.

## Routes
- `GET /api/v1/suppliers` : liste les fournisseurs actifs de l’organisation.
- `POST /api/v1/suppliers` : crée une fiche. Réservé à `ADMIN`, `COMMERCIAL` et `STOCK_MANAGER`.
- `PATCH /api/v1/suppliers/:id` : modifie une fiche de l’organisation. Réservé à `ADMIN`, `COMMERCIAL` et `STOCK_MANAGER`.
- `DELETE /api/v1/suppliers/:id` : archive la fiche (suppression logique). Réservé à `ADMIN`.

## Création

```json
{
  "name": "Mada Supplies",
  "category": "Consommables",
  "contactName": "Aina Rakoto",
  "phone": "+261 34 12 345 67",
  "email": "contact@mada-supplies.mg",
  "city": "Antananarivo",
  "notes": "Délai habituel : 3 jours"
}
```

`name` (2–160 caractères) et `category` (2–80 caractères) sont obligatoires. Les coordonnées et notes sont facultatives ; un champ facultatif envoyé vide est enregistré comme `null`. Les e-mails sont normalisés en minuscules. `PATCH` accepte les champs à modifier, y compris `null` pour effacer une coordonnée.

Les créations, modifications et archivages sont consignés dans `audit_logs`. La liste exclut les fiches archivées. Les soldes et volumes de commandes ne sont pas stockés sur la fiche fournisseur : ils seront calculés à partir des modules Achats et Finance.

La migration `Suppliers20260926020000` crée la table `suppliers`, son index organisation/nom et sa clé étrangère vers `organizations`.