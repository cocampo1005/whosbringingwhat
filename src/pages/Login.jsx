import React, { useEffect, useState } from "react";
import logo from "../assets/logoBorderless.png";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [redirectHome, setRedirectHome] = useState(false);
  const [isForgotPasswordModalOpen, setForgotPasswordModalOpen] =
    useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      // Get the user from Firebase
      const user = userCredential.user;

      setRedirectHome(true);
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      setLoading(false);

      // Handle Firebase errors
      switch (errorCode) {
        case "auth/user-not-found":
          setErrors((prev) => ({
            ...prev,
            email: "No user found with this email address",
          }));
          break;
        case "auth/invalid-credential":
          setErrors((prev) => ({
            ...prev,
            password: "Password or email are incorrect",
          }));
          break;
        default:
          console.error("Login error:", errorMessage);
          setErrors((prev) => ({
            ...prev,
            submit: "Failed to log in. Please try again.",
          }));
      }
    }
  };

  const provider = new GoogleAuthProvider();
  const handleGoogleAuth = async (e) => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If the document doesn't exist, create it with the user data
        await setDoc(userDocRef, {
          name: user.displayName || "New User",
          email: user.email,
          avatar: user.photoURL || "",
          dietaryRestrictions: [],
          contributions: {},
          createdAt: new Date(),
        });
      }

      setRedirectHome(true);
    } catch (error) {
      setLoading(false);
      console.error("Error during Google sign-in:", error.message);
    }
  };

  const handleResetPassword = () => {
    setForgotPasswordModalOpen(true);
  };

  useEffect(() => {
    if (redirectHome && currentUser) {
      navigate("/");
      setLoading(false);
    }
  });

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-t-4 border-primaryRed"></div>
        <p className="text-lg font-medium text-primaryDark">
          Logging you in, please wait...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Who's Bringing What Logo"
            src={logo}
            className="mx-auto h-60 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-primaryDark">
            Login into your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm/6 text-primaryDark"
              >
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-1.5 text-primaryDark shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primaryRed sm:text-sm/6"
                />
                {errors.email && <p className="text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm/6 text-primaryDark"
                >
                  Password
                </label>
                <p
                  onClick={handleResetPassword}
                  className="text-xs font-bold text-primaryRed"
                >
                  Forgot Password?
                </p>
              </div>
              <div>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-0 py-1.5 pr-10 text-primaryDark shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primaryRed sm:text-sm/6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <FaRegEyeSlash className="h-5 w-5 text-gray-500" />
                    ) : (
                      <FaRegEye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-primaryRed px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-secondaryRed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryRed"
              >
                Login
              </button>
              <p className="p-2 text-center">or</p>
            </div>
          </form>
          <button
            onClick={handleGoogleAuth}
            className="flex w-full items-center justify-center rounded-lg bg-white px-3 py-1.5 text-sm/6 font-semibold text-primaryDark shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryRed"
          >
            <FcGoogle className="mr-3" />
            Login with Google
          </button>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{" "}
            <Link
              to={"/signup"}
              className="font-semibold text-primaryRed hover:text-secondaryRed"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
      {isForgotPasswordModalOpen && (
        <ForgotPasswordModal
          onClose={() => setForgotPasswordModalOpen(false)}
        />
      )}
    </>
  );
}
