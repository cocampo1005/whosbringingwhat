import { useState } from "react";

const ConfirmDeleteModal = ({
  isOpen,
  closeModal,
  onConfirmDelete,
  deleteItemName,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="mx-4 w-full rounded-lg bg-yellow-50 p-6 shadow-lg md:w-[400px]"
        role="dialog"
        aria-modal="true"
        aria-busy={isDeleting ? "true" : "false"}
      >
        <h2 className="text-center text-xl font-bold">Confirm Deletion</h2>
        <p className="mt-4 text-center">
          Are you sure you want to delete{" "}
          <span className="text-red-600">{deleteItemName}</span>?
        </p>

        {error && (
          <p className="mt-3 text-center text-sm font-semibold text-secondaryRed">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex items-center rounded-lg bg-primaryRed px-6 py-2 text-white transition ${isDeleting ? "cursor-not-allowed opacity-70" : "active:bg-rose-500"} `}
          >
            {isDeleting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </button>

          <button
            onClick={closeModal}
            className={`: "hover:bg-gray-50"} rounded-lg border-2 border-primaryRed bg-white px-6 py-2 font-bold text-primaryRed transition`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
