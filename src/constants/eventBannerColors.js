export const EVENT_BANNER_COLORS = [
  "#f94a5a", // primary app red
];

export function pickRandomEventBannerColor() {
  if (!EVENT_BANNER_COLORS.length) {
    return "#f94a5a"; // primary app red fallback
  }
  const index = Math.floor(Math.random() * EVENT_BANNER_COLORS.length);
  return EVENT_BANNER_COLORS[index];
}
