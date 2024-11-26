import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { BsPersonFill } from "react-icons/bs";
import { IoMail } from "react-icons/io5";
import { FaUnlockKeyhole } from "react-icons/fa6";
import { IoLogOut } from "react-icons/io5";
import ChangePasswordModal from "../components/ChangePasswordModal";

export default function Profile() {
  const { currentUser } = useAuth();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  return (
    <div className="flex flex-col items-center p-6">
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

      <h2 className="mb-2 text-xl font-semibold">
        {currentUser?.name || "User Name"}{" "}
      </h2>

      <div className="w-full rounded-2xl bg-white px-4 shadow-md">
        <div className="flex items-center border-b border-b-gray-200 py-4">
          <IoMail className="mr-4 text-xl text-primaryRed" />
          <p className="text-sm text-gray-500 no-underline">
            {currentUser.email}
          </p>
        </div>
        <div
          onClick={() => setIsChangePasswordModalOpen(true)}
          className="flex items-center border-b border-b-gray-200 py-4"
        >
          <FaUnlockKeyhole className="mr-4 text-xl text-primaryRed" />
          <p className="text-sm text-gray-500">Change Password</p>
        </div>
        <div onClick={handleLogout} className="flex items-center py-4">
          <IoLogOut className="mr-4 text-xl text-primaryRed" />
          <p className="text-sm text-gray-500">Log Out</p>
        </div>
      </div>
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </div>
  );
}
