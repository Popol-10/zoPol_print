# API Présences

Base : `/api/v1/attendance`. Toutes les routes exigent un jeton Bearer et limitent les résultats à l’organisation de l’utilisateur.

## Routes

- `GET /?date=YYYY-MM-DD` — retourne une ligne pour chaque dossier Employé non archivé de l’organisation, y compris ceux sans pointage (`NOT_RECORDED`). Réservé à `ADMIN` et `HR_MANAGER`.
- `PUT /:employeeId` — crée ou remplace le pointage de l’employé pour la date envoyée ; réservé à `ADMIN` et `HR_MANAGER`. La contrainte unique employé/date rend l’opération répétable sans créer de doublon.

Exemple de corps :

```json
{
  "date": "2026-09-30",
  "status": "PRESENT",
  "checkIn": "08:30",
  "checkOut": "17:00"
}
```

`status` accepte `PRESENT`, `LATE`, `ABSENT` et `LEAVE`. Les absences et congés n’ont pas d’heure de pointage. Un statut présent ou retard exige une heure d’arrivée ; l’heure de sortie est facultative et doit être postérieure à l’arrivée. Les durées sont calculées en minutes à partir des heures locales saisies. Les horaires de nuit qui passent minuit ne sont pas pris en charge.

Les créations et corrections alimentent `audit_logs`. La migration `Attendance20260930000000` crée `attendance_records`, l’unicité employé/jour et les clés étrangères organisation/employé. Elle est appliquée et vérifiée le 30 septembre 2026.
