import { useState } from "react";
import wordmark from "../assets/brand/logos/wbw-wordmark-ink.svg";
import sealCream from "../assets/brand/logos/wbw-seal-cream.svg";
import hatTilt from "../assets/brand/logos/wbw-hat-tilt.svg";
import charPotGreen from "../assets/brand/characters/char-pot-green.svg";
import charHatYellow from "../assets/brand/characters/char-hat-yellow.svg";
import charRed from "../assets/brand/characters/char-red.svg";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import CookingLoader from "../components/CookingLoader";

const labelCls =
  "ml-4 block font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-white [font-stretch:125%]";
const inputBase =
  "block h-[46px] w-full rounded-full border-0 bg-white px-4 font-sans text-base text-ink placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const errorText =
  "mt-2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-danger";
const ringError =
  "shadow-[0_0_0_2.5px_#FF4C43] focus:shadow-[0_0_0_2.5px_#FF4C43]";
const ringNone = "shadow-none focus:shadow-none";

const loginRouteApi = getRouteApi("/login");

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
  const { redirect } = loginRouteApi.useSearch();

  // `redirect` is the full href the guard captured (basepath included), so it is navigated to
  // as-is; the default is a route path the router prefixes with the basepath.
  const goToTarget = () =>
    redirect
      ? navigate({ href: redirect, replace: true })
      : navigate({ to: "/events", replace: true });

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
      goToTarget();
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

      goToTarget();
    } catch (error) {
      setLoading(false);
      console.error("Error during Google sign-in:", error.code, error.message);
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
      <div className="min-h-screen overflow-x-hidden bg-selected lg:grid lg:grid-cols-[1.1fr_1fr]">
        {/* Cream brand panel: curved edge on phone (ellipse), split panel from lg */}
        <div className="relative bg-ground px-6 pb-24 pt-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:rounded-br-[9rem] lg:px-16 lg:pb-64 lg:pt-12">
          <div
            aria-hidden="true"
            className="absolute -bottom-20 left-1/2 h-40 w-[160%] -translate-x-1/2 rounded-[50%] bg-ground lg:hidden"
          />
          <div className="relative z-10 mt-24 w-[65%] max-w-[18rem] lg:mt-28 lg:w-[70%] lg:max-w-none">
            <img
              src={hatTilt}
              alt=""
              aria-hidden="true"
              className="absolute bottom-[92%] left-[62%] w-[34%]"
            />
            <img
              alt="Who's Bringing What Logo"
              src={wordmark}
              className="block w-full"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-12 z-20 mx-auto flex max-w-[26rem] items-end justify-between px-3 lg:inset-x-16 lg:bottom-10 lg:mx-0 lg:max-w-none lg:justify-start lg:gap-10 lg:px-0">
            <img src={charPotGreen} alt="" aria-hidden="true" className="w-28 lg:w-44" />
            <img src={charHatYellow} alt="" aria-hidden="true" className="w-24 lg:w-36" />
            <img src={charRed} alt="" aria-hidden="true" className="w-24 lg:w-40" />
          </div>
        </div>

        {/* Purple form panel */}
        <div className="relative flex flex-col justify-center px-8 pb-10 pt-28 lg:px-16 lg:pt-10">
          <img
            src={sealCream}
            alt=""
            aria-hidden="true"
            className="absolute right-8 top-8 hidden w-24 lg:block"
          />
          <div className="mx-auto w-full max-w-sm">
            <h2 className="sr-only max-w-[18rem] text-3xl lg:text-[1.625rem] leading-[0.95] text-white lg:not-sr-only lg:mb-8">
              Login into your account
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              {errors.submit && (
                <div className="rounded-2xl bg-white/95 p-3 text-xs font-semibold text-danger">
                  {errors.submit}
                </div>
              )}

              <div>
                <label htmlFor="email" className={labelCls}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-2 ${inputBase} ${errors.email ? ringError : ringNone}`}
                />
                {errors.email && <p className={errorText}>{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className={labelCls}>
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputBase} pr-12 ${errors.password ? ringError : ringNone}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center rounded-full pr-4 text-muted"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className={errorText}>{errors.password}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                className="self-end font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-white underline decoration-[#F8CA49] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="h-11 w-full rounded-full bg-ground font-display text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_8px_20px_rgba(0,0,0,0.15)] [font-stretch:125%] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Login
              </button>

              <div className="flex items-center gap-3 text-xs font-semibold text-white">
                <span className="h-px flex-1 bg-white/40" />
                <p>or</p>
                <span className="h-px flex-1 bg-white/40" />
              </div>
            </form>

            <button
              onClick={handleGoogleAuth}
              className="mt-2.5 flex h-11 w-full items-center justify-center rounded-full bg-white/25 font-display text-xs font-extrabold uppercase tracking-[0.1em] text-ink [font-stretch:125%] hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="mr-2 grid h-5 w-5 place-items-center rounded-full bg-white">
                <FcGoogle size={13} />
              </span>
              Login with Google
            </button>

            <p className="mt-8 text-center font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-white">
              Not a member?{" "}
              <Link
                to="/signup"
                search={redirect ? { redirect } : {}}
                className="underline decoration-[#F8CA49] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:decoration-white"
              >
                Register now
              </Link>
            </p>
          </div>
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
