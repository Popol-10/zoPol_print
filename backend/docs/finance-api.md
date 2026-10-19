# API Finance

Base : `/api/v1/finance`. Les routes exigent un jeton Bearer et sont limitées à l’organisation de l’utilisateur. Les consultations et écritures comptables sont réservées à ADMIN et ACCOUNTANT ; la réception d’un paiement de commande est aussi autorisée à COMMERCIAL.

## Routes

- GET `/summary` — soldes calculés depuis les mouvements, revenus et dépenses cumulés, et série mensuelle des six derniers mois. Les transferts changent les soldes par compte sans augmenter revenus ou dépenses.
- GET `/transactions` — liste paginée et filtrable des mouvements. Paramètres : page, pageSize (maximum 100), type, method et search. Les transferts apparaissent comme une sortie sur le compte source et une entrée sur le compte destinataire.
- POST `/transactions` — ajoute une entrée, une dépense ou un solde initial. Les acomptes liés aux commandes ne peuvent pas passer par cette route.
- POST `/orders/:orderId/payments` — enregistre un paiement client sur une commande et renvoie la commande actualisée.
- POST `/transfers` — déplace un montant entre deux comptes, sans le compter comme revenu ou dépense.
- GET `/reconciliations` — liste les 24 dernières périodes de rapprochement.
- GET `/reconciliations/:id` — renvoie la période et les mouvements Banque correspondants.
- POST `/reconciliations` — ouvre une période avec ses dates et les soldes d’ouverture et de clôture du relevé.
- POST `/reconciliations/:id/transactions/:transactionId/match` — marque un mouvement Banque comme vérifié contre le relevé.
- DELETE `/reconciliations/:id/transactions/:transactionId/match` — retire le pointage d’un mouvement tant que la période est ouverte.
- POST `/reconciliations/:id/complete` — clôture la période si tous les mouvements sont pointés et si le solde calculé égale le relevé.
- DELETE `/reconciliations/:id` — annule une période ouverte qui ne contient aucun mouvement pointé.

Exemple d’entrée :

```json
{
  "type": "INCOME",
  "label": "Règlement commande",
  "category": "SALES",
  "method": "CASH",
  "amount": 150000,
  "transactionDate": "2026-10-01"
}
```

Les types sont INCOME, EXPENSE et OPENING_BALANCE. Les comptes sont CASH, BANK et MOBILE_MONEY. Les montants sont des Ariary entiers positifs. Les catégories autorisées sont validées avec le type ; un solde initial n’a pas de catégorie et augmente le solde du compte sans être compté comme revenu.

Pour transférer entre deux comptes :

```json
{
  "sourceMethod": "CASH",
  "destinationMethod": "BANK",
  "amount": 50000,
  "label": "Dépôt à la banque",
  "transactionDate": "2026-10-01"
}
```

Les comptes source et destinataire doivent être différents. L’API crée deux mouvements associés par le même `transferId` dans une transaction : une sortie du compte source et une entrée sur le compte destinataire. Le transfert et son audit sont atomiques. Les soldes des comptes changent, mais les revenus et dépenses restent inchangés. Cette route est réservée à ADMIN et ACCOUNTANT.

Pour recevoir un paiement de commande :

```json
{
  "amount": 25000,
  "method": "CASH",
  "transactionDate": "2026-10-01"
}
```

Le backend verrouille la commande dans une transaction, vérifie le reste dû, ajoute une entrée `INCOME` de catégorie `CLIENT_DEPOSIT` avec le numéro de commande, puis met à jour `paidAmount`. Le mouvement et le solde payé sont validés ensemble. Un paiement supérieur au reste dû est refusé. La route est réservée à ADMIN, ACCOUNTANT et COMMERCIAL.

Le registre est append-only : il n’existe pas de route de modification ou de suppression. Une correction se fait par une opération compensatrice. Toutes les créations sont auditées. Les anciennes transactions fictives ne sont pas importées. Les `paidAmount` déjà enregistrés sur les commandes existantes sont conservés ; aucun encaissement historique n’est inventé dans le registre.

Les rapprochements sont limités au compte `BANK`. Les écritures OPENING_BALANCE restent des soldes de départ et ne sont pas pointées comme des mouvements du relevé. L’utilisateur saisit les soldes initial et final du relevé, vérifie manuellement chaque mouvement affiché, puis clôture la période. Le backend interdit les périodes qui se chevauchent ; il refuse la clôture si un mouvement reste non pointé ou si le solde calculé diffère du relevé. Une période clôturée bloque les nouvelles écritures rétroactives à ses dates. Les lignes de relevé ne sont pas importées ; le pointage confirme manuellement la comparaison avec le document bancaire.

Les migrations `FinanceTransactions20261001010000`, `LinkedOrderPayments20261001020000`, `FinanceTransfers20261001030000` et `BankReconciliation20261001040000` créent le registre, les liens et les sessions de rapprochement.
