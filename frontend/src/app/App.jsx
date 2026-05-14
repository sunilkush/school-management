import React, { useEffect, lazy, Suspense, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";

import {
  completeAuthInitialization,
  currentUser,
  forceLogout,
  initializeAuth,
  startAuthInitialization,
} from "../features/authSlice";
import { fetchMyPermissions } from "../features/roleUiSlice";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/authToken";

const ToastContainer = lazy(() =>
  import("react-toastify").then((mod) => ({
    default: mod.ToastContainer,
  }))
);

const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((mod) => ({
    default: mod.SpeedInsights,
  }))
);

const Loader = lazy(() => import("../components/Loader/Loader"));

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const profileStatusCode = useSelector((state) => state.auth.profile?.statusCode);
  const userId = useSelector((state) => state.auth.user?._id);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAuthInitialized = useSelector((state) => state.auth.isAuthInitialized);
  const hasPersistedUser = useSelector((state) => Boolean(state.auth.user));
  const hasPersistedUserRef = useRef(hasPersistedUser);
  useEffect(() => {
    const tokenToUse = accessToken || getAccessToken();

    if (tokenToUse) {
      setAccessToken(tokenToUse);
      return;
    }

    clearAccessToken();
  }, [accessToken]);
 useEffect(() => {
    const bootstrapAuth = async () => {
      dispatch(startAuthInitialization());
      let completed = false;

      try {
        const initPayload = await dispatch(initializeAuth()).unwrap();
        const token = getAccessToken();
        const hasUserForFirstPaint = Boolean(initPayload?.user) || hasPersistedUserRef.current;

        if (token && hasUserForFirstPaint) {
          dispatch(completeAuthInitialization());
          completed = true;
          dispatch(currentUser());
          return;
        }

        if (token) {
          await dispatch(currentUser()).unwrap();
        }
      } catch {
        // Keep existing persisted/login state. Avoid force-logout on transient init failures.
      } finally {
        if (!completed) {
          dispatch(completeAuthInitialization());
        }
      }
    };

    bootstrapAuth();
  }, [dispatch]);

  useEffect(() => {
    if (userId) {
      dispatch(fetchMyPermissions());
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (profileStatusCode === 401 && accessToken) {
      dispatch(forceLogout());

      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
 }, [dispatch, isAuthInitialized, profileStatusCode, accessToken, navigate, location.pathname]);

  if (!isAuthInitialized) {
    return (
      <Suspense fallback={null}>
        <Loader />
      </Suspense>
    );
  }

  return (
    <>
      <Suspense fallback={<Loader />}>
        <Outlet />
      </Suspense>

      <Suspense fallback={null}>
        <ToastContainer position="top-right" autoClose={3000}  />
      </Suspense>

      <Suspense fallback={null}>
        <SpeedInsights />
      </Suspense>
    </>
  );
}

export default App;
