# API Devis

Toutes les routes requièrent un jeton d'accès. ADMIN et COMMERCIAL peuvent consulter et gérer les devis de leur organisation.

## Routes

- `GET /api/v1/quotes` — liste les devis, du plus récent au plus ancien.
- `POST /api/v1/quotes` — crée un devis en brouillon.
- `POST /api/v1/quotes/:id/send` — envoie le devis par e-mail et le marque envoyé après acceptation par SMTP.
- `PATCH /api/v1/quotes/:id/status` — fait passer un devis envoyé à refusé ou expiré.
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

L'envoi exige un devis en brouillon valide et une adresse e-mail sur la fiche du client. Le serveur récupère le courriel et la devise de l'organisation, envoie le détail du devis par SMTP, puis enregistre le statut et l'audit. Si SMTP n'est pas configuré ou refuse le destinataire, la requête échoue et le devis reste en brouillon. Une requête répétée pour un devis déjà envoyé retourne son état sans réexpédier le courriel.

La conversion exige le statut `SENT` et une date de validité non dépassée. Un devis ne peut être marqué expiré qu’après sa date limite. En une transaction, elle crée une commande non payée avec les instantanés du devis, marque le devis accepté et écrit les événements d'audit. Une nouvelle requête de conversion sur un devis déjà converti retourne la commande existante sans en créer une autre.

Le courriel contient le détail du devis en texte et HTML ; aucun PDF n'est joint. La table `quotes` est créée par la migration `Quotes20261002000000`.
