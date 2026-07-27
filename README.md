# Lightning in the Air Website — Version 10

Public pages:

- Home
- The Band, with clickable member profiles
- Shows, featuring past performances
- Media, with embedded YouTube videos and a photo gallery
- Calendar, for upcoming dates
- Booking

The public site reads published shows, videos, photos, settings, and member stories from Firebase when configured. Before Firebase contains starter content, it falls back to `data/site-content.json`.

## Version 10 changes

- Added live Firestore listeners. Published edits appear on open public pages without requiring a refresh.
- Added visual focal-point controls for gallery photos and member portraits.
- Admins can click or drag on a preview, adjust horizontal and vertical focus, and change zoom.
- Saved crop settings automatically apply to member cards, profile photos, and gallery thumbnails.
- The main gallery image remains uncropped so visitors can still see the complete photograph.
- Public Firestore queries now request only published records, and the supplied rules prevent public reads of drafts.

## Previewing locally

Use VS Code Live Server or another local web server. YouTube embeds require an `http://` or `https://` page. Opening `index.html` directly as a `file://` page shows video posters instead of embedded players.

## Updating an already-connected site

Do not overwrite your working `js/firebase-config.js` with a blank template. The `lightning-in-the-air-v10-update.zip` patch intentionally excludes that file and is the safest way to upgrade an existing repository.

After copying the update files into the repository:

1. Publish the new `firestore.rules` in Firebase Console.
2. Publish the new `storage.rules` if Cloud Storage is enabled.
3. Commit and push the files through GitHub Desktop.

See `FIREBASE-SETUP.md` for the full Firebase setup.
