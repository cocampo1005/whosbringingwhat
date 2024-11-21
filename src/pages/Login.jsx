import React, { useState } from "react";
import logo from "../assets/logoBorderless.png";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

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
          <form action="#" method="POST" className="space-y-6">
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
                  required
                  autoComplete="email"
                  className="text-primaryDark focus:ring-primaryRed block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm/6"
                />
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
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
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
            </div>

            <div>
              <button
                type="submit"
                className="bg-primaryRed hover:bg-secondaryRed focus-visible:outline-primaryRed flex w-full justify-center rounded-md px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Login
              </button>
            </div>
          </form>

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
