# Envoi réel des e-mails de récupération

Le backend utilise SMTP et Nodemailer. Aucun fournisseur précis n'est imposé : utilisez les identifiants SMTP de votre fournisseur transactionnel ou de votre messagerie.

## Configuration locale

Dans `backend/.env`, renseignez des valeurs réelles et activez SMTP :

```dotenv
RESET_PASSWORD_URL=http://localhost:8080/reinitialiser-mot-de-passe

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

## Vérification

1. Redémarrez le backend après avoir modifié `.env`.
2. Sur `/connexion`, utilisez « Mot de passe oublié ? ».
3. La réponse reste volontairement identique même si l'adresse n'existe pas.
4. Lorsque SMTP est actif, le terminal affiche `E-mail de réinitialisation envoyé à ...` et le lien arrive dans la boîte du destinataire.

Ne commitez jamais `SMTP_PASSWORD` ni les secrets du fournisseur.
