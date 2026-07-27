# Lightning in the Air — Production Release Candidate

A static public website hosted on GitHub Pages with Firebase providing authentication, Firestore content, Cloud Storage media uploads, Cloud Functions, and the admin dashboard.

## Public pages

- Home
- The Band
- Shows
- Calendar
- Media
- Booking

## Production features

- Firestore-only content with live updates
- Admin-managed shows, media, members, settings, and booking requests
- Published/draft controls
- Image focal-point and zoom controls
- Secure booking submission with validation and rate limiting
- Email notification queue for Firebase Trigger Email
- Responsive layouts and embedded YouTube videos

## Important

Preserve the connected `js/firebase-config.js` when applying an update package. Deploy the included Firestore rules and Cloud Function before accepting public booking inquiries.

See `FIREBASE-SETUP.md` and `PRODUCTION-RELEASE.md`.
