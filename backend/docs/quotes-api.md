# API Devis

Toutes les routes requièrent un jeton d'accès. ADMIN et COMMERCIAL peuvent consulter et gérer les devis de leur organisation.

## Routes

- `GET /api/v1/quotes` — liste les devis, du plus récent au plus ancien.
- `POST /api/v1/quotes` — crée un devis en brouillon.
- `PATCH /api/v1/quotes/:id/status` — fait passer un brouillon à envoyé, ou un devis envoyé à refusé/expiré.
- `POST /api/v1/quotes/:id/convert` — convertit un devis envoyé et valide en commande.

Création :

```json
{
  "clientId": "uuid",
  "productId": "uuid",
  "quantity": 2,
  "unitPrice": 12500,
  "validUntil": "2026-10-15",
  "note": "Livraison à convenir"
}
```

Le total est calculé côté serveur. Le client et le produit doivent être actifs et appartenir à l'organisation du jeton. Le devis conserve leurs noms, référence, machine et le prix convenu au moment de sa création. Un devis porte sur un produit, comme une commande dans le workflow actuel.

La conversion exige le statut `SENT` et une date de validité non dépassée. Un devis ne peut être marqué expiré qu’après sa date limite. En une transaction, elle crée une commande non payée avec les instantanés du devis, marque le devis accepté et écrit les événements d'audit. Une nouvelle requête de conversion sur un devis déjà converti retourne la commande existante sans en créer une autre.

Le statut `SENT` indique que l'utilisateur a envoyé l'offre au client hors application ; cette tranche ne transmet pas de courriel. La table `quotes` est créée par la migration `Quotes20261002000000`.
