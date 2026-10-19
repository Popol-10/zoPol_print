# API Machines et maintenance

Base : `/api/v1/machines`. Les routes exigent un jeton Bearer et limitent toutes les données à l’organisation de l’utilisateur.

## Routes

- `GET /` — liste les machines et leur prochaine maintenance planifiée.
- `POST /` — ajoute une machine. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `PATCH /:id/status` — change l’état opérationnel. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `GET /maintenance` — liste l’historique des interventions.
- `POST /maintenance` — planifie une intervention. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.
- `PATCH /maintenance/:id/status` — fait avancer ou annule une intervention. Réservé à `ADMIN` et `PRODUCTION_MANAGER`.

## Machines

```json
{ "name": "DTF Pro 60", "type": "Imprimante DTF" }
```

Le nom est unique dans un atelier. Les états sont `ACTIVE`, `MAINTENANCE`, `ATTENTION` et `OFFLINE`. Les produits ne peuvent sélectionner que le nom d’une machine enregistrée dans le même atelier. La migration crée les fiches machines correspondant aux noms déjà présents dans les produits afin de conserver les références existantes.

## Maintenance

```json
{
  "machineId": "UUID_DE_LA_MACHINE",
  "scheduledFor": "2026-10-02",
  "kind": "PREVENTIVE",
  "description": "Entretien des têtes d’impression"
}
```

`kind` accepte `PREVENTIVE` ou `CORRECTIVE`. Les interventions commencent à `PLANNED`; elles peuvent passer à `IN_PROGRESS`, puis à `COMPLETED` ou `CANCELLED`. Une intervention en cours met la machine en état `MAINTENANCE`; sa clôture restaure l’état précédent si aucun changement manuel n’a eu lieu entre-temps. Les transitions, créations et changements d’état sont consignés dans `audit_logs`.

La page `/utilisation` affiche le nombre d’ordres actifs du module Production associés au nom de machine. Elle ne calcule pas d’heures ou de pourcentage d’utilisation tant que des relevés machine réels ne sont pas enregistrés.

La migration `Machines20260929000000` crée `machines` et `machine_maintenances`, leurs index et clés étrangères.
