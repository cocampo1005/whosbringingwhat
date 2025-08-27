import React from "react";
import { IoClose } from "react-icons/io5";

export default function ParticipantsModal({ isOpen, onClose, participants }) {
  // If the modal isn't open, return null (don't render anything)
  if (!isOpen) return null;

  const formatName = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const cleanedParticipants = participants.map((p) => ({
    name: formatName(p.assignee),
    avatar: p.avatar,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-50">
      <div className="flex h-full items-center justify-center md:ml-[14rem]">
        <div className="relative h-[410px] w-64 overflow-scroll rounded-2xl bg-yellow-50 p-6 shadow-lg mx-auto">
          <h2 className="mb-4 border-b-2 border-primaryRed text-center text-lg font-semibold">
            Contributors
          </h2>

          {/* List of participants */}
          <ul className="space-y-2">
            {cleanedParticipants.length > 0 ? (
              cleanedParticipants.map((participant, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt="Participant avatar"
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primaryRed text-xs font-medium text-white">
                    {(() => {
                      const names = participant.name.trim().split(" ");
                      const firstInitial = names[0]?.[0] || "";
                      const lastInitial = names[names.length - 1]?.[0] || "";
                      return (firstInitial + lastInitial).toUpperCase();
                    })()}
                  </div>
                )}
                <span>{participant.name}</span>
              </li>
              ))
            ) : (
              <li className="text-gray-500">No participants yet.</li>
            )}
          </ul>

          {/* Close button */}
          <IoClose
            className="absolute right-4 top-4 cursor-pointer text-2xl"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}
