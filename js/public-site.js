import { getSettings, getShows, getVideos, getPhotos, youtubeId } from "./content-store.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setText(selector, value) {
  $$(selector).forEach((el) => { if (value) el.textContent = value; });
}
function setLink(selector, url) {
  $$(selector).forEach((el) => {
    if (url) { el.href = url; el.hidden = false; }
    else { el.removeAttribute("href"); el.hidden = true; }
  });
}
function phoneHref(value = "") { return `tel:${value.replace(/[^+\d]/g, "")}`; }
function embedUrl(url) {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : "";
}
function createIframe(video, title = video.title) {
  const frame = document.createElement("iframe");
  frame.src = embedUrl(video.youtubeUrl);
  frame.title = title;
  frame.loading = "lazy";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  return frame;
}
function createVideoCard(video, className = "video-card") {
  const article = document.createElement("article");
  article.className = className;
  article.append(createIframe(video));
  const copy = document.createElement("div");
  copy.className = className === "performance-card" ? "" : "video-card-copy";
  const h3 = document.createElement("h3"); h3.textContent = video.title;
  copy.append(h3);
  if (video.description) { const p = document.createElement("p"); p.textContent = video.description; copy.append(p); }
  article.append(copy);
  return article;
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
  if (show.ticketUrl) { action.href = show.ticketUrl; action.target = "_blank"; action.rel = "noopener"; action.textContent = "Tickets"; }
  else { action.href = "booking.html"; action.textContent = "Details"; }
  article.append(date, copy, action);
  return article;
}
function emptyShows() {
  const div = document.createElement("div"); div.className = "empty-state";
  const h = document.createElement("h3"); h.textContent = "More dates are on the way.";
  const p = document.createElement("p"); p.textContent = "Follow the band or check back soon for newly announced performances.";
  div.append(h, p); return div;
}
function setupGallery(photos) {
  const main = $("[data-gallery-main]");
  const thumbs = $("[data-gallery-thumbs]");
  if (!main || !thumbs || !photos.length) return;
  const mainImage = $("img", main);
  const caption = $("[data-gallery-caption]", main);
  let index = 0;
  function render(next) {
    index = (next + photos.length) % photos.length;
    const photo = photos[index];
    mainImage.src = photo.url;
    mainImage.alt = photo.alt || photo.caption || "Lightning in the Air";
    caption.textContent = photo.caption || "";
    $$(".gallery-thumb", thumbs).forEach((button, i) => button.classList.toggle("active", i === index));
  }
  photos.forEach((photo, i) => {
    const button = document.createElement("button"); button.className = "gallery-thumb"; button.type = "button";
    button.setAttribute("aria-label", `Show photo ${i + 1}`);
    const img = document.createElement("img"); img.src = photo.url; img.alt = ""; img.loading = "lazy";
    button.append(img); button.addEventListener("click", () => render(i)); thumbs.append(button);
  });
  $("[data-gallery-prev]")?.addEventListener("click", () => render(index - 1));
  $("[data-gallery-next]")?.addEventListener("click", () => render(index + 1));
  render(0);
}

async function init() {
  const menu = $("[data-menu-toggle]"); const nav = $("[data-site-nav]");
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open)); nav?.classList.toggle("open", !open);
  });
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
  $$('[data-booking-email]').forEach((el) => { el.textContent = settings.bookingEmail; el.href = `mailto:${settings.bookingEmail}`; });
  $$('[data-booking-phone]').forEach((el) => { el.textContent = settings.bookingPhone; el.href = phoneHref(settings.bookingPhone); });
  setLink("[data-youtube-link]", settings.youtubeUrl);
  setLink("[data-facebook-link]", settings.facebookUrl);
  setLink("[data-instagram-link]", settings.instagramUrl);

  const videos = await getVideos();
  const featured = videos.find((v) => v.featured) || videos[0];
  const liveVideos = videos.filter((v) => v.id !== featured?.id);
  const shows = await getShows();

  if (page === "home") {
    const feature = $("[data-featured-video]");
    if (feature && featured) feature.append(createIframe(featured));
    const preview = $("[data-show-preview]");
    if (preview) { if (shows.length) shows.slice(0, 2).forEach((show) => preview.append(showCard(show))); else preview.append(emptyShows()); }
  }
  if (page === "shows") {
    const target = $("[data-shows-list]");
    if (target) { if (shows.length) shows.forEach((show) => target.append(showCard(show))); else target.append(emptyShows()); }
    const performances = $("[data-performance-grid]");
    liveVideos.slice(0, 3).forEach((video) => performances?.append(createVideoCard(video, "performance-card")));
  }
  if (page === "media") {
    const feature = $("[data-media-feature]");
    if (feature && featured) feature.append(createIframe(featured));
    const grid = $("[data-video-grid]");
    liveVideos.forEach((video) => grid?.append(createVideoCard(video)));
    setupGallery(await getPhotos());
  }

  const form = $("[data-booking-form]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = `Booking inquiry — ${data.get("organization") || data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone") || "Not provided"}`,
      `Venue / Organization: ${data.get("organization") || "Not provided"}`,
      `Preferred date: ${data.get("date") || "Not confirmed"}`,
      `Event type: ${data.get("eventType") || "Not provided"}`,
      `Location: ${data.get("location") || "Not provided"}`,
      "",
      "Event details:",
      data.get("message") || "Not provided"
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(settings.bookingEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
init().catch((error) => console.error(error));
