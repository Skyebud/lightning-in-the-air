# Lightning in the Air Website — Version 8

Website

Public pages:
- Home
- The Band, with clickable member profiles
- Shows, featuring past performances
- Media, with embedded YouTube videos and a photo gallery
- Calendar, for upcoming dates
- Booking

The public site reads shows, videos, photos, settings, and member stories from Firebase when configured and falls back to `data/site-content.json` before Firebase is connected. The `/admin/` area is not linked from the public website and is blocked from search indexing.

## Previewing locally

Use VS Code Live Server or another local web server. YouTube embeds require an `http://` or `https://` page. Opening `index.html` directly as a `file://` page will show video posters instead of the embedded players.

See `FIREBASE-SETUP.md` for the future admin and storage connection steps.


## Version 8 changes

- Rebuilt the band page with clickable member portraits and on-page profile excerpts.
- Re-cropped member portraits from the original supplied group photo and enlarged them with non-generative image processing.
- Removed the song-list section from Shows and placed selected repertoire in a collapsed Booking section.


## Version 8 changes

- Reframed the member portraits so faces sit more naturally in the cards and profile sections.
- Increased the homepage corner logo while keeping it clear of faces.
