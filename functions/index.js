const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("node:crypto");

initializeApp();
const db = getFirestore();
const REGION = "us-east1";

function clean(value, max = 500) {
  return String(value || "").trim().replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max);
}
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char])); }

exports.submitBookingRequest = onCall({ region: REGION, cors: true }, async (request) => {
  const data = request.data || {};
  if (data.website) return { ok: true };

  const payload = {
    name: clean(data.name, 120),
    email: clean(data.email, 180).toLowerCase(),
    phone: clean(data.phone, 60),
    organization: clean(data.organization, 180),
    eventDate: clean(data.date, 30),
    eventType: clean(data.eventType, 100),
    location: clean(data.location, 200),
    message: clean(data.message, 3000)
  };
  if (!payload.name || !payload.organization || !validEmail(payload.email)) {
    throw new HttpsError("invalid-argument", "Please provide a valid name, email, and venue or organization.");
  }

  const ip = String(request.rawRequest?.ip || request.rawRequest?.headers?.["x-forwarded-for"] || "unknown");
  const key = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const limitRef = db.collection("submissionLimits").doc(key);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(limitRef);
    const recent = (snap.data()?.timestamps || []).filter((stamp) => now - stamp < 10 * 60 * 1000);
    if (recent.length >= 3) throw new HttpsError("resource-exhausted", "Please wait before submitting another inquiry.");
    tx.set(limitRef, { timestamps: [...recent, now], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });

  const requestRef = db.collection("bookingRequests").doc();
  await requestRef.set({
    ...payload,
    status: "new",
    adminNotes: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  const settingsSnap = await db.doc("site/settings").get();
  const to = settingsSnap.data()?.bookingEmail;
  if (to && validEmail(to)) {
    const subject = `New booking inquiry — ${payload.organization}`;
    const rows = [
      ["Name", payload.name], ["Email", payload.email], ["Phone", payload.phone || "Not provided"],
      ["Organization", payload.organization], ["Event date", payload.eventDate || "Not confirmed"],
      ["Event type", payload.eventType || "Not provided"], ["Location", payload.location || "Not provided"]
    ];
    await db.collection("mail").add({
      to: [to],
      replyTo: payload.email,
      message: {
        subject,
        text: rows.map(([label, value]) => `${label}: ${value}`).join("\n") + `\n\n${payload.message}`,
        html: `<h2>${escapeHtml(subject)}</h2>${rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")}<p><strong>Message:</strong></p><p>${escapeHtml(payload.message).replace(/\n/g, "<br>")}</p>`
      }
    });
  }
  return { ok: true, id: requestRef.id };
});
