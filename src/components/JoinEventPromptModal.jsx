import React from "react";
import { DialogShell, Button } from "./ui";
import charGreen from "../assets/brand/characters/char-green.svg";

function JoinEventPromptModal({ isOpen, onCancel, onJoin }) {
  if (!isOpen) return null;

  return (
    <DialogShell
      onBackdropClick={(e) => {
        if (e.target !== e.currentTarget) return;
        onCancel();
      }}
      labelledById="join-event-prompt-title"
      title={
        <>
          <img
            src={charGreen}
            alt=""
            aria-hidden="true"
            className="mb-3 h-20 w-auto"
          />
          Join this event?
        </>
      }
      description="You are viewing this event as a guest. Join to keep it in your events list and manage your items."
      actions={
        <>
          <Button variant="soft" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" onClick={onJoin}>
            Join Event
          </Button>
        </>
      }
    />
  );
}

export default JoinEventPromptModal;
