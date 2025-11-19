import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { IoClose } from "react-icons/io5";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="relative mx-4 w-full rounded-lg bg-yellow-50 p-0 shadow-lg">
        <div className="flex w-full items-center justify-center rounded-t-lg bg-primaryRed px-4 py-2 relative">
          <h2 className="text-center text-lg font-semibold text-white">
            Reset Password
          </h2>
          <IoClose
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-2xl text-white"
            onClick={onClose}
          />
        </div>
        <div className="px-6 pb-6 pt-4">
        <p className="mb-4 text-sm text-gray-600">
          Enter your email address, and we'll send you a link to reset your
          password.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mb-4 w-full rounded-lg border border-gray-300 p-2 text-sm"
        />

        {message && (
          <p className="text-center text-sm text-emerald-600">{message}</p>
        )}
        {error && <p className="text-sm text-secondaryRed">{error}</p>}

        <div className="mt-4 flex justify-center">
          {isLinkSent ? (
            // Show a single "Close" button after success
            <button
              onClick={onClose}
              className="w-40 rounded-lg bg-primaryRed px-4 py-2 text-white hover:bg-secondaryRed"
            >
              Close
            </button>
          ) : (
            // Show Send and Cancel buttons if no success yet
            <>
              <button
                onClick={handlePasswordReset}
                className="rounded-lg bg-primaryRed px-4 py-2 text-white hover:bg-secondaryRed"
              >
                Send Reset Link
              </button>
              <button
                onClick={onClose}
                className="ml-4 rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
