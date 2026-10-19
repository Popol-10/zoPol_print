# API Rémunération

Base : /api/v1/payroll/salaries. Toutes les routes exigent un jeton Bearer et sont réservées à ADMIN et HR_MANAGER. Les données sont limitées à l’organisation de l’utilisateur.

## Routes

- GET / — retourne les employés non archivés et leur salaire mensuel de base lorsqu’il est renseigné. Un salaire et une date d’effet non renseignés sont renvoyés comme null.
- PUT /:employeeId — crée ou remplace le montant mensuel de base et sa date d’effet pour un employé actif de l’organisation.

Exemple :

```json
{
  "monthlyBaseSalary": 850000,
  "effectiveFrom": "2026-10-01"
}
```

Le montant est exprimé en Ariary entiers et doit être compris entre 1 et 1 000 000 000. Les modifications sont inscrites dans audit_logs. L’annuaire Employés ne stocke ni ne renvoie ces montants.

La migration PayrollCompensation20261001000000 crée employee_compensations. Les valeurs de démonstration ne sont pas importées. Cette première version ne gère pas les paiements, les retenues légales, les bulletins ni un historique contractuel structuré ; les changements de montant sont audités.
