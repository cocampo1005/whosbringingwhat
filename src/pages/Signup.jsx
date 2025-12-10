import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import logo from "../assets/logoBorderless.png";
import CookingLoader from "../components/CookingLoader";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/events";
  const search = location.search || "";

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
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

  const formatName = (name) => {
    return name
      .trim()
      .split(/\s+/) // split on any amount of spaces
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const formattedName = formatName(formData.name);

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        avatar: "",
        name: formattedName,
        email: formData.email,
        dietaryRestrictions: [],
        contributions: {},
        createdAt: new Date(),
      });

      // Go to redirect target or default events page
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setLoading(false);
      // Handle Firebase errors
      const errorCode = error.code;
      const errorMessage = error.message;

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
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("[GoogleAuth][Signup] signInWithPopup success", user?.uid);

      // Full reload to avoid auth race conditions on first Google sign-up
      const targetPath = redirectTo || "/events";
      const targetUrl =
        targetPath.startsWith("http") || targetPath.startsWith("/")
          ? targetPath
          : `/${targetPath}`;

      window.location.assign(targetUrl);
    } catch (error) {
      setLoading(false);
      console.error("Error during Google sign-in:", error.code, error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <CookingLoader />
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
            Register an account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="name"
                  className="block text-sm/6 font-medium text-primaryDark"
                >
                  Full name
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-0 px-3 py-1.5 text-base text-primaryDark shadow-sm ring-1 ring-inset focus:outline-none focus:ring-primaryRed sm:text-sm/6 ${
                    errors.name
                      ? "ring-secondaryRed"
                      : "ring-primaryDark/10 focus:ring-primaryRed"
                  }`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-secondaryRed">
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-primaryDark"
                >
                  Email address
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-0 px-3 py-1.5 text-base text-primaryDark shadow-sm ring-1 ring-inset focus:outline-none focus:ring-primaryRed sm:text-sm/6 ${
                    errors.email
                      ? "ring-secondaryRed"
                      : "ring-primaryDark/10 focus:ring-primaryRed"
                  }`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-secondaryRed">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm/6 font-medium text-primaryDark"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full rounded-md border-0 px-3 py-1.5 text-base text-primaryDark shadow-sm ring-1 ring-inset focus:outline-none focus:ring-primaryRed sm:text-sm/6 ${
                      errors.password
                        ? "ring-secondaryRed"
                        : "ring-primaryDark/10 focus:ring-primaryRed"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-primaryDark"
                  >
                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-secondaryRed">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="rounded-md bg-secondaryRed/10 p-3 text-sm text-secondaryRed">
                {errors.submit}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-primaryRed px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-secondaryRed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryRed"
              >
                Sign Up
              </button>
              <p className="p-2 text-center">or</p>
            </div>
          </form>
          <button
            onClick={handleGoogleAuth}
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-primaryDark shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryRed"
          >
            <FcGoogle className="mr-3" />
            Sign Up with Google
          </button>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Already a member?{" "}
            <Link
              to={`/login${search}`}
              className="font-semibold text-primaryRed hover:text-secondaryRed"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
