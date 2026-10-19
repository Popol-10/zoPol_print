# API Production

Base : `/api/v1/production`. Toutes les routes nécessitent un jeton Bearer et limitent les résultats à l’organisation de l’utilisateur.

## Routes

- `GET /tasks` — liste les tâches de production avec les informations de la commande liée.
- `GET /orders` — liste les commandes confirmées qui ne sont pas encore planifiées. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `POST /tasks` — planifie une commande confirmée. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `PATCH /tasks/:id/assignee` — affecte un employé actif par son identifiant, ou désaffecte la tâche avec `employeeId: null`. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `PATCH /tasks/:id/schedule` — crée, modifie ou retire le créneau d'une tâche. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `PATCH /tasks/:id/stage` — fait avancer une tâche d’une étape. Accessible à `ADMIN`, `PRODUCTION_MANAGER` et `OPERATOR`.

## Planification

L'écran `/planning` affiche les tâches de `GET /tasks`, leurs échéances, créneaux, machines et opérateurs. Les rôles `ADMIN` et `PRODUCTION_MANAGER` peuvent planifier une commande disponible ou modifier/retirer le créneau d'une tâche non terminée. Le créneau est une date calendaire locale et des heures `HH:mm`; la machine et l'échéance viennent de la commande.

```json
{
  "orderId": "UUID_DE_LA_COMMANDE",
  "scheduledDate": "2026-10-20",
  "scheduledStartTime": "08:00",
  "scheduledEndTime": "10:30"
}
```

Les trois champs de créneau sont facultatifs lors du `POST /tasks` pour conserver la compatibilité des autres écrans ; ils doivent être fournis ensemble s'ils sont utilisés. Une commande ne peut avoir qu’une seule tâche. La commande et sa tâche passent ensemble au statut `À produire`. L’opération est transactionnelle et ne peut viser qu’une commande de la même organisation au statut `Confirmé` ou `À produire`.

```json
{
  "scheduledDate": "2026-10-21",
  "scheduledStartTime": "13:00",
  "scheduledEndTime": "15:00"
}
```

`PATCH /tasks/:id/schedule` remplace les trois valeurs à la fois. Pour retirer le créneau, envoyer explicitement les trois champs à `null`. La fin doit être postérieure au début. Le serveur refuse les chevauchements le même jour sur une machine ou sur un employé déjà affecté ; deux créneaux qui se touchent sont autorisés. Les mises à jour de créneau sont sérialisées par organisation et inscrites dans l'audit `PRODUCTION_SCHEDULE_UPDATED`. Le créneau d'une tâche terminée ne peut plus être modifié.

Le statut d’une commande passé à `À produire`, `En production` ou `Contrôle qualité` depuis l’API Commandes crée aussi la tâche correspondante si elle n’existe pas encore. Les changements d’étape faits depuis Production mettent à jour le statut Commandes dans la même transaction.

## Étapes et affectation

Les étapes avancent dans l’ordre `À produire` → `En production` → `Contrôle qualité` → `Terminé`. La route Production refuse de sauter ou de reculer une étape ; les changements de statut effectués depuis Commandes sont répercutés dans la tâche liée. Le statut `Terminé` de la tâche met la commande au statut `Terminé`.

```json
{ "employeeId": "UUID_DE_L_EMPLOYE" }
```

Pour désaffecter : `{ "employeeId": null }`.

```json
{ "stage": "En production" }
```

La tâche référence un Employé actif via `employeeId`. Le nom est aussi conservé dans `operatorName` et recopié dans la commande pour l’affichage historique. Les anciens noms libres ne sont pas associés automatiquement ; un gestionnaire peut les remplacer par un employé du répertoire ou désaffecter la tâche. La machine et l’échéance viennent de la commande ; aucune capacité ou statistique machine n’est simulée.

La migration `Production20260928010000` crée `production_tasks`, impose une tâche au maximum par commande et ajoute les clés étrangères vers `organizations` et `orders`.

La migration `ProductionSchedule20261017020000` ajoute les trois colonnes calendaires/horaires nullable et l'index de recherche des créneaux. Elle a été appliquée et vérifiée le 17 octobre 2026 sur la base configurée (28 migrations enregistrées) ; exécuter `npm run migration:run` dans chaque autre base.

Les réponses de tâche incluent `employeeId` (nul si non affectée) et `operatorName` pour l’affichage. Le backend refuse les employés inactifs, archivés ou rattachés à un autre atelier. Les anciens noms stockés dans `operator_name` restent des instantanés non liés jusqu’à une affectation manuelle.

La migration `ProductionEmployee20260930010000` ajoute la clé étrangère facultative `employee_id` vers `employees` et un index. Elle a été appliquée et vérifiée le 30 septembre 2026 ; elle conserve les noms existants sans tenter de les associer automatiquement.
