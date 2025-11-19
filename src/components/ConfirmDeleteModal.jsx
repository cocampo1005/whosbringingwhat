import { useState } from "react";
import { IoClose } from "react-icons/io5";

const ConfirmDeleteModal = ({
  isOpen,
  closeModal,
  onConfirmDelete,
  deleteItemName,
  title = "Confirm Deletion",
  confirmLabel = "Delete",
  description,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);
    try {
      await onConfirmDelete();
      setIsDeleting(false);
    } catch (e) {
      console.error(e);
      setError("Failed to delete. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div
        className="mx-4 w-full rounded-lg bg-yellow-50 p-0 shadow-lg md:w-[400px] md:ml-[112px] md:translate-x-[56px]"
        role="dialog"
        aria-modal="true"
        aria-busy={isDeleting ? "true" : "false"}
      >
        <div className="flex w-full items-center justify-center rounded-t-lg bg-primaryRed px-4 py-2 relative">
          <h2 className="text-center text-xl font-bold text-white">{title}</h2>
          <IoClose
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-2xl text-white"
            onClick={closeModal}
          />
        </div>
        <div className="px-6 pb-6 pt-4">
          <p className="mt-0 text-center">
            {description ? (
              description
            ) : (
              <>
                Are you sure you want to delete{" "}
                <span className="text-red-600">{deleteItemName}</span>?
              </>
            )}
          </p>

        {error && (
          <p className="mt-3 text-center text-sm font-semibold text-secondaryRed">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={closeModal}
            className="rounded-lg border-2 border-primaryRed bg-white px-6 py-2 text-sm font-bold text-primaryRed transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex items-center rounded-lg bg-primaryRed px-6 py-2 text-sm font-bold text-white transition ${
              isDeleting ? "cursor-not-allowed opacity-70" : "active:bg-rose-500"
            }`}
          >
            {isDeleting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
