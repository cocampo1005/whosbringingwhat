import { useRouter } from "@tanstack/react-router";

/**
 * True when the app is mounted under a host basepath (the portfolio's `/projects/wbw`), false
 * standalone. Embedded, nothing may be pinned to the viewport: `position: fixed` ignores the
 * remote's box and lands on top of the host's own chrome.
 */
export function useEmbedded() {
  return useRouter().basepath !== "/";
}
