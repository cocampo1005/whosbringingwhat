import React, { useState } from "react";

// Reusable tooltip wrapper: shows content on hover/focus, and toggles on click (good for mobile).
export default function Tooltip({
  content,
  ariaLabel,
  children,
  placement = "top", // "top" | "bottom"
}) {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  const toggle = () => setVisible((v) => !v);

  const isBottom = placement === "bottom";

  return (
    <div className="relative ml-auto inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={toggle}
        className="ml-1 text-primaryRed hover:text-secondaryRed focus:outline-none"
      >
        {children}
      </button>

      {visible && (
        <div
          role="tooltip"
          className={`absolute right-0 z-20 ${
            isBottom ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <div className="relative w-72 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black shadow-lg">
            {content}
            <div
              className={`absolute right-[4px] h-2 w-2 rotate-45 bg-white shadow-lg ${
                isBottom
                  ? "bottom-full translate-y-1/2" // arrow on top edge (tooltip below trigger)
                  : "top-full -translate-y-1/2" // arrow on bottom edge (tooltip above trigger)
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
