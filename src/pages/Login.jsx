import { useState } from "react";
import logo from "../assets/logoBorderless.png";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import CookingLoader from "../components/CookingLoader";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordModalOpen, setForgotPasswordModalOpen] =
    useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/events";
  const search = location.search || "";

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

      // Go to redirect target or default events page
      navigate(redirectTo, { replace: true });
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
            submit: "Incorrect email or password. Please try again.",
          }));
          break;
        case "auth/wrong-password":
          setErrors((prev) => ({
            ...prev,
            password: "Incorrect password",
          }));
          break;
        case "auth/too-many-requests":
          setErrors((prev) => ({
            ...prev,
            submit:
              "Too many unsuccessful login attempts. Please try again later.",
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
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("[GoogleAuth][Login] signInWithPopup success", user?.uid);

      // Check if the user document exists in Firestore

      if (user) {
        // If the document does not exist, create it with the user data
      }

      // Full reload to avoid auth race conditions on first Google sign-in
      const targetPath = redirectTo || "/events";
      const targetUrl =
        targetPath.startsWith("http") || targetPath.startsWith("/")
          ? targetPath
          : `/${targetPath}`;

      window.location.assign(targetUrl);
    } catch (error) {
      setLoading(false);
      console.error(
        "Error during Google sign-in:",
        error.code,
        error.message,
      );
    }
  };

  const handleResetPassword = () => {
    setForgotPasswordModalOpen(true);
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
            Login into your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm/6 font-medium text-primaryDark"
              >
                Email address
              </label>
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
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm font-semibold text-primaryRed hover:text-secondaryRed"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-2">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
                Login
              </button>
              <p className="p-2 text-center">or</p>
            </div>
          </form>

          <button
            onClick={handleGoogleAuth}
            className="mt-2 flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-primaryDark shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryRed"
          >
            <FcGoogle className="mr-3" />
            Login with Google
          </button>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{" "}
            <Link
              to={`/signup${search}`}
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
