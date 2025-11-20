import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { updateProfile as firebaseUpdateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set Authenticated User as currentUser
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          let userData;

          if (userDoc.exists()) {
            userData = userDoc.data();
          } else {
            const baseProfile = {
              name:
                firebaseUser.displayName ||
                firebaseUser.email ||
                "New User",
              avatar: firebaseUser.photoURL || "",
              email: firebaseUser.email || "",
              dietaryRestrictions: [],
              contributions: {},
              createdAt: new Date(),
            };

            await setDoc(userRef, baseProfile, { merge: true });
            userData = baseProfile;
          }

          setCurrentUser({ ...firebaseUser, ...userData });
        } catch (err) {
          console.error("Error fetching user data: ", err);
          setCurrentUser(firebaseUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to update the user's profile
  const updateProfile = async (updates) => {
    try {
      // Update in Firebase Authentication
      if (updates.avatar || updates.name) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName,
          photoURL: updates.avatar || auth.currentUser.photoURL,
        });
      }

      // Update Firestore with the new profile data
      if (updates.name || updates.avatar) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
          name: updates.name || auth.currentUser.displayName,
          avatar: updates.avatar || auth.currentUser.photoURL,
        });
      }

      // Update the context with the new profile data
      const updatedUser = {
        ...auth.currentUser,
        displayName: updates.name || auth.currentUser.displayName,
        photoURL: updates.avatar || auth.currentUser.photoURL,
      };
      setCurrentUser(updatedUser);

      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, updateProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
