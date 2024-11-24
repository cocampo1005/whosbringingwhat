import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Profile() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  return (
    <div>
      <h1>Profile Page</h1>
      <button
        onClick={handleLogout}
        className="bg-primaryRed w-full max-w-xs rounded-md px-4 py-2 text-white"
      >
        Logout
      </button>
    </div>
  );
}
