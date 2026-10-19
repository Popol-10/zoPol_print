# API des tâches RH

Base : /api/v1/hr/tasks. Toutes les routes exigent un jeton Bearer. Les tâches et les employés associés sont limités à l’organisation de l’utilisateur. L’accès est réservé aux rôles ADMIN et HR_MANAGER.

## Routes

- GET / — liste les tâches actives, triées par échéance.
- POST / — crée une tâche à faire.
- PATCH /:id — modifie le titre, les consignes, l’échéance, l’employé affecté ou le statut.
- DELETE /:id — archive une tâche sans supprimer son historique.

Exemple de création :

```json
{
  "title": "Préparer les commandes du jour",
  "description": "Vérifier les fiches avant le lancement.",
  "dueDate": "2026-10-01",
  "employeeId": "UUID_EMPLOYE_OU_NULL"
}
```

L’affectation est facultative. Lorsqu’un employé est indiqué, il doit être actif et rattaché à la même organisation. Les statuts sont TODO, IN_PROGRESS et COMPLETED. La modification accepte ces mêmes champs ; l’archivage est logique et journalisé dans audit_logs.

La migration HrTasks20260930020000 crée employee_tasks, ses clés étrangères et ses index ; elle a été appliquée et vérifiée le 30 septembre 2026. Elle ne reprend pas les tâches fictives de démonstration. L’interface commence donc avec une liste vide.
