import React from "react";
import { useRouter } from "@tanstack/react-router";
import { MdOutlineIosShare } from "react-icons/md";

function ShareButton({
  eventId,
  eventTitle,
  className = "flex items-center rounded-full bg-primaryRed p-2 text-white hover:bg-secondaryRed",
  iconClassName = "text-lg",
}) {
  const router = useRouter();

  const handleShare = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // The router knows the basepath the app is mounted under; the origin is the page's.
    const eventPath = router.buildLocation({
      to: `/events/${eventId}`,
    }).publicHref;
    const shareableUrl = new URL(eventPath, window.location.href).toString();

    if (navigator.share) {
      try {
        // Use the Web Share API to share the event
        await navigator.share({
          title: `Check out this event: ${eventTitle}`,
          text: `I'd love for you to join! Here's the link:`,
          url: shareableUrl,
        });
        alert("Event shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback if Web Share API isn't supported
      navigator.clipboard.writeText(shareableUrl);
      alert("Event link copied to clipboard!");
    }
  };

  return (
    <button onClick={handleShare} className={className}>
      <MdOutlineIosShare className={iconClassName} />
    </button>
  );
}

export default ShareButton;
