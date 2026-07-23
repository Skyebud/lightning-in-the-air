import {
  getSettings,
  getShows,
  getVideos,
  getPhotos,
  getMembers,
  youtubeId
} from "./content-store.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setText(selector, value) {
  $$(selector).forEach((element) => {
    if (value !== undefined && value !== null) element.textContent = value;
  });
}

function setLink(selector, url) {
  $$(selector).forEach((element) => {
    if (url) {
      element.href = url;
      element.hidden = false;
    } else {
      element.removeAttribute("href");
      element.hidden = true;
    }
  });
}

function phoneHref(value = "") {
  return `tel:${value.replace(/[^+\d]/g, "")}`;
}

function youtubeWatchUrl(video) {
  const id = youtubeId(video.youtubeUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : video.youtubeUrl;
}

function embedUrl(video) {
  const id = youtubeId(video.youtubeUrl);
  if (!id) return "";
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`;
}

function createVideoPlayer(video, eager = false) {
  const id = youtubeId(video.youtubeUrl);
  const wrapper = document.createElement("div");
  wrapper.className = "video-player";

  if (!id) return wrapper;

  if (window.location.protocol === "file:") {
    const link = document.createElement("a");
    link.className = "video-poster";
    link.href = youtubeWatchUrl(video);
    link.target = "_blank";
    link.rel = "noopener";

    const image = document.createElement("img");
    image.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    image.alt = video.title;

    const play = document.createElement("span");
    play.className = "play-button";
    play.setAttribute("aria-hidden", "true");
    play.textContent = "▶";

    link.append(image, play);
    wrapper.append(link);
    return wrapper;
  }

  const frame = document.createElement("iframe");
  frame.src = embedUrl(video);
  frame.title = video.title;
  frame.loading = eager ? "eager" : "lazy";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  wrapper.append(frame);
  return wrapper;
}

function createVideoCard(video, className = "video-card") {
  const article = document.createElement("article");
  article.className = className;
  article.append(createVideoPlayer(video));

  const copy = document.createElement("div");
  copy.className = className === "performance-card" ? "performance-copy" : "video-card-copy";
  const title = document.createElement("h3");
  title.textContent = video.title;
  copy.append(title);
  article.append(copy);
  return article;
}

function parseShowDate(show) {
  return show.date ? new Date(`${show.date}T12:00:00`) : null;
}

function formatDate(show) {
  if (show.displayDate) return show.displayDate;
  const date = parseShowDate(show);
  if (!date) return "Date TBA";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function isUpcoming(show) {
  const date = parseShowDate(show);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function showCard(show) {
  const article = document.createElement("article");
  article.className = "show-card";

  const date = document.createElement("div");
  date.className = "show-date";
  date.textContent = formatDate(show);

  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = show.title || show.venue || "Lightning in the Air";
  const meta = document.createElement("p");
  meta.textContent = [
    show.time,
    show.venue,
    [show.city, show.state].filter(Boolean).join(", ")
  ].filter(Boolean).join(" · ");
  copy.append(title);
  if (meta.textContent) copy.append(meta);

  const action = document.createElement("a");
  action.className = "button dark";
  if (show.ticketUrl) {
    action.href = show.ticketUrl;
    action.target = "_blank";
    action.rel = "noopener";
    action.textContent = "Tickets";
  } else {
    action.href = "calendar.html";
    action.textContent = "Details";
  }

  article.append(date, copy, action);
  return article;
}

function emptyShows() {
  const box = document.createElement("div");
  box.className = "empty-state";
  const title = document.createElement("h3");
  title.textContent = "New dates coming soon.";
  box.append(title);
  return box;
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
    $$(".gallery-thumb", thumbs).forEach((button, itemIndex) => {
      button.classList.toggle("active", itemIndex === index);
    });
  }

  photos.forEach((photo, itemIndex) => {
    const button = document.createElement("button");
    button.className = "gallery-thumb";
    button.type = "button";
    button.setAttribute("aria-label", `Show photo ${itemIndex + 1}`);

    const image = document.createElement("img");
    image.src = photo.url;
    image.alt = "";
    image.loading = "lazy";
    button.append(image);
    button.addEventListener("click", () => render(itemIndex));
    thumbs.append(button);
  });

  $("[data-gallery-prev]")?.addEventListener("click", () => render(index - 1));
  $("[data-gallery-next]")?.addEventListener("click", () => render(index + 1));
  render(0);
}

function setupMembers(members) {
  const grid = $("[data-member-grid]");
  const profiles = $("[data-member-profiles]");
  if (!grid || !profiles || !members.length) return;

  members.forEach((member, index) => {
    const anchorId = `member-${member.id || index + 1}`;

    const card = document.createElement("a");
    card.className = "member-card";
    card.href = `#${anchorId}`;
    card.setAttribute("aria-label", `Read about ${member.name}`);

    const imageWrap = document.createElement("span");
    imageWrap.className = "member-photo";
    const image = document.createElement("img");
    image.src = member.photoUrl;
    image.alt = member.photoAlt || member.name;
    image.loading = index < 4 ? "eager" : "lazy";
    image.decoding = "async";
    imageWrap.append(image);

    const copy = document.createElement("span");
    copy.className = "member-copy";
    const name = document.createElement("strong");
    name.textContent = member.name;
    const role = document.createElement("span");
    role.textContent = member.role;
    const prompt = document.createElement("em");
    prompt.textContent = "Meet the member ↓";
    copy.append(name, role, prompt);

    card.append(imageWrap, copy);
    grid.append(card);

    const profile = document.createElement("article");
    profile.className = `member-profile${index % 2 ? " reverse" : ""}`;
    profile.id = anchorId;

    const profileImage = document.createElement("div");
    profileImage.className = "member-profile-image";
    const detailImage = document.createElement("img");
    detailImage.src = member.photoUrl;
    detailImage.alt = member.photoAlt || member.name;
    detailImage.loading = "lazy";
    detailImage.decoding = "async";
    profileImage.append(detailImage);

    const detail = document.createElement("div");
    detail.className = "member-profile-copy";
    const detailRole = document.createElement("p");
    detailRole.className = "eyebrow";
    detailRole.textContent = member.role;
    const detailName = document.createElement("h2");
    detailName.textContent = member.name;
    const story = document.createElement("p");
    story.className = "member-story";
    story.textContent = member.story?.trim() || `More about ${member.name} is coming soon.`;
    const back = document.createElement("a");
    back.className = "text-link yellow";
    back.href = "#member-lineup";
    back.textContent = "Back to lineup ↑";
    detail.append(detailRole, detailName, story, back);

    profile.append(profileImage, detail);
    profiles.append(profile);
  });
}

function setupCalendar(shows) {
  const grid = $("[data-calendar-grid]");
  const label = $("[data-calendar-month]");
  const list = $("[data-calendar-list]");
  if (!grid || !label || !list) return;

  const datedShows = shows.filter((show) => parseShowDate(show));
  const upcoming = datedShows.filter(isUpcoming);
  const firstDate = parseShowDate(upcoming[0]);
  let cursor = firstDate
    ? new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  function renderMonth() {
    grid.innerHTML = "";
    label.textContent = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(cursor);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentMonthKey = monthKey(cursor);

    for (let cell = 0; cell < 42; cell += 1) {
      const day = cell - firstDay + 1;
      const box = document.createElement("div");
      box.className = "calendar-day";
      let date;

      if (day < 1) {
        box.classList.add("outside");
        date = new Date(year, month - 1, previousDays + day);
      } else if (day > days) {
        box.classList.add("outside");
        date = new Date(year, month + 1, day - days);
      } else {
        date = new Date(year, month, day);
      }

      const number = document.createElement("span");
      number.className = "calendar-number";
      number.textContent = String(date.getDate());
      box.append(number);

      if (date.toDateString() === today.toDateString()) box.classList.add("today");

      if (monthKey(date) === currentMonthKey) {
        const events = datedShows.filter((show) => parseShowDate(show)?.toDateString() === date.toDateString());
        events.forEach((show) => {
          const event = document.createElement(show.ticketUrl ? "a" : "span");
          event.className = "calendar-event";
          event.textContent = show.venue || show.title || "Show";
          if (show.ticketUrl) {
            event.href = show.ticketUrl;
            event.target = "_blank";
            event.rel = "noopener";
          }
          box.append(event);
        });
      }

      grid.append(box);
    }
  }

  list.innerHTML = "";
  if (upcoming.length) upcoming.forEach((show) => list.append(showCard(show)));
  else list.append(emptyShows());

  $("[data-calendar-prev]")?.addEventListener("click", () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    renderMonth();
  });
  $("[data-calendar-next]")?.addEventListener("click", () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    renderMonth();
  });

  renderMonth();
}

async function init() {
  const menu = $("[data-menu-toggle]");
  const nav = $("[data-site-nav]");
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
  });

  const page = document.body.dataset.page;
  $(`[data-nav="${page}"]`)?.setAttribute("aria-current", "page");
  setText("[data-year]", new Date().getFullYear());

  const settings = await getSettings();
  setText("[data-announcement]", settings.announcement);
  setText("[data-home-quote]", `“${settings.homeQuote}”`);
  setText("[data-home-quote-by]", settings.homeQuoteBy);

  $$("[data-booking-email]").forEach((element) => {
    element.textContent = settings.bookingEmail;
    element.href = `mailto:${settings.bookingEmail}`;
  });
  $$("[data-booking-phone]").forEach((element) => {
    element.textContent = settings.bookingPhone;
    element.href = phoneHref(settings.bookingPhone);
  });
  setLink("[data-youtube-link]", settings.youtubeUrl);

  const [videos, shows] = await Promise.all([getVideos(), getShows()]);
  const featured = videos.find((video) => video.featured) || videos[0];
  const liveVideos = videos.filter((video) => video.id !== featured?.id);
  const upcoming = shows.filter(isUpcoming);

  if (page === "home") {
    const feature = $("[data-featured-video]");
    if (feature && featured) feature.append(createVideoPlayer(featured, true));

    const preview = $("[data-show-preview]");
    if (preview) {
      if (upcoming.length) upcoming.slice(0, 2).forEach((show) => preview.append(showCard(show)));
      else preview.append(emptyShows());
    }
  }

  if (page === "about") setupMembers(await getMembers());

  if (page === "shows") {
    const performances = $("[data-performance-grid]");
    liveVideos.forEach((video) => performances?.append(createVideoCard(video, "performance-card")));
  }

  if (page === "media") {
    const feature = $("[data-media-feature]");
    if (feature && featured) feature.append(createVideoPlayer(featured, true));

    const videoGrid = $("[data-video-grid]");
    liveVideos.forEach((video) => videoGrid?.append(createVideoCard(video)));
    setupGallery(await getPhotos());
  }

  if (page === "calendar") setupCalendar(shows);

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
      data.get("message") || ""
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(settings.bookingEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

init().catch((error) => console.error(error));
