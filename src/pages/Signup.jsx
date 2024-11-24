import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import logo from "../assets/logoBorderless.png";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
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
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Get the user
      const user = userCredential.user;

      // Create a document in Firestore with additional user info
      await setDoc(doc(db, "users", user.uid), {
        avatar: "",
        name: formData.name,
        email: formData.email,
        dietaryRestrictions: [],
        contributions: {},
        createdAt: new Date(),
      });

      // Redirect to dashboard or home page
      navigate("/");
    } catch (error) {
      // Handle Firebase errors
      const errorCode = error.code;
      const errorMessage = error.message;

      // Map Firebase error codes to user-friendly messages
      switch (errorCode) {
        case "auth/email-already-in-use":
          setErrors((prev) => ({
            ...prev,
            email: "Email is already in use",
          }));
          break;
        case "auth/invalid-email":
          setErrors((prev) => ({
            ...prev,
            email: "Invalid email address",
          }));
          break;
        default:
          console.error("Signup error:", errorMessage);
          setErrors((prev) => ({
            ...prev,
            submit: "Failed to create account. Please try again.",
          }));
      }
    }
  };

  const provider = new GoogleAuthProvider();
  const handleGoogleAuth = async (e) => {
    try {
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

      console.log("User Info: ", user);

      navigate("/");
    } catch (error) {
      console.error("Error during Google sign-in:", error.message);
    }
  };

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
            Register an account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="name"
                  className="text-primaryDark block text-sm/6 font-medium"
                >
                  Full Name
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className={`${errors.name ? "ring-red-500" : "ring-gray-300"} focus:ring-inset sm:text-sm/6`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

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
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`text-primaryDark focus:ring-primaryRed block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${errors.email ? "ring-red-500" : "ring-gray-300"} placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm/6`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
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
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className={`text-primaryDark focus:ring-primaryRed block w-full rounded-md border-0 py-1.5 pr-10 shadow-sm ring-1 ring-inset ${errors.password ? "ring-red-500" : "ring-gray-300"} placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm/6`}
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
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="text-center text-sm text-red-500">
                {errors.submit}
              </div>
            )}

            <div className="flex flex-col">
              <button
                type="submit"
                className="bg-primaryRed hover:bg-secondaryRed focus-visible:outline-primaryRed flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Sign Up
              </button>
              <p className="p-2 text-center">or</p>
            </div>
          </form>
          <button
            onClick={handleGoogleAuth}
            className="focus-visible:outline-primaryRed text-primaryDark flex w-full items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm/6 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <FcGoogle className="mr-3" />
            Sign Up with Google
          </button>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Already a member?{" "}
            <Link
              to={"/login"}
              className="text-primaryRed hover:text-secondaryRed font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
