# Firebase setup for the Lightning in the Air admin dashboard

The public website can fall back to `data/site-content.json`. Admin sign-in, editable records, live updates, and image uploads use Firebase.

## 1. Web app configuration

Copy the Web app configuration from Firebase Console into `js/firebase-config.js`. When upgrading an existing connected site, keep the configuration file already in your repository.

## 2. Authentication

1. Enable Email/Password sign-in.
2. Create the administrator under Authentication → Users.
3. Do not add public registration to the website.

## 3. Cloud Firestore

1. Create the Firestore database in production mode.
2. Replace the Firebase Rules editor with `firestore.rules` and publish it.
3. The supplied public queries read only records where `published` is true. Authorized admins can read and edit drafts.

## 4. Authorize an administrator

1. Copy the user UID from Authentication.
2. Create the Firestore collection `admins`.
3. Create a document whose ID exactly matches that UID.
4. Add:
   - `active` — Boolean — `true`
   - `email` — String — the administrator email
   - `name` — String — the administrator name

## 5. Load starter content

1. Open `/admin/login.html` on the deployed website.
2. Sign in.
3. Select **Load starter content** once.

This copies the existing settings, videos, photo references, shows, and member profiles into Firestore.

## 6. Live updates

The public pages use Firestore snapshot listeners. When an admin saves and publishes a show, video, member, photo, or setting, an already-open public page updates automatically.

The `Published` checkbox still controls public visibility. Draft records remain available in the dashboard but are not returned to public visitors.

## 7. Image focal points

The Photos and Band Members forms include crop previews:

- Click or drag on the preview to set the focal point.
- Fine-tune horizontal and vertical focus with sliders.
- Use Zoom when the source image needs a tighter crop.
- Save the record to apply the crop to the public site.

For gallery photos, the crop settings apply to the thumbnail. The large gallery view continues to show the full image.

## 8. Cloud Storage

Cloud Storage is only required when uploading replacement or new photos directly from the dashboard.

1. Create the default Storage bucket.
2. Replace its rules with `storage.rules` and publish.

Storage availability or billing requirements depend on the Firebase project and bucket configuration. Existing local images, Firestore text edits, show dates, and YouTube links work without Storage.

## Security

- Firebase Web configuration is public client configuration, not a password.
- Security comes from Authentication and the supplied Firestore and Storage rules.
- Do not use rules that allow unrestricted public writes.
- Keep administrator registration out of the public site.
