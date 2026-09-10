import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import Home from "../pages/Home";

/**
 * The router's `beforeLoad` guards navigation; this guards the session. Signing out on any
 * signed-in page flips the context's `currentUser` to null with no navigation, so the layout
 * sends the visitor to /login itself and renders nothing meanwhile, before a page reads the
 * missing user. Right after a sign-in the context can still be loading the profile document
 * while Firebase already knows the user, so `auth.currentUser` counts as signed in too.
 *
 * The redirect target is read through a ref: depending on the location itself would re-run
 * the effect while the navigation to /login is still pending and chase its own tail.
 */
export default function SignedInLayout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const signedIn = Boolean(currentUser || auth.currentUser);

  useEffect(() => {
    if (signedIn) return;
    navigate({
      to: "/login",
      search: { redirect: locationRef.current.publicHref },
      replace: true,
    });
  }, [signedIn, navigate]);

  if (!signedIn) return null;
  return <Home />;
}
