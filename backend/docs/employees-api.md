# API Employés

Base : `/api/v1/employees`. Toutes les routes exigent un jeton Bearer et limitent les enregistrements à l’organisation de l’utilisateur.

## Routes

- `GET /` — liste les dossiers non archivés de l’organisation ; tout utilisateur authentifié peut consulter l’annuaire.
- `POST /` — crée un dossier ; réservé à `ADMIN` et `HR_MANAGER`.
- `PATCH /:id` — met à jour le nom, le poste, les coordonnées ou le statut ; réservé à `ADMIN` et `HR_MANAGER`.
- `DELETE /:id` — archive le dossier sans supprimer l’historique ; réservé à `ADMIN` et `HR_MANAGER`.

## Champs

`name` et `position` sont obligatoires. `phone` et `email` sont facultatifs. `status` vaut `ACTIVE` ou `INACTIVE`. Les dossiers archivés sont exclus de la liste par défaut. Les changements sont consignés dans `audit_logs`.

Cette API d’annuaire ne contient aucun salaire. La vue Rémunération reste simulée et son accès est limité à ADMIN et HR_MANAGER côté interface. Le module paie devra utiliser des routes backend dédiées avant toute exposition de données réelles.

Aucune ligne de démonstration n’est importée par la migration ; les dossiers sont créés via l’API. La migration `Employees20260929010000` crée la table `employees` avec une clé étrangère vers l’organisation et des index de consultation. Elle a été appliquée et vérifiée le 29 septembre 2026.
