import React from "react";
import { IoClose } from "react-icons/io5";
import { useUsers } from "../contexts/UsersContext";
import AssigneeAvatar from "./AssigneeAvatar";

export default function ParticipantsModal({ isOpen, onClose, participants }) {
  const ids = participants.map(p => p.assigneeId).filter(Boolean);
  const { users: userList, status } = useUsers(ids);
  
  // Map uid -> user for quick lookup
  const userById = new Map(ids.map((id, i) => [id, userList[i]]));
  
  // If the modal isn't open, return null (don't render anything)
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-50">
      <div className="flex h-full items-center justify-center md:ml-[14rem]">
        <div className="relative h-[410px] w-64 overflow-scroll rounded-2xl bg-yellow-50 p-6 shadow-lg mx-auto">
          <h2 className="mb-4 border-b-2 border-primaryRed text-center text-lg font-semibold">
            Contributors
          </h2>

          {/* List of participants */}
          <ul className="space-y-3">
            {participants.map((p, idx) => {
              const u = p.assigneeId ? userById.get(p.assigneeId) : undefined;
              const displayName = u?.name || p.assignee || "Unnamed";
              return (
                <li key={p.assigneeId || `name:${p.assignee}-${idx}`} className="flex items-center gap-2">
                  <AssigneeAvatar
                    assigneeId={p.assigneeId}
                    displayName={displayName}
                    size={28}
                  />
                </li>
              );
            })}
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
