import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { BsPersonFill } from "react-icons/bs";
import { IoMail } from "react-icons/io5";
import { FaUnlockKeyhole } from "react-icons/fa6";
import { IoLogOut } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import ChangePasswordModal from "../components/ChangePasswordModal";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, onSnapshot } from "firebase/firestore";
import imageCompression from "browser-image-compression";

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [realTimeUser, setRealTimeUser] = useState(currentUser);
  const [uploading, setUploading] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  // Real-time listener for user profile changes
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedUserData = docSnap.data();
        setRealTimeUser((prev) => ({ ...prev, ...updatedUserData }));
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const storage = getStorage();
    setUploading(true);

    try {
      // Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      console.log("Original file size:", file.size / 1024 / 1024, "MB");
      console.log(
        "Compressed file size:",
        compressedFile.size / 1024 / 1024,
        "MB",
      );

      // Upload the compressed file to Firebase Storage
      const storageRef = ref(
        storage,
        `avatars/${currentUser.uid}/${compressedFile.name}`,
      );
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Error uploading file: ", error);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateProfile({ avatar: downloadURL });
          setUploading(false);
          console.log("File available at", downloadURL);
        },
      );
    } catch (error) {
      console.error("Error compressing file: ", error);
      setUploading(false);
    }
  };

  const handleNameUpdate = async (newName) => {
    if (newName && newName !== realTimeUser.name) {
      try {
        await updateProfile({ name: newName });
        console.log("Name updated successfully");
      } catch (error) {
        console.error("Error updating name: ", error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div className="relative mb-4">
        {realTimeUser?.avatar || realTimeUser?.photoURL ? (
          <img
            src={realTimeUser.avatar || realTimeUser.photoURL}
            alt="Profile"
            className="h-24 w-24 rounded-full border-4 border-primaryRed object-cover"
          />
        ) : (
          <BsPersonFill className="h-24 w-24 text-primaryRed" />
        )}
        {/* Edit Avatar Button */}
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 flex cursor-pointer items-center justify-center rounded-full bg-primaryRed p-2"
        >
          <FiEdit className="text-xs text-white" />
        </label>

        {/* Hidden File Input */}
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <div className="relative mb-4 flex items-center justify-center px-5">
        <h2 className="text-xl font-semibold">
          {realTimeUser?.name || "User Name"}{" "}
        </h2>
        <MdEdit
          onClick={() =>
            handleNameUpdate(prompt("Enter new name:", realTimeUser?.name))
          }
          className="text-md absolute right-0 text-primaryRed"
        />
      </div>

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
