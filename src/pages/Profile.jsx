import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  signOut,
  deleteUser,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import ChangePasswordModal from "../components/ChangePasswordModal";
import imageCompression from "browser-image-compression";
import { BsPersonFill } from "react-icons/bs";
import { IoMail, IoLogOut, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { MdEdit, MdSecurity, MdDelete } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import { LuVegan } from "react-icons/lu";
import { FaLeaf, FaFish, FaUnlockKeyhole } from "react-icons/fa6";
import { FaPepperHot, FaGlideG } from "react-icons/fa";
import { GiChicken, GiPeanut, GiMilkCarton, GiShrimp } from "react-icons/gi";
import { PiCowFill } from "react-icons/pi";
import { FcGoogle } from "react-icons/fc";
import { PorkIconComponent } from "../styles/svgs";

const dietaryRestrictions = {
  vegan: { icon: <LuVegan />, color: "text-green-600", label: "Vegan" },
  vegetarian: {
    icon: <FaLeaf />,
    color: "text-emerald-500",
    label: "Vegetarian",
  },
  noPork: {
    icon: <PorkIconComponent />,
    color: "text-pink-400",
    label: "No Pork",
  },
  noBeef: {
    icon: <PiCowFill />,
    color: "text-amber-800",
    label: "No Beef",
  },
  noPoultry: {
    icon: <GiChicken />,
    color: "text-orange-400",
    label: "No Poultry",
  },
  noFish: {
    icon: <FaFish />,
    color: "text-sky-600",
    label: "No Fish",
  },
  shellfishAllergy: {
    icon: <GiShrimp />,
    color: "text-orange-600",
    label: "Shellfish Allergy",
  },
  nutAllergy: {
    icon: <GiPeanut />,
    color: "text-yellow-600",
    label: "Nut Allergy",
  },
  lactoseIntolerant: {
    icon: <GiMilkCarton />,
    color: "text-blue-500",
    label: "Lactose Intolerant",
  },
  glutenFree: {
    icon: <FaGlideG />,
    color: "text-purple-600",
    label: "Gluten Intolerant",
  },
  noSpicy: {
    icon: <FaPepperHot />,
    color: "text-red-600",
    label: "No Spicy",
  },
};

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [realTimeUser, setRealTimeUser] = useState(currentUser);
  const [uploading, setUploading] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);

  const [isEditingDietary, setIsEditingDietary] = useState(false);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Real-time listener for user profile changes
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Check if user is signed in with Google
    const providerData = currentUser.providerData || [];
    const isGoogle = providerData.some(
      (provider) => provider.providerId === "google.com",
    );
    setIsGoogleUser(isGoogle);

    const userDocRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedUserData = docSnap.data();
        setRealTimeUser((prev) => ({ ...prev, ...updatedUserData }));
        setSelectedRestrictions(updatedUserData.dietaryRestrictions || []);
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

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );

    if (!confirmation) return;

    const password = prompt(
      "Please enter your current password to confirm account deletion:",
    );
    if (!password) return;

    try {
      // Get the current user from auth
      const user = auth.currentUser;
      if (!user) {
        alert("No user is currently signed in.");
        return;
      }

      // Create credential for reauthentication
      const credential = EmailAuthProvider.credential(user.email, password);

      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential);

      // Delete user document from Firestore first
      await deleteDoc(doc(db, "users", user.uid));

      // Delete the user account
      await deleteUser(user);

      console.log("Account deleted successfully");
    } catch (error) {
      console.error("Error deleting account: ", error);

      // Provide more specific error messages
      if (error.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many failed attempts. Please try again later.");
      } else if (error.code === "auth/requires-recent-login") {
        alert(
          "For security reasons, please log out and log back in before deleting your account.",
        );
      } else {
        alert("Error deleting account. Please try again or contact support.");
      }
    }
  };

  const handleEmailUpdate = async () => {
    if (isGoogleUser) {
      alert(
        "To change your email, please visit your Google account settings at myaccount.google.com",
      );
      return;
    }

    const newEmail = prompt("Enter new email:", currentUser.email);
    if (!newEmail || newEmail === currentUser.email) return;

    const password = prompt(
      "Please enter your current password to confirm email change:",
    );
    if (!password) return;

    try {
      // Get the current user from auth
      const user = auth.currentUser;
      if (!user) {
        alert("No user is currently signed in.");
        return;
      }

      // Create credential for reauthentication
      const credential = EmailAuthProvider.credential(user.email, password);

      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential);

      // Update email in Firebase Auth
      await updateEmail(user, newEmail);

      // Update email in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { email: newEmail });

      console.log("Email updated successfully");
      alert("Email updated successfully!");
    } catch (error) {
      console.error("Error updating email: ", error);

      // Provide more specific error messages
      if (error.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use by another account.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format. Please enter a valid email.");
      } else if (error.code === "auth/requires-recent-login") {
        alert(
          "For security reasons, please log out and log back in before changing your email.",
        );
      } else {
        alert("Error updating email. Please try again or contact support.");
      }
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

  const handleDietaryRestrictionsUpdate = async () => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        dietaryRestrictions: selectedRestrictions,
      });
      setIsEditingDietary(false);
      console.log("Dietary restrictions updated successfully");
    } catch (error) {
      console.error("Error updating dietary restrictions: ", error);
    }
  };

  const toggleRestriction = (restriction) => {
    setSelectedRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction],
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6 py-8 md:p-12">
      <div className="w-full max-w-2xl space-y-8 md:flex md:flex-col md:justify-between">
        {/* Profile Avatar and Name */}
        <div className="flex flex-col items-center md:flex-row md:items-center">
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

          <div className="md:ml-8">
            <div className="relative flex items-center justify-center px-5 md:justify-start md:p-0">
              <h2 className="text-xl font-semibold">
                {realTimeUser?.name || "User Name"}{" "}
              </h2>
              <MdEdit
                onClick={() =>
                  handleNameUpdate(
                    prompt("Enter new name:", realTimeUser?.name),
                  )
                }
                className="text-md absolute right-0 cursor-pointer text-primaryRed md:right-[-10px]"
              />
            </div>
            {realTimeUser?.createdAt && (
              <p className="text-center text-xs text-gray-400 md:text-start">
                Member since{" "}
                {(
                  realTimeUser.createdAt?.toDate?.() ||
                  (realTimeUser.createdAt?.seconds &&
                    new Date(realTimeUser.createdAt.seconds * 1000)) ||
                  new Date(realTimeUser.createdAt)
                ).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Dietary Restrictions Section */}
          <div className="w-full rounded-2xl bg-white px-4 shadow-md">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <FaLeaf className="mr-4 text-xl text-primaryRed" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Dietary Restrictions
                </h3>
              </div>
              <MdEdit
                onClick={() => setIsEditingDietary(!isEditingDietary)}
                className="cursor-pointer text-lg text-primaryRed"
              />
            </div>

            <div className="pb-4">
              {isEditingDietary ? (
                <div>
                  <div className="mb-6 space-y-3">
                    {Object.entries(dietaryRestrictions).map(
                      ([key, { icon, color, label }]) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center space-x-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRestrictions.includes(key)}
                            onChange={() => toggleRestriction(key)}
                            className="rounded border-gray-300 text-primaryRed focus:ring-primaryRed"
                          />
                          <div className={`text-lg ${color}`}>{icon}</div>
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ),
                    )}
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleDietaryRestrictionsUpdate}
                      className="flex items-center rounded-lg bg-primaryRed px-6 py-2 text-white transition active:bg-rose-500"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setIsEditingDietary(false);
                        setSelectedRestrictions(
                          realTimeUser?.dietaryRestrictions || [],
                        );
                      }}
                      className="rounded-lg border-2 border-primaryRed bg-white px-6 py-2 font-bold text-primaryRed transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(realTimeUser?.dietaryRestrictions || []).length > 0 ? (
                    (realTimeUser.dietaryRestrictions || []).map(
                      (restriction) => {
                        const restrictionData =
                          dietaryRestrictions[restriction];
                        return restrictionData ? (
                          <div
                            key={restriction}
                            className="flex items-center space-x-2 rounded-full bg-gray-100 px-3 py-1"
                          >
                            <div className={`text-sm ${restrictionData.color}`}>
                              {restrictionData.icon}
                            </div>
                            <span className="text-sm text-gray-700">
                              {restrictionData.label}
                            </span>
                          </div>
                        ) : null;
                      },
                    )
                  ) : (
                    <p className="text-sm text-gray-500">
                      No dietary restrictions set
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="w-full rounded-2xl bg-white px-4 shadow-md">
            <div
              onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
              className="flex cursor-pointer items-center justify-between py-4"
            >
              <div className="flex items-center">
                <MdSecurity className="mr-4 text-xl text-primaryRed" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Security
                </h3>
              </div>
              {isSecurityExpanded ? <IoChevronUp /> : <IoChevronDown />}
            </div>

            {isSecurityExpanded && (
              <div className="pb-4">
                {isGoogleUser && (
                  <div className="mb-2 flex items-center justify-center rounded-md bg-rose-50 p-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FcGoogle size={20} />
                      Logged in with Google
                    </div>
                  </div>
                )}

                {/* Change Email Section */}
                <div
                  onClick={handleEmailUpdate}
                  className="flex cursor-pointer items-center border-b border-b-gray-200 py-3 hover:bg-gray-50"
                >
                  <IoMail className="mr-4 text-lg text-primaryRed" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Change Email
                    </p>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                  </div>
                </div>

                {/* Change Password Section */}
                <div
                  onClick={() => {
                    if (isGoogleUser) {
                      alert(
                        "To change your password, please visit your Google account settings at myaccount.google.com",
                      );
                    } else {
                      setIsChangePasswordModalOpen(true);
                    }
                  }}
                  className="flex cursor-pointer items-center border-b border-b-gray-200 py-3 hover:bg-gray-50"
                >
                  <FaUnlockKeyhole className="mr-4 text-lg text-primaryRed" />
                  <p className="text-sm font-medium text-gray-700">
                    Change Password
                  </p>
                </div>

                {/* Log Out Section */}
                <div
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center border-b border-b-gray-200 py-3 hover:bg-gray-50"
                >
                  <IoLogOut className="mr-4 text-lg text-primaryRed" />
                  <p className="text-sm font-medium text-gray-700">Log Out</p>
                </div>

                {/* Delete Account Section */}
                <div
                  onClick={handleDeleteAccount}
                  className="flex cursor-pointer items-center py-3 hover:bg-red-50"
                >
                  <MdDelete className="mr-4 text-lg text-red-600" />
                  <p className="text-sm font-medium text-red-600">
                    Delete Account
                  </p>
                </div>
              </div>
            )}
          </div>
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
