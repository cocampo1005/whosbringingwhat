import { useEffect } from "react";

export default function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" || event.key === "Esc") {
        if (typeof onEscape === "function") {
          onEscape(event);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEscape, active]);
}
