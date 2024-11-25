import React from "react";
import { MdOutlineIosShare } from "react-icons/md";

function ShareButton({ eventId, eventTitle }) {
  const handleShare = async () => {
    const shareableUrl = `${window.location.origin}/events/${eventId}`; // Generate the event link

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
    <button
      onClick={handleShare}
      className="flex items-center rounded-full bg-primaryRed p-3 text-white"
    >
      <MdOutlineIosShare className="text-lg" />
    </button>
  );
}

export default ShareButton;
