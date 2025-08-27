import { reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { EmailAuthProvider } from "firebase/auth/web-extension";
import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FaRegCircleCheck } from "react-icons/fa6";
import { PiWarningBold } from "react-icons/pi";
import { auth } from "../firebase";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 sm:mx-auto rounded-2xl bg-yellow-50 p-6 shadow-lg md:mr-[12rem]">
        <h2 className="mb-4 text-center text-lg font-semibold">
          Change Password
        </h2>

        {success && (
          <div className="mb-4 flex flex-col items-center justify-center">
            <FaRegCircleCheck className="text-2xl text-emerald-600" />
            <p className="text-center text-sm font-bold text-emerald-600">
              {success}
            </p>
          </div>
        )}
        {errors.submit && (
          <div className="mb-4 flex flex-col items-center justify-center">
            <PiWarningBold className="text-2xl text-secondaryRed" />
            <p className="text-center text-sm font-bold text-secondaryRed">
              {errors.submit}
            </p>
          </div>
        )}

        {/* Current Password */}
        <div className="mb-4">
          <label
            htmlFor="currentPassword"
            className="block text-sm text-gray-600"
          >
            Current Password
          </label>
          <div className="relative mt-1">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-primaryRed focus:ring-primaryRed"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPasswords.current ? (
                <FaRegEyeSlash className="h-5 w-5 text-gray-500" />
              ) : (
                <FaRegEye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-500">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm text-gray-600">
            New Password
          </label>
          <div className="relative mt-1">
            <input
              id="newPassword"
              name="newPassword"
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-primaryRed focus:ring-primaryRed"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPasswords.new ? (
                <FaRegEyeSlash className="h-5 w-5 text-gray-500" />
              ) : (
                <FaRegEye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label
            htmlFor="confirmPassword"
            className="block text-sm text-gray-600"
          >
            Confirm New Password
          </label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-primaryRed focus:ring-primaryRed"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPasswords.confirm ? (
                <FaRegEyeSlash className="h-5 w-5 text-gray-500" />
              ) : (
                <FaRegEye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          {success ? (
            <button
              onClick={onClose}
              className="flex-grow rounded-lg bg-primaryRed px-4 py-2 text-white hover:bg-secondaryRed"
            >
              Close
            </button>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-grow rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-grow rounded-lg bg-primaryRed px-4 py-2 text-white hover:bg-secondaryRed"
              >
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
