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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [redirectHome, setRedirectHome] = useState(false);
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

  useEffect(() => {
    if (redirectHome && currentUser) {
      navigate("/");
      setLoading(false);
    }
  });

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="border-primaryRed mb-4 h-16 w-16 animate-spin rounded-full border-t-4"></div>
        <p className="text-primaryDark text-lg font-medium">
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
          <h2 className="text-primaryDark mt-10 text-center text-2xl/9 font-bold tracking-tight">
            Login into your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="text-primaryDark block text-sm/6 font-medium"
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
                  className="text-primaryDark focus:ring-primaryRed block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm/6"
                />
                {errors.email && <p className="text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-primaryDark block text-sm/6 font-medium"
                >
                  Password
                </label>
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
                    className="text-primaryDark focus:ring-primaryRed block w-full rounded-md border-0 py-1.5 pr-10 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm/6"
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
                className="bg-primaryRed hover:bg-secondaryRed focus-visible:outline-primaryRed flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Login
              </button>
              <p className="p-2 text-center">or</p>
            </div>
          </form>
          <button
            onClick={handleGoogleAuth}
            className="focus-visible:outline-primaryRed text-primaryDark flex w-full items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm/6 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <FcGoogle className="mr-3" />
            Login with Google
          </button>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{" "}
            <Link
              to={"/signup"}
              className="text-primaryRed hover:text-secondaryRed font-semibold"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
