import React from "react";
import { IoClose } from "react-icons/io5";

function JoinEventPromptModal({ isOpen, onCancel, onJoin }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 p-4"
      onClick={onCancel}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-yellow-50 p-0 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-center rounded-t-2xl bg-primaryRed px-4 py-2 relative">
          <h2 className="text-center text-lg font-semibold text-white">
            Join this event?
          </h2>
          <IoClose
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-2xl text-white"
            onClick={onCancel}
          />
        </div>

        <div className="px-6 pb-6 pt-4">
          <p className="mb-4 text-sm text-primaryDark">
            You are viewing this event as a guest. Join to keep it in your
            events list and manage your items.
          </p>

          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border-2 border-primaryRed bg-white px-4 py-2 text-sm font-bold text-primaryRed hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onJoin}
              className="rounded-lg bg-primaryRed px-4 py-2 text-sm font-bold text-white hover:bg-secondaryRed"
            >
              Join Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinEventPromptModal;
