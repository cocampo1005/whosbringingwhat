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
import {
  LuVegan,
  LuPencil,
  LuCamera,
  LuLeaf,
  LuShield,
  LuMail,
  LuKeyRound,
  LuLogOut,
  LuTrash2,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { FaLeaf, FaFish } from "react-icons/fa6";
import { FaPepperHot, FaGlideG } from "react-icons/fa";
import { GiChicken, GiPeanut, GiMilkCarton, GiShrimp } from "react-icons/gi";
import { PiCowFill } from "react-icons/pi";
import { FcGoogle } from "react-icons/fc";
import { PorkIconComponent } from "../styles/svgs";
import useEscapeKey from "../hooks/useEscapeKey";
import { avatarFill } from "../constants/categoryTheme";
import { Button, IconButton, Chip, DialogShell } from "../components/ui";
import charPurple from "../assets/brand/characters/char-purple.svg";
import charRed from "../assets/brand/characters/char-red.svg";
import charYellow from "../assets/brand/characters/char-yellow.svg";
import charGreen from "../assets/brand/characters/char-green.svg";
import charPink from "../assets/brand/characters/char-pink.svg";
import charBlue from "../assets/brand/characters/char-blue.svg";

const COVERS = [
  { tint: "#F1E9FE", character: charPurple },
  { tint: "#FFE9E6", character: charRed },
  { tint: "#FEF6E2", character: charYellow },
  { tint: "#E6F8EE", character: charGreen },
  { tint: "#FFEAF5", character: charPink },
  { tint: "#D6EBFA", character: charBlue },
];

// Display-only: a stable cover for each user, picked from their uid.
function coverFor(seed) {
  let h = 0;
  const str = `profile-cover:${seed ?? ""}`;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return COVERS[Math.abs(h) % COVERS.length];
}

const ROW_CLASS =
  "flex w-full items-center gap-3 border-b border-line py-3 text-left transition hover:bg-surface2/60";

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

  // Styled replacements for window.prompt / window.confirm / alert.
  // dialog: null | { kind: "message" | "confirm" | "input", title, ... }
  const [dialog, setDialog] = useState(null);
  const [dialogValue, setDialogValue] = useState("");
  const [busy, setBusy] = useState(false);

  const closeDialog = () => setDialog(null);
  // Dialog titles are whole sentences: show them at body size, not as a display heading.
  const dialogTitleNode = (text) => (
    <span className="font-sans text-base font-semibold normal-case leading-snug tracking-normal [font-stretch:100%]">
      {text}
    </span>
  );
  const showMessage = (text) => setDialog({ kind: "message", title: text });
  const showConfirm = (title, onConfirm) =>
    setDialog({ kind: "confirm", title, onConfirm });
  const showInput = (
    title,
    inputType,
    autoComplete,
    initial,
    onSubmit,
    onCancel,
  ) => {
    setDialogValue(initial || "");
    setDialog({
      kind: "input",
      title,
      inputType,
      autoComplete,
      onSubmit,
      onCancel,
    });
  };
  const cancelDialog = () => {
    if (busy || !dialog) return;
    if (dialog.kind === "input" && dialog.onCancel) dialog.onCancel();
    else closeDialog();
  };
  useEscapeKey(cancelDialog, dialog !== null);

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

  // Step 1: was window.confirm(...). Cancel does nothing, as before.
  const handleDeleteAccount = () => {
    showConfirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
      () => handleDeleteAccountConfirmed(),
    );
  };

  // Step 2: was the prompt(s) after the confirm. Same early exits as before.
  const handleDeleteAccountConfirmed = () => {
    if (isGoogleUser) {
      // Google-linked accounts: confirm by typing "delete" instead of password
      const rejectTyped = () => showMessage("Account deletion cancelled.");
      showInput(
        'To confirm account deletion, please type "delete" (without quotes):',
        "text",
        "off",
        "",
        (typed) => {
          if (!typed || typed.trim().toLowerCase() !== "delete") {
            rejectTyped();
            return;
          }
          return runDeleteAccount(null);
        },
        rejectTyped,
      );
    } else {
      // Email/password accounts: require current password
      showInput(
        "Please enter your current password to confirm account deletion:",
        "password",
        "current-password",
        "",
        (password) => {
          if (!password) {
            closeDialog();
            return;
          }
          return runDeleteAccount(password);
        },
      );
    }
  };

  // The original body after the prompts; only alert -> showMessage changed.
  const runDeleteAccount = async (password) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showMessage("No user is currently signed in.");
        return;
      }

      // Only email/password accounts need credential-based reauth here
      if (!isGoogleUser) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user document from Firestore first
      await deleteDoc(doc(db, "users", user.uid));

      // Then delete the auth user
      await deleteUser(user);

      console.log("Account deleted successfully");
      // Native alert on purpose: deleting the user signs them out and unmounts this page, so an in-page dialog would never be seen.
      alert("Your account has been deleted.");
    } catch (error) {
      console.error("Error deleting account: ", error);

      // Password-specific errors only apply to non-Google users
      if (!isGoogleUser && error.code === "auth/wrong-password") {
        showMessage("Incorrect password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        showMessage("Too many failed attempts. Please try again later.");
      } else if (error.code === "auth/requires-recent-login") {
        showMessage(
          "For security reasons, please log out and log back in before deleting your account.",
        );
      } else {
        showMessage(
          "Error deleting account. Please try again or contact support.",
        );
      }
    }
  };

  // Step 1: was the two prompts (new email, then password).
  const handleEmailUpdate = () => {
    if (isGoogleUser) {
      showMessage(
        "To change your email, please visit your Google account settings at myaccount.google.com",
      );
      return;
    }

    showInput(
      "Enter new email:",
      "email",
      "email",
      currentUser.email,
      (newEmail) => {
        if (!newEmail || newEmail === currentUser.email) {
          closeDialog();
          return;
        }
        showInput(
          "Please enter your current password to confirm email change:",
          "password",
          "current-password",
          "",
          (password) => {
            if (!password) {
              closeDialog();
              return;
            }
            return runEmailUpdate(newEmail, password);
          },
        );
      },
    );
  };

  // The original body after the prompts; only alert -> showMessage changed.
  const runEmailUpdate = async (newEmail, password) => {
    try {
      // Get the current user from auth
      const user = auth.currentUser;
      if (!user) {
        showMessage("No user is currently signed in.");
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
      showMessage("Email updated successfully!");
    } catch (error) {
      console.error("Error updating email: ", error);

      // Provide more specific error messages
      if (error.code === "auth/wrong-password") {
        showMessage("Incorrect password. Please try again.");
      } else if (error.code === "auth/email-already-in-use") {
        showMessage("This email is already in use by another account.");
      } else if (error.code === "auth/invalid-email") {
        showMessage("Invalid email format. Please enter a valid email.");
      } else if (error.code === "auth/requires-recent-login") {
        showMessage(
          "For security reasons, please log out and log back in before changing your email.",
        );
      } else {
        showMessage(
          "Error updating email. Please try again or contact support.",
        );
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

  // Was prompt("Enter new name:", name); Cancel/empty does nothing, as before.
  const startNameEdit = () => {
    showInput(
      "Enter new name:",
      "text",
      "name",
      realTimeUser?.name,
      async (newName) => {
        closeDialog();
        await handleNameUpdate(newName);
      },
    );
  };

  const submitDialog = async (e) => {
    e.preventDefault();
    if (busy || !dialog || dialog.kind !== "input") return;
    setBusy(true);
    try {
      await dialog.onSubmit(dialogValue);
    } finally {
      setBusy(false);
    }
  };

  const confirmDialog = async () => {
    if (busy || !dialog || dialog.kind !== "confirm") return;
    const proceed = dialog.onConfirm;
    closeDialog();
    await proceed();
  };

  const displayName = realTimeUser?.name || "User Name";
  const avatarSrc = realTimeUser?.avatar || realTimeUser?.photoURL;
  const cover = coverFor(currentUser?.uid);
  const initials =
    String(realTimeUser?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  return (
    <div className="mx-auto w-full max-w-4xl pb-4">
      {/* Cover band */}
      <div
        className="relative h-40 overflow-hidden rounded-card md:h-44"
        style={{ backgroundColor: cover.tint }}
      >
        <img
          src={cover.character}
          alt=""
          aria-hidden="true"
          className="absolute -bottom-6 right-6 h-44 w-44 md:right-12 md:h-52 md:w-52"
        />
      </div>

      {/* Avatar + name */}
      <div className="-mt-12 px-4 md:px-8">
        <div className="relative inline-block">
          <div
            className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-4 ring-raised ${
              uploading ? "opacity-60" : ""
            }`}
            style={{ backgroundColor: avatarFill(currentUser?.uid) }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-3xl font-extrabold text-ink">
                {initials}
              </span>
            )}
          </div>
          {/* Hidden File Input */}
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            className="peer sr-only"
          />
          {/* Edit Avatar Button */}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-ink text-white ring-2 ring-raised peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-selected-text"
          >
            <span className="sr-only">Change profile photo</span>
            <LuCamera aria-hidden="true" className="text-sm" />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="min-w-0 break-words text-[1.875rem] leading-none md:text-[2.5rem]">
            {displayName}
          </h1>
          <IconButton
            aria-label="Edit name"
            variant="soft"
            onClick={startNameEdit}
          >
            <LuPencil aria-hidden="true" />
          </IconButton>
        </div>
        {realTimeUser?.createdAt && (
          <p className="mt-2 text-[0.8125rem] text-muted">
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

      <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
        {/* Dietary Restrictions Section */}
        <section className="rounded-card bg-raised p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LuLeaf
                aria-hidden="true"
                className="text-xl text-selected-text"
              />
              <h2 className="text-lg">Dietary Restrictions</h2>
            </div>
            <IconButton
              aria-label="Edit dietary restrictions"
              variant="soft"
              onClick={() => setIsEditingDietary(!isEditingDietary)}
            >
              <LuPencil aria-hidden="true" />
            </IconButton>
          </div>

          <div className="mt-4">
            {isEditingDietary ? (
              <div>
                <div className="mb-6 flex flex-wrap gap-2">
                  {Object.entries(dietaryRestrictions).map(
                    ([key, { icon, color, label }]) => {
                      const selected = selectedRestrictions.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleRestriction(key)}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                            selected
                              ? "bg-selected-soft text-selected-text"
                              : "bg-surface2 text-ink hover:bg-surface3"
                          }`}
                        >
                          <span className={`text-base ${color}`}>{icon}</span>
                          {label}
                        </button>
                      );
                    },
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="soft"
                    onClick={() => {
                      setIsEditingDietary(false);
                      setSelectedRestrictions(
                        realTimeUser?.dietaryRestrictions || [],
                      );
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleDietaryRestrictionsUpdate}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(realTimeUser?.dietaryRestrictions || []).length > 0 ? (
                  (realTimeUser.dietaryRestrictions || []).map(
                    (restriction) => {
                      const restrictionData = dietaryRestrictions[restriction];
                      return restrictionData ? (
                        <Chip
                          key={restriction}
                          className="gap-2 bg-selected-soft px-3 py-1 text-selected-text"
                        >
                          <span className={`text-sm ${restrictionData.color}`}>
                            {restrictionData.icon}
                          </span>
                          {restrictionData.label}
                        </Chip>
                      ) : null;
                    },
                  )
                ) : (
                  <p className="text-sm text-muted">
                    No dietary restrictions set
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Security Section */}
        <section className="rounded-card bg-raised p-5 shadow-soft">
          <button
            type="button"
            onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
            aria-expanded={isSecurityExpanded}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-3">
              <LuShield
                aria-hidden="true"
                className="text-xl text-selected-text"
              />
              <h2 className="text-lg">Security</h2>
            </span>
            {isSecurityExpanded ? (
              <LuChevronUp aria-hidden="true" />
            ) : (
              <LuChevronDown aria-hidden="true" />
            )}
          </button>

          {isSecurityExpanded && (
            <div className="mt-4">
              {isGoogleUser && (
                <div className="mb-2 flex items-center justify-center rounded-[14px] bg-surface2 p-3">
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <FcGoogle size={20} />
                    Logged in with Google
                  </div>
                </div>
              )}

              {/* Change Email Section */}
              <button
                type="button"
                onClick={handleEmailUpdate}
                className={ROW_CLASS}
              >
                <LuMail
                  aria-hidden="true"
                  className="text-lg text-selected-text"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    Change Email
                  </span>
                  <span className="block text-xs text-muted">
                    {currentUser.email}
                  </span>
                </span>
              </button>

              {/* Change Password Section */}
              <button
                type="button"
                onClick={() => {
                  if (isGoogleUser) {
                    showMessage(
                      "To change your password, please visit your Google account settings at myaccount.google.com",
                    );
                  } else {
                    setIsChangePasswordModalOpen(true);
                  }
                }}
                className={ROW_CLASS}
              >
                <LuKeyRound
                  aria-hidden="true"
                  className="text-lg text-selected-text"
                />
                <span className="text-sm font-semibold text-ink">
                  Change Password
                </span>
              </button>

              {/* Log Out Section */}
              <button type="button" onClick={handleLogout} className={ROW_CLASS}>
                <LuLogOut
                  aria-hidden="true"
                  className="text-lg text-selected-text"
                />
                <span className="text-sm font-semibold text-ink">Log Out</span>
              </button>

              {/* Delete Account Section */}
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-accent-soft"
              >
                <LuTrash2 aria-hidden="true" className="text-lg text-danger" />
                <span className="text-sm font-semibold text-danger">
                  Delete Account
                </span>
              </button>
            </div>
          )}
        </section>
      </div>

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}

      {dialog && dialog.kind === "message" && (
        <DialogShell
          title={dialogTitleNode(dialog.title)}
          labelledById="profile-dialog-title"
          zIndexClass="z-[60]"
          actions={<Button onClick={closeDialog}>OK</Button>}
        />
      )}

      {dialog && dialog.kind === "confirm" && (
        <DialogShell
          title={dialogTitleNode(dialog.title)}
          labelledById="profile-dialog-title"
          zIndexClass="z-[60]"
          actions={
            <>
              <Button variant="soft" onClick={closeDialog}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDialog}>
                Delete Account
              </Button>
            </>
          }
        />
      )}

      {dialog && dialog.kind === "input" && (
        <DialogShell
          title={dialogTitleNode(dialog.title)}
          labelledById="profile-dialog-title"
          zIndexClass="z-[60]"
          aria-busy={busy ? "true" : "false"}
        >
          <form onSubmit={submitDialog} noValidate>
            <input
              type={dialog.inputType}
              autoComplete={dialog.autoComplete}
              autoFocus
              aria-labelledby="profile-dialog-title"
              value={dialogValue}
              onChange={(e) => setDialogValue(e.target.value)}
              className="mt-4 block w-full rounded-full border border-transparent bg-surface2 px-4 py-2.5 text-sm text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-selected-text"
            />
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="soft" onClick={cancelDialog} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                OK
              </Button>
            </div>
          </form>
        </DialogShell>
      )}
    </div>
  );
}
