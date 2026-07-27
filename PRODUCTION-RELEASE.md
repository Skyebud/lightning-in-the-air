# Lightning in the Air — Production Release Candidate

## Included
- Firestore-only public content; no starter-data loader or JSON fallback.
- Live updates for shows, media, members, and site settings.
- Admin booking inbox with statuses and private notes.
- Secure callable booking submission with validation and rate limiting.
- Email queue integration for the Firebase Trigger Email extension.
- Image focal-point and zoom controls.

## Required deployment steps
1. Preserve your existing `js/firebase-config.js` when copying this release over the repository.
2. Publish `firestore.rules` and `storage.rules`.
3. Upgrade the Firebase project to Blaze before deploying Cloud Functions.
4. From this folder, run `firebase deploy --only functions`.
5. Install Firebase's **Trigger Email** extension and configure it to watch the `mail` collection using the band's SMTP account.
6. Confirm `site/settings.bookingEmail` contains the band's booking email.
7. Submit a test inquiry and verify both the email and the admin inbox.
8. Test every page on mobile before connecting the custom domain.

## Domain readiness
Do not add a `CNAME` file until the final domain is chosen. After DNS is configured, add canonical URLs, regenerate `sitemap.xml`, and update the social-sharing URL metadata.
