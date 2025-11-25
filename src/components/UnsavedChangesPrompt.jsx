import React from "react";
import { IoClose } from "react-icons/io5";

function UnsavedChangesPrompt({
  isOpen,
  title = "Discard changes?",
  description,
  cancelLabel = "Keep editing",
  confirmLabel = "Discard",
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-yellow-50 p-0 shadow-lg">
        <div className="flex w-full items-center justify-center rounded-t-2xl bg-primaryRed px-4 py-2 relative">
          <h2 className="text-center text-lg font-semibold text-white">
            {title}
          </h2>
          <IoClose
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-2xl text-white"
            onClick={onCancel}
          />
        </div>

        <div className="px-6 pb-6 pt-4">
          {description && (
            <p className="text-sm text-gray-700">{description}</p>
          )}

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              className="rounded-lg border-2 border-primaryRed bg-white px-4 py-2 text-sm font-bold text-primaryRed hover:bg-gray-50"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="rounded-lg bg-primaryRed px-4 py-2 text-sm font-bold text-white hover:bg-secondaryRed"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesPrompt;
