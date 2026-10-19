# API des paramètres d’organisation

Les routes sont protégées par authentification et utilisent l’organisation du jeton : aucun identifiant d’organisation ne peut être fourni par le client.

## Lire les paramètres

`GET /api/v1/organizations/me/settings` retourne le nom, l’adresse, la devise et le fuseau horaire de l’organisation du compte connecté. Tous les membres peuvent les consulter.

## Modifier les paramètres

`PUT /api/v1/organizations/me/settings` est réservé au rôle `ADMIN`. Le nom, la devise et le fuseau horaire sont obligatoires ; l’adresse peut être une chaîne ou `null`.

```json
{
  "name": "MAK'ART",
  "address": "Antananarivo, Madagascar",
  "currency": "MGA",
  "timezone": "Indian/Antananarivo"
}
```

Les devises disponibles sont `MGA`, `EUR`, `USD` et `GBP`. Les fuseaux proposés sont `Indian/Antananarivo`, `Africa/Nairobi`, `Africa/Johannesburg`, `Europe/Paris`, `Europe/London`, `America/New_York`, `America/Los_Angeles`, `Asia/Dubai`, `Asia/Kolkata` et `Asia/Tokyo`.

La réponse contient les paramètres enregistrés. Les modifications sont tracées dans `audit_logs` sous `ORGANIZATION_SETTINGS_UPDATED`, avec les noms des champs changés. La sauvegarde et l’écriture d’audit sont exécutées dans la même transaction. L’adresse est stockée dans la colonne `organizations.address`, créée par la migration `OrganizationSettings20261016010000`.

La devise sélectionnée est utilisée pour afficher les montants dans l’interface, les formulaires financiers et les en-têtes des exports CSV. Le fuseau est utilisé pour calculer les alertes de date et valider les dates de naissance. Aucun taux de change n’est appliqué : changer de devise modifie l’unité affichée, pas les valeurs déjà stockées.
