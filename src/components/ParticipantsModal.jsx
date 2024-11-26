import React from "react";

export default function ParticipantsModal({ isOpen, onClose, participants }) {
  // If the modal isn't open, return null (don't render anything)
  if (!isOpen) return null;

  const formatName = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const cleanedParticipants = participants.map(formatName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="relative h-[410px] w-64 overflow-scroll rounded-2xl bg-yellow-50 p-6 shadow-lg">
        <h2 className="mb-4 text-center text-lg font-semibold">Participants</h2>

        {/* List of participants */}
        <ul className="space-y-2">
          {cleanedParticipants.length > 0 ? (
            cleanedParticipants.map((participant, index) => (
              <li key={index} className="text-lg">
                {participant}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No participants yet.</li>
          )}
        </ul>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-3xl text-gray-500"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
