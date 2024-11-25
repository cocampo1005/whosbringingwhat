import React from "react";

const ConfirmDeleteModal = ({
  isOpen,
  closeModal,
  onConfirmDelete,
  deleteItemName,
}) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-yellow-50 p-6 shadow-lg">
        <h2 className="text-center text-xl font-bold">Confirm Deletion</h2>
        <p className="mt-4 text-center">
          Are you sure you want to delete{" "}
          <span className="text-red-600">{deleteItemName}</span>?
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={onConfirmDelete}
            className="rounded-md bg-primaryRed px-6 py-2 text-white active:bg-rose-500"
          >
            Delete
          </button>
          <button
            onClick={closeModal}
            className="rounded-md bg-gray-400 px-6 py-2 text-white hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
