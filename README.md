# Lightning in the Air Website

A multi-page, static website for **Lightning in the Air — A Marshall Tucker Tribute**.

The site is ready for GitHub Pages and does not require Node, npm, a database, or a build step.

## Pages

- `index.html` — Home
- `about.html` — Band bio and lineup
- `shows.html` — Featured show and booking formats
- `media.html` — Promo reel, live clips, audio, photos, and downloads
- `epk.html` — Electronic press kit for promoters and talent buyers
- `booking.html` — Booking contact and email-generating inquiry form
- `404.html` — Custom not-found page

## Before the public launch

1. Add the official Facebook and Instagram URLs in the header/footer area.
2. Add the year and ticket link for the MadLife show on `index.html` and `shows.html`.
3. Add or remove show dates as they are confirmed.
4. Review the booking window language when the season changes.
5. Test the phone number and email links on a phone.

The booking form is intentionally static. It opens the visitor's email application with a pre-filled message to `lita.bhm@gmail.com`; it does not store data.

## Publish with GitHub's website uploader

1. Sign in at GitHub and choose **New repository**.
2. Name it something simple, such as `lightning-in-the-air`.
3. Leave the repository public and create it.
4. Open the repository and choose **Add file → Upload files**.
5. Open this website folder on your computer.
6. Upload the **contents inside the folder**, including `index.html`, `styles.css`, `script.js`, and the `assets` folder. Do not upload the folder as one extra nested level.
7. Commit the files to the `main` branch.
8. In the repository, open **Settings → Pages**.
9. Under **Build and deployment**, choose **Deploy from a branch**.
10. Select the `main` branch and the `/ (root)` folder, then save.
11. GitHub will publish the site at a URL similar to:

   `https://YOUR-USERNAME.github.io/lightning-in-the-air/`

It may take a few minutes for the first deployment to appear.

## Publish with GitHub Desktop

1. Install and open GitHub Desktop.
2. Choose **File → Add local repository** and select this website folder.
3. If prompted, choose **Create a repository**.
4. Commit all files with a message such as `Initial website launch`.
5. Choose **Publish repository**.
6. On GitHub, enable Pages through **Settings → Pages → Deploy from a branch → main → / (root)**.

## Publish with Git commands

Run these commands inside this folder after creating an empty GitHub repository:

```bash
git init
git add .
git commit -m "Initial Lightning in the Air website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/lightning-in-the-air.git
git push -u origin main
```

Then enable GitHub Pages in the repository settings.

## Editing the site later

- Text and page structure are in the `.html` files.
- Site-wide colors and styling are in `styles.css`.
- The mobile menu, photo viewer, current year, and booking email form are in `script.js`.
- Images, videos, audio, and downloads are in `assets/`.

After changing a file, commit and push it to `main`. GitHub Pages will update automatically.

## Media note

All web videos have been compressed to GitHub-safe file sizes. Keep every individual file below GitHub's 100 MB file limit. For future long or high-resolution videos, YouTube or Vimeo embeds are usually better than storing the original video in the repository.
