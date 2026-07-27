import { db, firebaseEnabled } from "./firebase-client.js";

let fallbackCache;
let firestoreApi;

async function fallback() {
  if (!fallbackCache) {
    const response = await fetch(new URL("../data/site-content.json", import.meta.url));
    if (!response.ok) throw new Error("Unable to load fallback content.");
    fallbackCache = await response.json();
  }
  return fallbackCache;
}

async function firestore() {
  if (!firebaseEnabled || !db) return null;
  firestoreApi ||= await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js");
  return firestoreApi;
}

function byOrder(a, b) {
  return (Number(a.order) || 999) - (Number(b.order) || 999);
}

function normalizeCollection(name, items, { includeDrafts = false } = {}) {
  const visible = items.filter((item) => includeDrafts || item.published === true);

  if (name === "shows") {
    return visible.sort((a, b) => {
      const dateA = a.date ? new Date(`${a.date}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.date ? new Date(`${b.date}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB || byOrder(a, b);
    });
  }

  return visible.sort(byOrder);
}

async function localCollection(name, options) {
  const data = await fallback();
  return normalizeCollection(name, data[name] || [], options);
}

async function firestoreHasSiteContent() {
  if (!firebaseEnabled || !db) return false;
  try {
    const { doc, getDoc } = await firestore();
    return (await getDoc(doc(db, "site", "settings"))).exists();
  } catch (error) {
    console.warn("Unable to check whether Firestore has been initialized:", error);
    return false;
  }
}

async function getCollection(name, options = {}) {
  if (firebaseEnabled && db) {
    try {
      const { collection, getDocs, query, where } = await firestore();
      const source = options.includeDrafts
        ? collection(db, name)
        : query(collection(db, name), where("published", "==", true));
      const snapshot = await getDocs(source);
      if (!snapshot.empty) {
        return normalizeCollection(
          name,
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
          options
        );
      }
      if (await firestoreHasSiteContent()) return [];
    } catch (error) {
      console.warn(`Falling back to local ${name} content:`, error);
    }
  }
  return localCollection(name, options);
}

export async function getSettings() {
  if (firebaseEnabled && db) {
    try {
      const { doc, getDoc } = await firestore();
      const snapshot = await getDoc(doc(db, "site", "settings"));
      if (snapshot.exists()) return snapshot.data();
    } catch (error) {
      console.warn("Falling back to local site settings:", error);
    }
  }
  return (await fallback()).site;
}

export async function getShows(options = {}) {
  return getCollection("shows", options);
}

export async function getVideos(options = {}) {
  return getCollection("videos", options);
}

export async function getPhotos(options = {}) {
  return getCollection("photos", options);
}

export async function getMembers(options = {}) {
  return getCollection("members", options);
}

async function subscribeCollection(name, callback, options = {}, onError = console.error) {
  if (!firebaseEnabled || !db) {
    callback(await localCollection(name, options));
    return () => {};
  }

  const { collection, onSnapshot, query, where } = await firestore();
  let active = true;
  const source = options.includeDrafts
    ? collection(db, name)
    : query(collection(db, name), where("published", "==", true));

  const unsubscribe = onSnapshot(
    source,
    async (snapshot) => {
      if (!active) return;
      if (snapshot.empty) {
        callback((await firestoreHasSiteContent()) ? [] : await localCollection(name, options));
        return;
      }
      callback(
        normalizeCollection(
          name,
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
          options
        )
      );
    },
    async (error) => {
      console.warn(`Live ${name} updates unavailable; using local content:`, error);
      if (active) callback(await localCollection(name, options));
      onError?.(error);
    }
  );

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function subscribeSettings(callback, onError = console.error) {
  if (!firebaseEnabled || !db) {
    callback((await fallback()).site);
    return () => {};
  }

  const { doc, onSnapshot } = await firestore();
  let active = true;

  const unsubscribe = onSnapshot(
    doc(db, "site", "settings"),
    async (snapshot) => {
      if (!active) return;
      callback(snapshot.exists() ? snapshot.data() : (await fallback()).site);
    },
    async (error) => {
      console.warn("Live site settings unavailable; using local settings:", error);
      if (active) callback((await fallback()).site);
      onError?.(error);
    }
  );

  return () => {
    active = false;
    unsubscribe();
  };
}

export function subscribeShows(callback, options = {}, onError) {
  return subscribeCollection("shows", callback, options, onError);
}

export function subscribeVideos(callback, options = {}, onError) {
  return subscribeCollection("videos", callback, options, onError);
}

export function subscribePhotos(callback, options = {}, onError) {
  return subscribeCollection("photos", callback, options, onError);
}

export function subscribeMembers(callback, options = {}, onError) {
  return subscribeCollection("members", callback, options, onError);
}

export function youtubeId(value = "") {
  const match = value.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match?.[1] || (value.match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? "");
}
