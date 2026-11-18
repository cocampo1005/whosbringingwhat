import { DialogShell, Button } from "./ui";

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
    <DialogShell
      title={title}
      labelledById="unsaved-changes-title"
      description={description || undefined}
      actions={
        <>
          <Button variant="soft" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

export default UnsavedChangesPrompt;
