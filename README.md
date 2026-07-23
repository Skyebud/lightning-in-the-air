# Lightning in the Air website — backend-ready rebuild

A multipage static website designed for GitHub Pages with an optional Firebase-powered content management dashboard.

## Public pages

- `index.html` — Home
- `about.html` — The Band
- `shows.html` — Shows
- `media.html` — YouTube videos and photos
- `booking.html` — Booking contact and email-assisted inquiry form
- `404.html` — GitHub Pages fallback

The public EPK and technical rider were removed. The booking page tells verified talent buyers that production and promotional materials are available by request.

## Admin pages

- `admin/login.html`
- `admin/index.html`

Once Firebase is connected, authorized administrators can manage:

- Shows and ticket links
- YouTube video links
- Photos uploaded to Cloud Storage
- Booking details, social links, announcement text, and homepage copy

See `FIREBASE-SETUP.md` for the complete connection process.

## Local preview

Opening HTML files directly can block module and JSON loading. Run a local web server from this folder instead:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

VS Code's Live Server extension also works.

## Hosting architecture

- **GitHub Pages:** HTML, CSS, JavaScript, and built-in design images
- **Firebase Authentication:** Tom's sign-in
- **Cloud Firestore:** editable site content
- **Cloud Storage:** future photo uploads
- **YouTube:** all performance video playback

No large video files are stored in this repository.
