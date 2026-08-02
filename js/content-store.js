import { db, firebaseEnabled } from "./firebase-client.js";

let firestoreApi;

const defaultTestimonials = Object.freeze([
  {
    "quote": "If you're looking for a band that brings great music, professionalism, and Southern rock the way it ought to be played, you won't go wrong with this group.",
    "attribution": "Greg Stone · Director—Shelby County Arts Council"
  },
  {
    "quote": "Lightning in the Air puts on a very authentic tribute show for Marshall Tucker Band. Super talented musicians and I really felt like I was hearing the real thing.",
    "attribution": "Ian Cuthbertson · Dead for Love (Grateful Dead Tribute)"
  },
  {
    "quote": "Lightning in the Air captures the musicianship and sound of the Marshall Tucker Band with hits and deep cuts for both casual and hardcore fans. Definitely must check out!",
    "attribution": "Kyle Sainhill · Booking Agent, Elysian Gardens, Birmingham"
  }
]);

const emptySettings = Object.freeze({
  announcement: "",
  bookingEmail: "",
  bookingPhone: "",
  youtubeUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  homeQuote: "",
  homeQuoteBy: "",
  testimonials: defaultTestimonials
});


function mergeSettings(data = {}) {
  const hasTestimonials = Object.prototype.hasOwnProperty.call(data, "testimonials");
  const testimonials = hasTestimonials
    ? (Array.isArray(data.testimonials) ? data.testimonials : [])
    : defaultTestimonials;
  return {
    ...emptySettings,
    ...data,
    testimonials: testimonials
      .map((item) => ({
        quote: String(item?.quote || "").trim(),
        attribution: String(item?.attribution || "").trim()
      }))
      .filter((item) => item.quote)
  };
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

async function getCollection(name, options = {}) {
  if (!firebaseEnabled || !db) return [];
  try {
    const { collection, getDocs, query, where } = await firestore();
    const source = options.includeDrafts
      ? collection(db, name)
      : query(collection(db, name), where("published", "==", true));
    const snapshot = await getDocs(source);
    return normalizeCollection(
      name,
      snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      options
    );
  } catch (error) {
    console.error(`Unable to load ${name}:`, error);
    return [];
  }
}

export async function getSettings() {
  if (!firebaseEnabled || !db) return { ...emptySettings };
  try {
    const { doc, getDoc } = await firestore();
    const snapshot = await getDoc(doc(db, "site", "settings"));
    return snapshot.exists() ? mergeSettings(snapshot.data()) : mergeSettings();
  } catch (error) {
    console.error("Unable to load site settings:", error);
    return mergeSettings();
  }
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
    callback([]);
    return () => {};
  }

  const { collection, onSnapshot, query, where } = await firestore();
  const source = options.includeDrafts
    ? collection(db, name)
    : query(collection(db, name), where("published", "==", true));

  return onSnapshot(
    source,
    (snapshot) => callback(normalizeCollection(
      name,
      snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      options
    )),
    (error) => {
      console.error(`Live ${name} updates unavailable:`, error);
      callback([]);
      onError?.(error);
    }
  );
}

export async function subscribeSettings(callback, onError = console.error) {
  if (!firebaseEnabled || !db) {
    callback({ ...emptySettings });
    return () => {};
  }

  const { doc, onSnapshot } = await firestore();
  return onSnapshot(
    doc(db, "site", "settings"),
    (snapshot) => callback(snapshot.exists()
      ? mergeSettings(snapshot.data())
      : mergeSettings()),
    (error) => {
      console.error("Live site settings unavailable:", error);
      callback(mergeSettings());
      onError?.(error);
    }
  );
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
