import { reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { EmailAuthProvider } from "firebase/auth/web-extension";
import { useState } from "react";
import { LuEye, LuEyeOff, LuCheckCircle, LuAlertTriangle } from "react-icons/lu";
import { auth } from "../firebase";
import { DialogShell, Button } from "./ui";

export default function ChangePasswordModal({ onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on input change
  };

  const validateFields = () => {
    const newErrors = {};
    if (!formData.currentPassword)
      newErrors.currentPassword = "Current password is required.";
    if (!formData.newPassword)
      newErrors.newPassword = "New password is required.";
    if (formData.newPassword && formData.newPassword.length < 6)
      newErrors.newPassword = "Password must be at least 6 characters.";
    if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateFields();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setErrors({ submit: "No authenticated user. Please log in again." });
        return;
      }

      // Reauthenticate the user with their current password
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Update the password
      await updatePassword(user, formData.newPassword);

      setSuccess("Password changed successfully.");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
        setErrors({ currentPassword: "The current password is incorrect." });
      } else if (error.code === "auth/too-many-requests") {
        setErrors({ submit: "Too many attempts. Try again later." });
      } else {
        setErrors({ submit: "Failed to change password. Please try again." });
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <DialogShell
      title="Change Password"
      labelledById="change-password-title"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!success) handleSubmit();
        }}
      >
        {success && (
          <div className="mt-4 flex flex-col items-center justify-center">
            <LuCheckCircle className="text-2xl text-success" />
            <p className="text-center text-sm font-bold text-success">
              {success}
            </p>
          </div>
        )}
        {errors.submit && (
          <div className="mt-4 flex flex-col items-center justify-center">
            <LuAlertTriangle className="text-2xl text-danger" />
            <p className="text-center text-sm font-bold text-danger">
              {errors.submit}
            </p>
          </div>
        )}

      <div className="mt-4">
        <label htmlFor="currentPassword" className="block text-sm font-semibold text-ink">
          Current Password
        </label>
        <div className="relative mt-1">
          <input
            id="currentPassword"
            name="currentPassword"
            type={showPasswords.current ? "text" : "password"}
            autoComplete="current-password"
            value={formData.currentPassword}
            onChange={handleChange}
            className="block w-full rounded-full border border-transparent bg-surface2 px-4 py-2.5 pr-11 text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-selected-text"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility("current")}
            aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
            className="absolute inset-y-0 right-0 flex items-center rounded-full pr-4 text-muted hover:text-ink"
          >
            {showPasswords.current ? (
              <LuEyeOff className="h-5 w-5" />
            ) : (
              <LuEye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="mt-1 px-2 text-xs text-danger">{errors.currentPassword}</p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="newPassword" className="block text-sm font-semibold text-ink">
          New Password
        </label>
        <div className="relative mt-1">
          <input
            id="newPassword"
            name="newPassword"
            type={showPasswords.new ? "text" : "password"}
            autoComplete="new-password"
            value={formData.newPassword}
            onChange={handleChange}
            className="block w-full rounded-full border border-transparent bg-surface2 px-4 py-2.5 pr-11 text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-selected-text"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility("new")}
            aria-label={showPasswords.new ? "Hide new password" : "Show new password"}
            className="absolute inset-y-0 right-0 flex items-center rounded-full pr-4 text-muted hover:text-ink"
          >
            {showPasswords.new ? (
              <LuEyeOff className="h-5 w-5" />
            ) : (
              <LuEye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 px-2 text-xs text-danger">{errors.newPassword}</p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-ink">
          Confirm New Password
        </label>
        <div className="relative mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPasswords.confirm ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="block w-full rounded-full border border-transparent bg-surface2 px-4 py-2.5 pr-11 text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-selected-text"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility("confirm")}
            aria-label={showPasswords.confirm ? "Hide confirm new password" : "Show confirm new password"}
            className="absolute inset-y-0 right-0 flex items-center rounded-full pr-4 text-muted hover:text-ink"
          >
            {showPasswords.confirm ? (
              <LuEyeOff className="h-5 w-5" />
            ) : (
              <LuEye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 px-2 text-xs text-danger">{errors.confirmPassword}</p>
        )}
      </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {success ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="soft" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Change Password</Button>
            </>
          )}
        </div>
      </form>
    </DialogShell>
  );
}
