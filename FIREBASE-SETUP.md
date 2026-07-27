# Firebase setup — Lightning in the Air

## 1. Connect the web app

Keep the working values already saved in `js/firebase-config.js`. The Firebase web configuration is public client configuration; access is controlled by Authentication and Security Rules.

## 2. Authentication and admin access

1. Enable Email/Password sign-in.
2. Create the administrator in Authentication → Users.
3. In Firestore, create `admins/{USER_UID}` with:
   - `active`: Boolean `true`
   - `email`: the administrator email
   - `name`: the administrator name

## 3. Firestore and Storage

Publish `firestore.rules`. If photo uploads are enabled, create the default Storage bucket and publish `storage.rules`.

The production site reads content only from Firestore. There is no starter-content loader or local JSON fallback.

## 4. Booking inquiries and email notifications

Booking inquiries use the callable Cloud Function in `functions/index.js`.

1. Upgrade the Firebase project to Blaze, which is required for deploying Cloud Functions.
2. Install the Firebase CLI and sign in.
3. From the project folder, run:

```bash
npm install --prefix functions
firebase deploy --only functions
```

4. In Firebase Extensions, install **Trigger Email**.
5. Configure the extension to watch the `mail` collection.
6. Connect the band's SMTP account during extension setup.
7. Confirm `site/settings.bookingEmail` is the correct band booking address.

The callable function validates and rate-limits submissions, saves each request to `bookingRequests`, and queues an email document for the Trigger Email extension. Administrators can read and manage requests from the dashboard.

## 5. Live updates and publishing

Published shows, videos, photos, member profiles, and settings update automatically on open public pages. Draft items remain visible only to authorized administrators.

## 6. Image controls

Photo and member forms include focal-point and zoom controls. Saved values are used by the public card and thumbnail layouts.

## 7. Final verification

- Submit a booking inquiry and verify the email arrives.
- Confirm the inquiry appears in the admin dashboard.
- Test sign-in, sign-out, draft visibility, photo upload, video embeds, and mobile navigation.
- Keep public registration disabled.
