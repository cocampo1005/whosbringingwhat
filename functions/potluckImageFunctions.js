const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Infer a simple "theme" (e.g. thanksgiving, christmas, bbq) from the
 * event's title/description/date. This is deliberately heuristic and
 * only meant to bias image selection toward the right vibe.
 */
function deriveTheme({ title, description, date }) {
  const text = `${title || ""} ${description || ""}`.toLowerCase();

  let month = null;
  if (date) {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      month = parsed.getMonth() + 1; // 1-12
    }
  }

  if (text.includes("friendsgiving") || text.includes("thanksgiving") || month === 11) {
    return "thanksgiving";
  }

  if (
    text.includes("new year's") ||
    text.includes("new years") ||
    text.includes("nye")
  ) {
    return "new_years_eve";
  }

  if (
    (text.includes("office") || text.includes("work") || text.includes("company")) &&
    (text.includes("holiday") || text.includes("christmas") || (month === 12 && text.includes("party")))
  ) {
    return "office_holiday_party";
  }

  if (
    text.includes("christmas") ||
    text.includes("xmas") ||
    text.includes("holiday") ||
    text.includes("hanukkah") ||
    month === 12
  ) {
    return "christmas";
  }

  if (
    text.includes("easter") ||
    ((month === 3 || month === 4) && text.includes("brunch"))
  ) {
    return "easter_brunch";
  }

  if (text.includes("halloween") || month === 10) {
    return "halloween";
  }

  // Mother's Day / Father's Day should win over generic summer/BBQ heuristics.
  if (
    text.includes("mother's day") ||
    text.includes("mothers day") ||
    (month === 5 && text.includes("mother"))
  ) {
    return "mother_s_day";
  }

  if (
    text.includes("father's day") ||
    text.includes("fathers day") ||
    (month === 6 && text.includes("father"))
  ) {
    return "father_s_day";
  }

  // Explicit beach/pool parties so we can bias toward beachy images.
  if (text.includes("beach") || text.includes("pool")) {
    return "beach_party";
  }

  if (
    text.includes("bbq") ||
    text.includes("barbecue") ||
    text.includes("grill") ||
    (month && month >= 5 && month <= 9)
  ) {
    return "bbq";
  }

  if (text.includes("birthday")) {
    return "birthday";
  }

  if (text.includes("baby shower")) {
    return "baby_shower";
  }

  return "generic";
}

/**
 * Shared helper to fetch a random "potluck" image from the Pexels Photos Search API.
 * Uses a server-side API key exposed as PEXELS_API_KEY via process.env.
 *
 * See: https://firebase.google.com/docs/functions/config-env#migrate-to-dotenv
 */
async function fetchRandomPotluckImage({
  title = "",
  description = "",
  location = "",
  date = "",
  seed,
} = {}) {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    functions.logger.error(
      "Pexels API key not configured. Set PEXELS_API_KEY in your Functions environment (e.g. .env) before deploying.",
    );
    return null;
  }

  // Theme-aware query: choose base phrases based on inferred theme.
  const THEME_QUERIES = {
    thanksgiving: ["thanksgiving dinner", "friendsgiving", "fall table"],
    christmas: ["christmas dinner", "holiday potluck", "christmas table", "hanukkah", "hanukkah candles"],
    new_years_eve: [
      "new year's eve party",
      "new year's eve dinner",
      "champagne party",
      "new year party table",
    ],
    easter_brunch: ["easter brunch table", "easter dinner", "spring brunch"],
    halloween: ["halloween party", "spooky snacks", "halloween"],
    mother_s_day: ["mother's day brunch", "mother's day dinner"],
    father_s_day: ["father's day bbq", "father's day dinner"],
    beach_party: [
      "beach picnic",
      "beach",
      "beach dinner",
      "pool party",
    ],
    office_holiday_party: [
      "office holiday party",
      "office potluck",
      "work holiday party",
      "company holiday party",
    ],
    bbq: ["bbq", "backyard cookout", "grill party", "fireworks"],
    birthday: ["birthday party", "birthday cake table"],
    baby_shower: ["baby shower party"],
    generic: ["potluck", "dinner party", "family style meal"],
  };

  const theme = deriveTheme({ title, description, date });
  const themeTerms = THEME_QUERIES[theme] || THEME_QUERIES.generic;

  // Always reinforce with general food terms, plus optional location.
  const baseQueryParts = [...themeTerms, "food"];
  if (location) baseQueryParts.push(String(location));
  const query = baseQueryParts.join(" ");

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "20");
  url.searchParams.set("orientation", "landscape");

  let response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });
  } catch (err) {
    functions.logger.error("Error calling Pexels API", err);
    return null;
  }

  if (!response.ok) {
    functions.logger.error("Pexels API error", {
      status: response.status,
      statusText: response.statusText,
    });
    return null;
  }

  const data = await response.json();
  const rawPhotos = Array.isArray(data.photos) ? data.photos : [];
  if (!rawPhotos.length) {
    return null;
  }

  // Prefer photos whose alt text clearly references food/meal concepts.
  const FOOD_KEYWORDS = [
    "food",
    "meal",
    "dinner",
    "lunch",
    "breakfast",
    "buffet",
    "table",
    "dish",
    "plate",
    "snack",
    "bbq",
    "barbecue",
    "grill",
    "party",
    "picnic",
    "beach",
    "pool",
  ];

  let photos = rawPhotos.filter((photo) => {
    const alt = (photo.alt || "").toLowerCase();
    return FOOD_KEYWORDS.some((word) => alt.includes(word));
  });

  if (!photos.length) {
    photos = rawPhotos;
  }

  let index = Math.floor(Math.random() * photos.length);
  if (seed !== undefined) {
    const seedStr = String(seed);
    let hash = 0;
    for (let i = 0; i < seedStr.length; i += 1) {
      hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
    }
    index = Math.abs(hash) % photos.length;
  }

  const photo = photos[index];
  const src = photo && photo.src ? photo.src : {};
  const imageUrl =
    src.large2x ||
    src.large ||
    src.medium ||
    src.original ||
    src.landscape ||
    src.portrait ||
    null;

  if (!imageUrl) {
    return null;
  }

  return {
    imageUrl,
    alt: photo.alt || "People sharing dishes at a potluck",
    source: "pexels",
    sourceUrl: photo.url || null,
    photographer: photo.photographer || null,
  };
}

/**
 * Public HTTPS function: returns a random potluck image JSON payload.
 * Intended to be called by the frontend when an event is created without an image.
 */
exports.randomPotluckImage = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).set("Allow", "GET").send("Method Not Allowed");
    return;
  }

  const {
    title = "",
    location = "",
    seed,
    description = "",
    date = "",
  } = req.query;

  try {
    const result = await fetchRandomPotluckImage({
      title,
      description,
      location,
      date,
      seed,
    });
    if (!result) {
      res.status(404).json({ error: "No potluck images found" });
      return;
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.json(result);
  } catch (err) {
    functions.logger.error("randomPotluckImage failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Admin-only HTTPS function: backfills event.imageUrl for existing events
 * that currently have no image, using the same Pexels-backed helper.
 *
 * Protected via a shared secret header, as described in EVENT_IMAGE_UPLOADS_PLAN.md:
 *   - BACKFILL_SECRET is exposed via process.env and holds the expected value.
 *   - Client (bash script) sends X-Backfill-Secret: <secret>.
 */
exports.backfillEventImages = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).set("Allow", "POST").send("Method Not Allowed");
    return;
  }

  const expectedSecret = process.env.BACKFILL_SECRET;
  const headerSecret = req.get("X-Backfill-Secret");

  if (!expectedSecret || headerSecret !== expectedSecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

   // Optional override: if force=true is passed as a query param, we will
   // reassign images even for events that already have imageUrl set.
   const force = String(req.query.force || "").toLowerCase() === "true";

  try {
    const snapshot = await db.collection("events").get();

    const candidates = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if (force || !data.imageUrl) {
        candidates.push({ id: doc.id, data });
      }
    });

    const MAX_TO_PROCESS = 50;
    const slice = candidates.slice(0, MAX_TO_PROCESS);

    const updated = [];

    for (const { id, data } of slice) {
      const result = await fetchRandomPotluckImage({
        title: data.title,
        description: data.description,
        location: data.location,
        date: data.date,
        seed: id,
      });

      if (!result || !result.imageUrl) {
        continue;
      }

      await db.collection("events").doc(id).update({
        imageUrl: result.imageUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      updated.push({ id, imageUrl: result.imageUrl });
    }

    res.json({
      totalCandidates: candidates.length,
      processed: slice.length,
      updatedCount: updated.length,
      updated,
    });
  } catch (err) {
    functions.logger.error("backfillEventImages failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
