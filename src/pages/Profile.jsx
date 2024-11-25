import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { BsPersonFill } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";

export default function Profile() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  return (
    <div className="flex h-full flex-col items-center p-6">
      {/* Profile Picture (Icon if no avatar) */}
      <div className="mb-4">
        {currentUser?.avatar ? (
          <img
            src={currentUser.avatar}
            alt="Profile"
            className="h-24 w-24 rounded-full border-4 border-primaryRed object-cover"
          />
        ) : (
          <BsPersonFill className="h-24 w-24 text-primaryRed" />
        )}
      </div>

      {/* User Name */}
      <h2 className="mb-2 text-xl font-semibold">
        {currentUser?.name || "User Name"}{" "}
        {/* Display current user's name or fallback */}
      </h2>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex w-full max-w-xs items-center justify-center rounded-md bg-primaryRed px-4 py-2 text-white"
      >
        <FiLogOut className="text-xl text-white" />
        <p className="pl-3">Logout</p>
      </button>
    </div>
  );
}
