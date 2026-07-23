import { getSettings, getShows, getVideos, getPhotos, youtubeId } from "./content-store.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setText(selector, value) { $$(selector).forEach((el) => { if (value) el.textContent = value; }); }
function setLink(selector, url) { $$(selector).forEach((el) => { if (url) { el.href = url; el.hidden = false; } else { el.removeAttribute("href"); el.hidden = true; } }); }
function phoneHref(value = "") { return `tel:${value.replace(/[^+\d]/g, "")}`; }

function youtubeCard(video, compact = false) {
  const id = youtubeId(video.youtubeUrl);
  const card = document.createElement("article");
  card.className = "youtube-card";
  const button = document.createElement("button");
  button.className = "youtube-poster";
  button.type = "button";
  button.setAttribute("aria-label", `Play ${video.title}`);
  const image = document.createElement("img");
  image.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  image.alt = "";
  image.loading = "lazy";
  image.onerror = () => { image.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; };
  button.append(image);
  button.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = video.title;
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    button.replaceWith(frame);
  });
  const copy = document.createElement("div");
  copy.className = "youtube-copy";
  const h3 = document.createElement("h3"); h3.textContent = video.title;
  copy.append(h3);
  if (video.description && !compact) { const p = document.createElement("p"); p.textContent = video.description; copy.append(p); }
  card.append(button, copy);
  return card;
}

function formatDate(show) {
  if (show.displayDate) return show.displayDate;
  if (!show.date) return "Date coming soon";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${show.date}T12:00:00`));
}
function showCard(show) {
  const article = document.createElement("article"); article.className = "show-card";
  const date = document.createElement("div"); date.className = "show-date"; date.textContent = formatDate(show);
  const copy = document.createElement("div");
  const title = document.createElement("h3"); title.textContent = show.title || show.venue || "Lightning in the Air";
  const meta = document.createElement("p"); meta.textContent = [show.time, show.venue, [show.city, show.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  copy.append(title, meta);
  if (show.details) { const details = document.createElement("p"); details.textContent = show.details; copy.append(details); }
  const action = document.createElement("a"); action.className = "button dark";
  if (show.ticketUrl) { action.href = show.ticketUrl; action.target = "_blank"; action.rel = "noopener"; action.textContent = "Tickets / details"; }
  else { action.href = "booking.html"; action.textContent = "Ask about this show"; }
  article.append(date, copy, action); return article;
}
function emptyShows(className = "empty-state") {
  const div = document.createElement("div"); div.className = className;
  const h = document.createElement("h3"); h.textContent = "New dates are being announced.";
  const p = document.createElement("p"); p.textContent = "Check back soon or contact the band for current availability and private-event dates.";
  div.append(h,p); return div;
}

async function init() {
  const menu = $("[data-menu-toggle]"); const nav = $("[data-site-nav]");
  menu?.addEventListener("click", () => { const open = menu.getAttribute("aria-expanded") === "true"; menu.setAttribute("aria-expanded", String(!open)); nav?.classList.toggle("open", !open); });
  const page = document.body.dataset.page;
  $(`[data-nav="${page}"]`)?.setAttribute("aria-current", "page");
  setText("[data-year]", new Date().getFullYear());

  const settings = await getSettings();
  setText("[data-announcement]", settings.announcement);
  setText("[data-hero-eyebrow]", settings.heroEyebrow);
  setText("[data-hero-title]", settings.heroTitle);
  setText("[data-hero-text]", settings.heroText);
  setText("[data-home-quote]", `“${settings.homeQuote}”`);
  setText("[data-home-quote-by]", settings.homeQuoteBy);
  setText("[data-booking-contact]", settings.bookingContact);
  $$('[data-booking-email]').forEach((el) => { el.textContent = settings.bookingEmail; el.href = `mailto:${settings.bookingEmail}`; });
  $$('[data-booking-phone]').forEach((el) => { el.textContent = settings.bookingPhone; el.href = phoneHref(settings.bookingPhone); });
  setLink("[data-youtube-link]", settings.youtubeUrl);
  setLink("[data-facebook-link]", settings.facebookUrl);
  setLink("[data-instagram-link]", settings.instagramUrl);

  if (page === "home") {
    const videos = await getVideos();
    const featured = videos.find((v) => v.featured) || videos[0];
    const target = $("[data-featured-video]"); if (target && featured) target.append(youtubeCard(featured));
    const shows = await getShows(); const preview = $("[data-show-preview]");
    if (preview) { if (shows.length) shows.slice(0,2).forEach((show) => preview.append(showCard(show))); else preview.append(emptyShows()); }
  }
  if (page === "shows") {
    const target = $("[data-shows-list]"); const shows = await getShows();
    if (target) { if (shows.length) shows.forEach((show) => target.append(showCard(show))); else target.append(emptyShows()); }
  }
  if (page === "media") {
    const videos = await getVideos(); const vg = $("[data-video-grid]"); videos.forEach((video) => vg?.append(youtubeCard(video)));
    const photos = await getPhotos(); const pg = $("[data-photo-grid]");
    photos.forEach((photo) => { const figure = document.createElement("figure"); const img = document.createElement("img"); img.src = photo.url; img.alt = photo.alt || photo.caption || "Lightning in the Air"; img.loading = "lazy"; const cap = document.createElement("figcaption"); cap.textContent = photo.caption || ""; figure.append(img, cap); pg?.append(figure); });
  }
  const form = $("[data-booking-form]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault(); const data = new FormData(form);
    const subject = `Booking inquiry — ${data.get("organization") || data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`, `Email: ${data.get("email")}`, `Phone: ${data.get("phone") || "Not provided"}`,
      `Organization / Venue: ${data.get("organization") || "Not provided"}`, `Event date: ${data.get("date") || "Not confirmed"}`,
      `Event type: ${data.get("eventType")}`, `Location: ${data.get("location") || "Not provided"}`, "", "Event details:", data.get("message") || "Not provided"
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(settings.bookingEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
init().catch((error) => console.error(error));
