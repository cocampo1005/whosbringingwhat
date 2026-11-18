import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { DialogShell, Button } from "./ui";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLinkSent, setIsLinkSent] = useState(false);

  const handlePasswordReset = async () => {
    setMessage("");
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Check your email.");
      setIsLinkSent(true);
      setEmail("");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    }
  };

  return (
    <DialogShell
      title="Reset Password"
      labelledById="forgot-password-title"
      description={
        <p>
          Enter your email address, and we'll send you a link to reset your
          password.
        </p>
      }
      actions={
        isLinkSent ? (
          // Show a single "Close" button after success
          <Button onClick={onClose}>Close</Button>
        ) : (
          // Show Send and Cancel buttons if no success yet
          <>
            <Button variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePasswordReset}>Send Reset Link</Button>
          </>
        )
      }
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="mt-4 block h-[46px] w-full rounded-full border-0 bg-surface2 px-4 font-sans text-base text-ink placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-selected"
      />

      {message && (
        <p className="mt-3 text-center text-sm text-success">{message}</p>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </DialogShell>
  );
}
