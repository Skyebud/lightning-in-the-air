import { firebaseConfig } from "./firebase-config.js";

const required = ["apiKey", "authDomain", "projectId", "storageBucket", "appId"];
export const firebaseEnabled = required.every((key) => Boolean(firebaseConfig[key]?.trim()));

let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;

if (firebaseEnabled) {
  const [{ initializeApp }, { getAuth }, { getFirestore }, { getStorage }, { getFunctions }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js")
  ]);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, "us-east1");
}

export { app, auth, db, storage, functions };
