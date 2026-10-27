# Configuration des e-mails

Le backend utilise SMTP et Nodemailer pour les liens de récupération de mot de passe et l'envoi des devis. Aucun fournisseur précis n'est imposé : utilisez les identifiants SMTP de votre fournisseur transactionnel ou de votre messagerie.

## Configuration locale

Dans `backend/.env`, renseignez des valeurs réelles et activez SMTP :

```dotenv
RESET_PASSWORD_URL=http://localhost:5173/reinitialiser-mot-de-passe

SMTP_ENABLED=true
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-identifiant-smtp
SMTP_PASSWORD=votre-mot-de-passe-smtp
SMTP_FROM="MAK'ART <no-reply@votre-domaine.com>"
```

Utilisez `SMTP_SECURE=true` seulement lorsque votre fournisseur exige TLS implicite, généralement avec le port `465`. Le port `587` utilise habituellement `SMTP_SECURE=false` et STARTTLS.

Pour Gmail, n'utilisez pas le mot de passe normal du compte : créez un mot de passe d'application, puis utilisez `smtp.gmail.com`, le port `587` et `SMTP_SECURE=false`.

## Fonctionnement des devis

Le bouton « Envoyer par e-mail » de `/devis` envoie le devis à l'adresse enregistrée sur la fiche du client. Le statut passe à « Envoyé » uniquement lorsque le serveur SMTP accepte le destinataire. Si l'envoi échoue, le devis reste en brouillon. Le message contient les lignes et le montant, sans pièce jointe PDF.

## Vérification

1. Redémarrez le backend après avoir modifié `.env`.
2. Vérifiez que le client d'un devis possède une adresse e-mail valide.
3. Depuis `/devis`, envoyez un brouillon et vérifiez la réception du message ; le statut doit passer à « Envoyé ».
4. Sur `/connexion`, utilisez « Mot de passe oublié ? » pour vérifier aussi l'envoi du lien de récupération. La réponse API reste volontairement identique même si l'adresse n'existe pas.

Ne commitez jamais `SMTP_PASSWORD` ni les secrets du fournisseur.
