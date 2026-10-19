# API Notifications

Les routes sont préfixées par `/api/v1` et exigent un jeton Bearer. Les notifications sont construites à partir des événements métier déjà inscrits dans `audit_logs`. Les résultats sont limités à l'organisation du compte connecté et filtrés selon ses rôles.

## Consulter le fil

`GET /notifications`

Retourne les 30 activités récentes disponibles pour le compte, leur état de lecture et le nombre de notifications non lues parmi ces activités.

```json
{
  "items": [
    {
      "id": "event:uuid-de-la-activite",
      "title": "Commande fournisseur créée",
      "detail": "ACH-2026-1A2B3C4D · 3 article(s)",
      "route": "/achats",
      "createdAt": "2026-10-15T08:00:00.000Z",
      "isRead": false
    }
  ],
  "unreadCount": 1
}
```

Les activités couvrent les principales opérations de Commerce, Commandes, Achats, Stock, Production, Machines, Finance, RH et gestion des membres. Les alertes calculées comprennent les articles au seuil ou en rupture, les commandes dues aujourd'hui/demain ou en retard, et les maintenances planifiées dans les cinq prochains jours ou en retard. Elles sont limitées aux rôles qui gèrent ces modules. Les liens Finance et RH ne sont présentés qu'aux rôles autorisés.

## Préférences

`GET /notifications/preferences` retourne les préférences du compte. Par défaut, les trois types d'alertes sont activés.

`PUT /notifications/preferences` enregistre les préférences de l'utilisateur connecté :

```json
{
  "lowStockEnabled": true,
  "orderDueEnabled": true,
  "maintenanceEnabled": false
}
```

Les préférences sont indépendantes pour chaque compte. Elles contrôlent les alertes calculées ; elles ne désactivent pas les activités métier auditées.

## Marquer comme lu

`POST /notifications/read`

```json
{
  "notificationIds": ["event:uuid-de-la-activite", "alert:stock:uuid:timestamp"]
}
```

La requête accepte de 1 à 30 identifiants uniques. Les états de lecture sont enregistrés séparément pour chaque utilisateur ; un identifiant d'une autre organisation ou non visible pour le rôle connecté ne peut pas être marqué comme lu. Une alerte calculée est considérée comme nouvelle si son état métier change ou si elle réapparaît avec une nouvelle échéance.

## Comportement de l'interface

La cloche de la barre ERP charge le fil à l'ouverture, au retour sur l'onglet et toutes les minutes tant que l'application est visible. Le badge reflète les activités non lues. Un clic sur une activité la marque comme lue puis ouvre le module correspondant ; « Tout lire » marque toutes les activités affichées.

Ce mécanisme fournit des notifications internes à l'application. Il ne déclenche ni notification du navigateur, ni SMS, ni e-mail. Les échéances de commande reposent sur des dates calendaires, car le modèle Commande ne stocke pas d'heure de livraison.

## Migration

La migration `Notifications20261008010000` crée `notification_reads` et `notification_preferences`, avec une clé primaire par utilisateur pour les deux tables. Elle est enregistrée comme exécutée dans la base configurée, et les deux tables ont été vérifiées le 16 octobre 2026. Pour une nouvelle base, exécuter `npm run migration:run` depuis `backend/`.
