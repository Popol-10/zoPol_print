# API Factures

Les factures sont émises à partir des commandes de vente existantes. Toutes les routes demandent un jeton Bearer valide et sont accessibles aux rôles `ADMIN`, `ACCOUNTANT` et `COMMERCIAL`. Les données sont limitées à l'organisation du jeton.

## Lister les factures

`GET /api/v1/invoices`

Retourne les factures de l'organisation avec leur commande, les lignes figées à l'émission, le total encaissé et le solde restant. Les encaissements sont lus depuis la commande et son registre Finance ; cette API ne crée pas de mouvement financier.

```json
[
  {
    "id": "uuid",
    "invoiceNumber": "FAC-2026-1A2B3C4D",
    "orderId": "uuid",
    "orderNumber": "CMD-2026-1A2B3C4D",
    "clientName": "Client Exemple",
    "clientCompany": "Atelier Exemple",
    "issuedAt": "2026-10-17",
    "total": 125000,
    "paidAmount": 25000,
    "balanceDue": 100000,
    "paymentStatus": "PARTIALLY_PAID",
    "lines": [
      {
        "id": "uuid",
        "productName": "T-shirt personnalisé",
        "productReference": "TS-01",
        "machine": "Presse à chaud",
        "quantity": 5,
        "unitPrice": 25000,
        "lineTotal": 125000
      }
    ]
  }
]
```

`paymentStatus` est calculé à la lecture : `ISSUED`, `PARTIALLY_PAID` ou `PAID`.

## Commandes qui peuvent être facturées

`GET /api/v1/invoices/eligible-orders`

Retourne les commandes non annulées qui n'ont pas encore de facture dans l'organisation. Une commande ne peut avoir qu'une facture.

## Émettre une facture depuis une commande

`POST /api/v1/invoices/from-order/:orderId`

L'émission fige le client, le produit, la quantité, le prix et le total de la commande, génère un numéro `FAC-AAAA-XXXXXXXX`, puis journalise l'événement `INVOICE_ISSUED`. La date d'émission suit le fuseau horaire de l'organisation. La création de l'en-tête, de sa ligne et de la trace d'audit est atomique. Répéter la requête pour une commande déjà facturée retourne la facture existante.

Les paiements ultérieurs passent par `POST /api/v1/finance/orders/:orderId/payments` et actualisent le montant encaissé et le solde affichés dans la facture.

## Limites actuelles

Le schéma Commande comporte un seul article et ne stocke pas de taxes, de numéro fiscal ou de conditions de paiement. Les factures reflètent donc exactement cette commande ; le calcul de taxe, l'échéance, le PDF et l'envoi au client ne sont pas inclus.
