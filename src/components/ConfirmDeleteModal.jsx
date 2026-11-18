import { useState } from "react";
import { DialogShell, Button } from "./ui";

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
    <DialogShell
      title={title}
      labelledById="confirm-delete-title"
      aria-busy={isDeleting ? "true" : "false"}
      description={
        <p className="mt-0">
          {description ? (
            description
          ) : (
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-danger">{deleteItemName}</span>?
            </>
          )}
        </p>
      }
      actions={
        <>
          <Button variant="soft" onClick={closeModal}>
            Cancel
          </Button>

          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </>
      }
    >
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger">{error}</p>
      )}
    </DialogShell>
  );
};

export default ConfirmDeleteModal;
