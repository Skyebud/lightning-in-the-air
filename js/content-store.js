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
async function getCollection(name) {
  if (firebaseEnabled && db) {
    try {
      const { collection, getDocs } = await firestore();
      const snapshot = await getDocs(collection(db, name));
      if (!snapshot.empty) return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.warn(`Falling back to local ${name} content:`, error);
    }
  }
  const data = await fallback();
  return data[name] || [];
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
function byOrder(a, b) { return (Number(a.order) || 999) - (Number(b.order) || 999); }
export async function getShows({ includeDrafts = false } = {}) {
  const items = await getCollection("shows");
  return items.filter((item) => includeDrafts || item.published === true).sort((a,b) => {
    const da = a.date ? new Date(`${a.date}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    const dbv = b.date ? new Date(`${b.date}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    return da - dbv || byOrder(a,b);
  });
}
export async function getVideos({ includeDrafts = false } = {}) { return (await getCollection("videos")).filter((item) => includeDrafts || item.published === true).sort(byOrder); }
export async function getPhotos({ includeDrafts = false } = {}) { return (await getCollection("photos")).filter((item) => includeDrafts || item.published === true).sort(byOrder); }
export async function getMembers({ includeDrafts = false } = {}) { return (await getCollection("members")).filter((item) => includeDrafts || item.published === true).sort(byOrder); }
export function youtubeId(value = "") {
  const match = value.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match?.[1] || (value.match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? "");
}
