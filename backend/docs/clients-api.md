# API Clients

Toutes les routes sont préfixées par `/api/v1` et exigent un access token Bearer.
Les clients sont toujours isolés par l'organisation associée au compte connecté.

## Routes

- `GET /api/v1/clients` : liste les clients de l'organisation.
- `POST /api/v1/clients` : crée un client. Réservé aux rôles `ADMIN` et `COMMERCIAL`.
- `PATCH /api/v1/clients/:id` : modifie les coordonnées d'un client de l'organisation. Réservé aux rôles `ADMIN` et `COMMERCIAL`.
- `DELETE /api/v1/clients/:id` : archive le client (suppression logique). Réservé au rôle `ADMIN`.

## Création

```json
{
  "name": "Aina Rakoto",
  "company": "Atelier Aina",
  "phone": "+261 34 00 000 00",
  "email": "aina@example.mg",
  "city": "Antananarivo",
  "type": "INDIVIDUAL"
}
```

`name` est obligatoire (2 à 160 caractères). Les coordonnées sont facultatives. `type` accepte `INDIVIDUAL`, `COMPANY` ou `RESELLER`. Les e-mails sont normalisés en minuscules.

La réponse contient l'identifiant UUID, les coordonnées et les dates de création et de mise à jour. Elle ne contient pas encore de statistiques de commandes, de chiffre d'affaires ou de solde : ces montants seront calculés lorsque les modules Commandes et Finance seront intégrés.

Les créations, modifications et archivages sont consignés dans `audit_logs`. L'archivage conserve l'enregistrement en base et l'exclut des listes courantes.

La migration `Clients20260926000000` crée la table `clients` et rend le champ d'événement d'audit extensible pour les prochains modules.
