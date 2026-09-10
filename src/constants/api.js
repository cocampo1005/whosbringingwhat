// Public HTTPS function; called directly from every origin the app runs on (Firebase Hosting
// and the portfolio), so the app never depends on a hosting rewrite of the current origin.
export const RANDOM_POTLUCK_IMAGE_URL =
  "https://us-central1-whos-bringing-what.cloudfunctions.net/randomPotluckImage";
