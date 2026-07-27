import {
  subscribeSettings,
  subscribeShows,
  subscribeVideos,
  subscribePhotos,
  subscribeMembers,
  youtubeId
} from "./content-store.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const page = document.body.dataset.page;
let currentSettings = {};
let galleryIndex = 0;
let galleryActiveId = "";
let calendarCursor = null;

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

function clear(element) {
  if (element) element.replaceChildren();
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

const legacyMemberFocal = {
  "ben-benefield": { x: 44, y: 50, zoom: 1.03 },
  "sergio-flores": { x: 47, y: 50, zoom: 1.02 }
};

function focal(item = {}) {
  const defaults = legacyMemberFocal[item.id] || { x: 50, y: 50, zoom: 1 };
  return {
    x: clamp(item.focalX, 0, 100, defaults.x),
    y: clamp(item.focalY, 0, 100, defaults.y),
    zoom: clamp(item.cropZoom, 1, 2, defaults.zoom)
  };
}

function applyCrop(image, item = {}, { zoom = true } = {}) {
  const point = focal(item);
  image.style.objectPosition = `${point.x}% ${point.y}%`;
  if (zoom) {
    image.style.transform = `scale(${point.zoom})`;
    image.style.transformOrigin = `${point.x}% ${point.y}%`;
  } else {
    image.style.transform = "none";
    image.style.transformOrigin = "center";
  }
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

function renderGallery(photos) {
  const main = $("[data-gallery-main]");
  const thumbs = $("[data-gallery-thumbs]");
  if (!main || !thumbs) return;

  const mainImage = $("img", main);
  const caption = $("[data-gallery-caption]", main);
  clear(thumbs);

  if (!photos.length) {
    main.hidden = true;
    $("[data-gallery-prev]")?.setAttribute("disabled", "");
    $("[data-gallery-next]")?.setAttribute("disabled", "");
    return;
  }

  main.hidden = false;
  $("[data-gallery-prev]")?.removeAttribute("disabled");
  $("[data-gallery-next]")?.removeAttribute("disabled");

  const preservedIndex = photos.findIndex((photo) => photo.id === galleryActiveId);
  if (preservedIndex >= 0) galleryIndex = preservedIndex;
  galleryIndex = Math.min(galleryIndex, photos.length - 1);

  function show(next) {
    galleryIndex = (next + photos.length) % photos.length;
    const photo = photos[galleryIndex];
    galleryActiveId = photo.id;
    mainImage.src = photo.url;
    mainImage.alt = photo.alt || photo.caption || "Lightning in the Air";
    applyCrop(mainImage, photo, { zoom: false });
    caption.textContent = photo.caption || "";
    $$(".gallery-thumb", thumbs).forEach((button, itemIndex) => {
      button.classList.toggle("active", itemIndex === galleryIndex);
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
    applyCrop(image, photo);
    button.append(image);
    button.onclick = () => show(itemIndex);
    thumbs.append(button);
  });

  const previous = $("[data-gallery-prev]");
  const next = $("[data-gallery-next]");
  if (previous) previous.onclick = () => show(galleryIndex - 1);
  if (next) next.onclick = () => show(galleryIndex + 1);
  show(galleryIndex);
}

function renderMembers(members) {
  const grid = $("[data-member-grid]");
  const profiles = $("[data-member-profiles]");
  if (!grid || !profiles) return;
  clear(grid);
  clear(profiles);

  members.forEach((member, index) => {
    const anchorId = `member-${member.id || index + 1}`;

    const card = document.createElement("a");
    card.className = "member-card";
    card.dataset.memberId = member.id || String(index + 1);
    card.href = `#${anchorId}`;
    card.setAttribute("aria-label", `Read about ${member.name}`);

    const imageWrap = document.createElement("span");
    imageWrap.className = "member-photo";
    const image = document.createElement("img");
    image.src = member.photoUrl;
    image.alt = member.photoAlt || member.name;
    image.loading = index < 4 ? "eager" : "lazy";
    image.decoding = "async";
    applyCrop(image, member);
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
    profile.dataset.memberId = member.id || String(index + 1);
    profile.id = anchorId;

    const profileImage = document.createElement("div");
    profileImage.className = "member-profile-image";
    const detailImage = document.createElement("img");
    detailImage.src = member.photoUrl;
    detailImage.alt = member.photoAlt || member.name;
    detailImage.loading = "lazy";
    detailImage.decoding = "async";
    applyCrop(detailImage, member);
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

function renderCalendar(shows) {
  const grid = $("[data-calendar-grid]");
  const label = $("[data-calendar-month]");
  const list = $("[data-calendar-list]");
  if (!grid || !label || !list) return;

  const datedShows = shows.filter((show) => parseShowDate(show));
  const upcoming = datedShows.filter(isUpcoming);

  if (!calendarCursor) {
    const firstDate = parseShowDate(upcoming[0]);
    calendarCursor = firstDate
      ? new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  function drawMonth() {
    grid.innerHTML = "";
    label.textContent = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(calendarCursor);

    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentMonthKey = monthKey(calendarCursor);

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

  clear(list);
  if (upcoming.length) upcoming.forEach((show) => list.append(showCard(show)));
  else list.append(emptyShows());

  const previous = $("[data-calendar-prev]");
  const next = $("[data-calendar-next]");
  if (previous) {
    previous.onclick = () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      drawMonth();
    };
  }
  if (next) {
    next.onclick = () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      drawMonth();
    };
  }

  drawMonth();
}

function applySettings(settings) {
  currentSettings = { ...currentSettings, ...settings };
  setText("[data-announcement]", currentSettings.announcement);
  setText("[data-home-quote]", `“${currentSettings.homeQuote || ""}”`);
  setText("[data-home-quote-by]", currentSettings.homeQuoteBy);

  $$("[data-booking-email]").forEach((element) => {
    element.textContent = currentSettings.bookingEmail || "";
    element.href = `mailto:${currentSettings.bookingEmail || ""}`;
  });
  $$("[data-booking-phone]").forEach((element) => {
    element.textContent = currentSettings.bookingPhone || "";
    element.href = phoneHref(currentSettings.bookingPhone || "");
  });
  setLink("[data-youtube-link]", currentSettings.youtubeUrl);
}

function renderHomeVideos(videos) {
  const featured = videos.find((video) => video.featured) || videos[0];
  const feature = $("[data-featured-video]");
  if (!feature) return;
  clear(feature);
  if (featured) feature.append(createVideoPlayer(featured, true));
}

function renderHomeShows(shows) {
  const preview = $("[data-show-preview]");
  if (!preview) return;
  clear(preview);
  const upcoming = shows.filter(isUpcoming);
  if (upcoming.length) upcoming.slice(0, 2).forEach((show) => preview.append(showCard(show)));
  else preview.append(emptyShows());
}

function renderShowsVideos(videos) {
  const featured = videos.find((video) => video.featured) || videos[0];
  const liveVideos = videos.filter((video) => video.id !== featured?.id);
  const performances = $("[data-performance-grid]");
  if (!performances) return;
  clear(performances);
  liveVideos.forEach((video) => performances.append(createVideoCard(video, "performance-card")));
}

function renderMediaVideos(videos) {
  const featured = videos.find((video) => video.featured) || videos[0];
  const liveVideos = videos.filter((video) => video.id !== featured?.id);
  const feature = $("[data-media-feature]");
  const videoGrid = $("[data-video-grid]");
  clear(feature);
  clear(videoGrid);
  if (feature && featured) feature.append(createVideoPlayer(featured, true));
  liveVideos.forEach((video) => videoGrid?.append(createVideoCard(video)));
}

function bindBookingForm() {
  const form = $("[data-booking-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
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
    window.location.href = `mailto:${encodeURIComponent(currentSettings.bookingEmail || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

async function init() {
  const menu = $("[data-menu-toggle]");
  const nav = $("[data-site-nav]");
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!open));
    nav?.classList.toggle("open", !open);
  });

  $(`[data-nav="${page}"]`)?.setAttribute("aria-current", "page");
  setText("[data-year]", new Date().getFullYear());
  bindBookingForm();

  await subscribeSettings(applySettings);

  if (page === "home") {
    await subscribeVideos(renderHomeVideos);
    await subscribeShows(renderHomeShows);
  }

  if (page === "about") await subscribeMembers(renderMembers);
  if (page === "shows") await subscribeVideos(renderShowsVideos);

  if (page === "media") {
    await subscribeVideos(renderMediaVideos);
    await subscribePhotos(renderGallery);
  }

  if (page === "calendar") await subscribeShows(renderCalendar);
}

init().catch((error) => console.error(error));
