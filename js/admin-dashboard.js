import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";
import { auth, db, storage, firebaseEnabled } from "./firebase-client.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let state = {
  shows: [],
  videos: [],
  photos: [],
  members: [],
  settings: {},
  user: null
};

function message(selector, text, type = "") {
  const element = $(selector);
  if (!element) return;
  element.textContent = text;
  element.className = `admin-message ${type}`;
}

function safeFile(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}


const cropEditors = new Map();

const legacyMemberFocal = {
  "ben-benefield": { focalX: 44, focalY: 50, cropZoom: 1.03 },
  "sergio-flores": { focalX: 47, focalY: 50, cropZoom: 1.02 }
};

function cropDefaults(type, item = {}) {
  if (type === "members") return legacyMemberFocal[item.id] || { focalX: 50, focalY: 50, cropZoom: 1 };
  return { focalX: 50, focalY: 50, cropZoom: 1 };
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function adminPreviewUrl(value = "") {
  if (!value) return "";
  if (/^(?:https?:|blob:|data:|\.\.\/|\/)/i.test(value)) return value;
  return value.startsWith("assets/") ? `../${value}` : value;
}

function bindCropEditor(type, {
  formSelector,
  previewSelector,
  currentUrlField
}) {
  const form = $(formSelector);
  const preview = $(previewSelector);
  const image = preview?.querySelector("img");
  if (!form || !preview || !image) return;

  const fileInput = form.elements.file;
  const xInput = form.elements.focalX;
  const yInput = form.elements.focalY;
  const zoomInput = form.elements.cropZoom;
  const xOutput = preview.parentElement.querySelector("[data-focal-x-output]");
  const yOutput = preview.parentElement.querySelector("[data-focal-y-output]");
  const zoomOutput = preview.parentElement.querySelector("[data-crop-zoom-output]");
  let objectUrl = "";

  function revokeObjectUrl() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }

  function source() {
    if (fileInput?.files?.[0]) {
      if (!objectUrl) objectUrl = URL.createObjectURL(fileInput.files[0]);
      return objectUrl;
    }
    return adminPreviewUrl(form.elements[currentUrlField]?.value || "");
  }

  function refresh() {
    const url = source();
    const x = clamp(xInput?.value, 0, 100, 50);
    const y = clamp(yInput?.value, 0, 100, 50);
    const zoom = clamp(zoomInput?.value, 1, 2, 1);

    preview.classList.toggle("empty", !url);
    if (url) image.src = url;
    else image.removeAttribute("src");

    image.style.objectPosition = `${x}% ${y}%`;
    image.style.transform = `scale(${zoom})`;
    image.style.transformOrigin = `${x}% ${y}%`;

    if (xOutput) xOutput.textContent = `${Math.round(x)}%`;
    if (yOutput) yOutput.textContent = `${Math.round(y)}%`;
    if (zoomOutput) zoomOutput.textContent = `${zoom.toFixed(2)}×`;
  }

  function setPoint(event) {
    const bounds = preview.getBoundingClientRect();
    const x = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100, 50);
    const y = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100, 50);
    xInput.value = String(Math.round(x));
    yInput.value = String(Math.round(y));
    refresh();
  }

  preview.addEventListener("pointerdown", (event) => {
    if (!source()) return;
    preview.setPointerCapture(event.pointerId);
    setPoint(event);
  });
  preview.addEventListener("pointermove", (event) => {
    if (preview.hasPointerCapture(event.pointerId)) setPoint(event);
  });
  preview.addEventListener("pointerup", (event) => {
    if (preview.hasPointerCapture(event.pointerId)) preview.releasePointerCapture(event.pointerId);
  });

  [xInput, yInput, zoomInput].forEach((input) => input?.addEventListener("input", refresh));
  fileInput?.addEventListener("change", () => {
    revokeObjectUrl();
    refresh();
  });
  preview.parentElement.querySelector("[data-reset-crop]")?.addEventListener("click", () => {
    xInput.value = "50";
    yInput.value = "50";
    zoomInput.value = "1";
    refresh();
  });

  cropEditors.set(type, { refresh, revokeObjectUrl });
  refresh();
}

async function isAdmin(user) {
  if (!user || !db) return false;
  const snapshot = await getDoc(doc(db, "admins", user.uid));
  return snapshot.exists() && snapshot.data().active !== false;
}

async function readCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
}

async function loadAll() {
  const [shows, videos, photos, members, settingsDoc] = await Promise.all([
    readCollection("shows"),
    readCollection("videos"),
    readCollection("photos"),
    readCollection("members"),
    getDoc(doc(db, "site", "settings"))
  ]);

  state = {
    ...state,
    shows,
    videos,
    photos,
    members,
    settings: settingsDoc.exists() ? settingsDoc.data() : {}
  };
  renderAll();
}

function renderAll() {
  $("[data-count-shows]").textContent = state.shows.length;
  $("[data-count-videos]").textContent = state.videos.length;
  $("[data-count-photos]").textContent = state.photos.length;
  $("[data-count-members]").textContent = state.members.length;
  renderList("shows", state.shows);
  renderList("videos", state.videos);
  renderList("photos", state.photos);
  renderList("members", state.members);
  fillSettings();
}

const listTargets = {
  shows: "[data-show-admin-list]",
  videos: "[data-video-admin-list]",
  photos: "[data-photo-admin-list]",
  members: "[data-member-admin-list]"
};

function listText(type, item) {
  if (type === "shows") {
    return {
      title: item.title || item.venue || "Untitled show",
      meta: [item.date || item.displayDate, item.venue].filter(Boolean).join(" · ")
    };
  }
  if (type === "videos") return { title: item.title || "Untitled video", meta: item.youtubeUrl || "" };
  if (type === "photos") return { title: item.caption || "Untitled photo", meta: item.alt || item.url || "" };
  return { title: item.name || "Unnamed member", meta: item.role || "" };
}

function renderList(type, items) {
  const target = $(listTargets[type]);
  if (!target) return;
  target.innerHTML = "";

  if (!items.length) {
    target.innerHTML = '<div class="admin-notice">No items yet.</div>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "admin-list-item";
    const text = listText(type, item);
    row.innerHTML = '<span><strong></strong><span></span></span><span class="badge"></span>';
    row.querySelector("strong").textContent = text.title;
    row.querySelector("span span").textContent = text.meta || "No details";
    const badge = row.querySelector(".badge");
    badge.textContent = item.published ? "Published" : "Draft";
    badge.classList.toggle("live", item.published === true);
    row.addEventListener("click", () => fillForm(type, item));
    target.append(row);
  });
}

function setFormValue(form, name, value) {
  const field = form.elements[name];
  if (!field) return;
  if (field.type === "checkbox") field.checked = Boolean(value);
  else field.value = value ?? "";
}

function fillForm(type, item) {
  const singular = type.slice(0, -1);
  const form = $(`[data-${singular}-form]`);
  if (!form) return;

  form.reset();
  setFormValue(form, "id", item.id);
  Object.entries(item).forEach(([key, value]) => setFormValue(form, key, value));
  const defaults = cropDefaults(type, item);
  if (item.focalX === undefined) setFormValue(form, "focalX", defaults.focalX);
  if (item.focalY === undefined) setFormValue(form, "focalY", defaults.focalY);
  if (item.cropZoom === undefined) setFormValue(form, "cropZoom", defaults.cropZoom);

  if (type === "photos") {
    setFormValue(form, "currentUrl", item.url);
    setFormValue(form, "storagePath", item.storagePath);
  }
  if (type === "members") {
    setFormValue(form, "currentPhotoUrl", item.photoUrl);
    setFormValue(form, "storagePath", item.storagePath);
  }

  $(`[data-${singular}-form-title]`).textContent = `Edit ${type === "members" ? "member" : singular}`;
  $(`[data-delete-${singular}]`).hidden = false;
  cropEditors.get(singular)?.revokeObjectUrl();
  cropEditors.get(singular)?.refresh();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm(type) {
  const form = $(`[data-${type}-form]`);
  if (!form) return;
  form.reset();
  if (form.elements.id) form.elements.id.value = "";
  if (form.elements.currentUrl) form.elements.currentUrl.value = "";
  if (form.elements.currentPhotoUrl) form.elements.currentPhotoUrl.value = "";
  if (form.elements.storagePath) form.elements.storagePath.value = "";
  const title = $(`[data-${type}-form-title]`);
  if (title) title.textContent = `Add a ${type}`;
  const deleteButton = $(`[data-delete-${type}]`);
  if (deleteButton) deleteButton.hidden = true;
  cropEditors.get(type)?.revokeObjectUrl();
  cropEditors.get(type)?.refresh();
}

function formObject(form) {
  const payload = {};
  [...form.elements].forEach((field) => {
    if (!field.name || ["id", "file", "currentUrl", "currentPhotoUrl", "storagePath"].includes(field.name)) return;
    if (field.type === "checkbox") payload[field.name] = field.checked;
    else if (["number", "range"].includes(field.type)) payload[field.name] = Number(field.value) || 0;
    else payload[field.name] = field.value.trim();
  });
  return payload;
}

function bindTabs() {
  $$("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-admin-tab]").forEach((item) => item.classList.remove("active"));
      $$("[data-admin-panel]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $(`[data-admin-panel="${button.dataset.adminTab}"]`)?.classList.add("active");
    });
  });
}

function bindSimpleCollection(type, collectionName) {
  const form = $(`[data-${type}-form]`);
  const newButton = $(`[data-new-${type}]`);
  const deleteButton = $(`[data-delete-${type}]`);
  if (!form) return;

  newButton?.addEventListener("click", () => resetForm(type));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formObject(form);
      payload.updatedAt = new Date().toISOString();
      const id = form.elements.id.value;
      if (id) await setDoc(doc(db, collectionName, id), payload, { merge: true });
      else await addDoc(collection(db, collectionName), payload);
      await loadAll();
      resetForm(type);
      message(`[data-${type}-message]`, `${type[0].toUpperCase()}${type.slice(1)} saved.`, "success");
    } catch (error) {
      console.error(error);
      message(`[data-${type}-message]`, error.message || "Unable to save.", "error");
    }
  });

  deleteButton?.addEventListener("click", async () => {
    const id = form.elements.id.value;
    if (!id || !confirm(`Delete this ${type}?`)) return;
    await deleteDoc(doc(db, collectionName, id));
    await loadAll();
    resetForm(type);
  });
}

async function uploadImage(file, folder, progressSelector) {
  const progress = $(progressSelector);
  const bar = progress?.querySelector("span");
  if (progress) progress.hidden = false;
  if (bar) bar.style.width = "0%";

  const path = `${folder}/${Date.now()}-${safeFile(file.name)}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (bar) bar.style.width = `${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`;
      },
      reject,
      resolve
    );
  });

  return { url: await getDownloadURL(task.snapshot.ref), storagePath: path };
}

function bindPhotos() {
  const form = $("[data-photo-form]");
  if (!form) return;

  $("[data-new-photo]")?.addEventListener("click", () => resetForm("photo"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      let payload = formObject(form);
      const file = form.elements.file.files[0];
      if (file) {
        const uploaded = await uploadImage(file, "public/photos", "[data-photo-upload-progress]");
        payload = { ...payload, ...uploaded };
      } else {
        payload.url = form.elements.currentUrl.value;
        payload.storagePath = form.elements.storagePath.value;
      }
      if (!payload.url) throw new Error("Choose an image file.");
      payload.updatedAt = new Date().toISOString();

      const id = form.elements.id.value;
      if (id) await setDoc(doc(db, "photos", id), payload, { merge: true });
      else await addDoc(collection(db, "photos"), payload);

      await loadAll();
      resetForm("photo");
      $("[data-photo-upload-progress]").hidden = true;
      message("[data-photo-message]", "Photo saved.", "success");
    } catch (error) {
      console.error(error);
      message("[data-photo-message]", error.message || "Unable to save the photo.", "error");
    }
  });

  $("[data-delete-photo]")?.addEventListener("click", async () => {
    const id = form.elements.id.value;
    if (!id || !confirm("Delete this photo?")) return;
    const path = form.elements.storagePath.value;
    if (path) {
      try { await deleteObject(ref(storage, path)); } catch (error) { console.warn(error); }
    }
    await deleteDoc(doc(db, "photos", id));
    await loadAll();
    resetForm("photo");
  });
}

function bindMembers() {
  const form = $("[data-member-form]");
  if (!form) return;

  $("[data-new-member]")?.addEventListener("click", () => resetForm("member"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      let payload = formObject(form);
      const file = form.elements.file.files[0];
      if (file) {
        const uploaded = await uploadImage(file, "public/members", "[data-member-upload-progress]");
        payload.photoUrl = uploaded.url;
        payload.storagePath = uploaded.storagePath;
      } else {
        payload.photoUrl = form.elements.currentPhotoUrl.value;
        payload.storagePath = form.elements.storagePath.value;
      }
      if (!payload.photoUrl) throw new Error("Choose a member photo.");
      payload.updatedAt = new Date().toISOString();

      const id = form.elements.id.value;
      if (id) await setDoc(doc(db, "members", id), payload, { merge: true });
      else await addDoc(collection(db, "members"), payload);

      await loadAll();
      resetForm("member");
      $("[data-member-upload-progress]").hidden = true;
      message("[data-member-message]", "Member saved.", "success");
    } catch (error) {
      console.error(error);
      message("[data-member-message]", error.message || "Unable to save the member.", "error");
    }
  });

  $("[data-delete-member]")?.addEventListener("click", async () => {
    const id = form.elements.id.value;
    if (!id || !confirm("Delete this member?")) return;
    const path = form.elements.storagePath.value;
    if (path) {
      try { await deleteObject(ref(storage, path)); } catch (error) { console.warn(error); }
    }
    await deleteDoc(doc(db, "members", id));
    await loadAll();
    resetForm("member");
  });
}

function fillSettings() {
  const form = $("[data-settings-form]");
  Object.entries(state.settings).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value ?? "";
  });
}

function bindSettings() {
  const form = $("[data-settings-form]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formObject(form);
      payload.updatedAt = new Date().toISOString();
      await setDoc(doc(db, "site", "settings"), payload, { merge: true });
      state.settings = { ...state.settings, ...payload };
      message("[data-settings-message]", "Settings saved.", "success");
    } catch (error) {
      console.error(error);
      message("[data-settings-message]", "Unable to save settings.", "error");
    }
  });
}

async function seed() {
  const hasContent = state.shows.length || state.videos.length || state.photos.length || state.members.length;
  if (hasContent && !confirm("Starter content will be added alongside existing items. Continue?")) return;

  const response = await fetch(new URL("../data/site-content.json", import.meta.url));
  const data = await response.json();
  const batch = writeBatch(db);
  batch.set(doc(db, "site", "settings"), data.site, { merge: true });

  for (const name of ["shows", "videos", "photos", "members"]) {
    for (const item of data[name] || []) {
      const copy = { ...item };
      delete copy.id;
      batch.set(doc(db, name, item.id), copy, { merge: true });
    }
  }

  await batch.commit();
  await loadAll();
  message("[data-overview-message]", "Starter content loaded.", "success");
}

async function start(user) {
  state.user = user;
  $("[data-user-email]").textContent = user.email || "Signed in";

  if (!await isAdmin(user)) {
    $("[data-admin-gate]").innerHTML = '<h1>Access denied</h1><p>This account is not listed in the Firestore <code>admins</code> collection.</p>';
    return;
  }

  $("[data-admin-gate]").hidden = true;
  $("[data-admin-app]").hidden = false;
  bindTabs();
  bindSimpleCollection("show", "shows");
  bindSimpleCollection("video", "videos");
  bindCropEditor("photo", {
    formSelector: "[data-photo-form]",
    previewSelector: "[data-photo-crop-preview]",
    currentUrlField: "currentUrl"
  });
  bindCropEditor("member", {
    formSelector: "[data-member-form]",
    previewSelector: "[data-member-crop-preview]",
    currentUrlField: "currentPhotoUrl"
  });
  bindPhotos();
  bindMembers();
  bindSettings();
  $("[data-seed-content]").addEventListener("click", () => seed().catch((error) => {
    console.error(error);
    message("[data-overview-message]", "Unable to load starter content.", "error");
  }));
  await loadAll();
}

if (!firebaseEnabled) {
  $("[data-admin-gate]").innerHTML = '<h1>Firebase is not connected</h1><p>Follow <strong>FIREBASE-SETUP.md</strong>, then paste the web configuration into <code>js/firebase-config.js</code>.</p>';
} else {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.replace("login.html");
    else start(user).catch((error) => {
      $("[data-admin-gate]").innerHTML = `<h1>Dashboard error</h1><p>${error.message}</p>`;
    });
  });
  $("[data-sign-out]").addEventListener("click", () => signOut(auth).then(() => window.location.replace("login.html")));
}
