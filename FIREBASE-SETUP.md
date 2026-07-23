# Firebase setup for the Lightning in the Air admin dashboard

The public website works immediately from the local `data/site-content.json` file. The admin sign-in and live content editing become active after these Firebase steps are completed.

## 1. Create the Firebase project

1. Go to Firebase Console and create a project.
2. Add a **Web app** to the project.
3. Copy the displayed `firebaseConfig` values into `js/firebase-config.js`.

## 2. Enable the three services

### Authentication

1. Open **Authentication**.
2. Enable the **Email/Password** provider.
3. Create Tom's user under the Users tab. Do not add a public registration page.

### Cloud Firestore

1. Create a Firestore database.
2. Start in production mode.
3. In **Rules**, replace the rules with the contents of `firestore.rules`, then publish.

### Cloud Storage

1. Create the default Storage bucket.
2. In **Rules**, replace the rules with the contents of `storage.rules`, then publish.

Cloud Storage may require billing to be enabled depending on the Firebase project's current plan and bucket configuration. The public site still works without Storage; only photo uploads in the dashboard require it.

## 3. Authorize Tom as an administrator

1. In Authentication, copy Tom's user UID.
2. In Firestore, create a collection named `admins`.
3. Create a document whose document ID is exactly Tom's UID.
4. Add these fields:
   - `active` — Boolean — `true`
   - `email` — String — Tom's sign-in email
   - `name` — String — `Tom Howle`

The UID document is what the Firestore and Storage rules use to decide who may edit the site.

## 4. Load the starter content

1. Commit and publish the updated `js/firebase-config.js`.
2. Open `admin/login.html` on the deployed website.
3. Sign in as Tom.
4. Select **Load starter content** on the dashboard.
5. The existing videos, settings, and photo references will be copied into Firestore.

The MadLife listing is intentionally seeded as a draft because the year and ticket link have not been confirmed.

## 5. GitHub Pages

The website can remain hosted on GitHub Pages. GitHub stores and publishes the code and the small built-in design assets. Firebase stores editable records and future photo uploads. YouTube hosts the videos.

## Security notes

- The Firebase web configuration is not a password and can be committed to the site.
- The Security Rules are what prevent unauthorized writes.
- Do not change the rules to `allow read, write: if true`.
- Do not build a public sign-up form for administrator accounts.
- Test admin access before giving out the dashboard URL.
