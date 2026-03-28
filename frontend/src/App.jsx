import React, { useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";

import {
  completeAuthInitialization,
  currentUser,
  forceLogout,
  initializeAuth,
  startAuthInitialization,
} from "./features/authSlice";
import { fetchMyPermissions } from "./features/roleUiSlice";
import { setAccessToken } from "./api/authToken";

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

const Loader = lazy(() => import("./components/Loader/Loader"));

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, accessToken, isAuthInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      dispatch(startAuthInitialization());

      try {
        const authData = await dispatch(initializeAuth()).unwrap();

        if (authData?.accessToken) {
          await dispatch(currentUser()).unwrap();
        }
      } catch {
        dispatch(forceLogout());
      } finally {
        dispatch(completeAuthInitialization());
      }
    };

    bootstrapAuth();
  }, [dispatch]);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchMyPermissions());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (profile?.statusCode === 401) {
      dispatch(forceLogout());

      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
  }, [dispatch, isAuthInitialized, profile, navigate, location.pathname]);

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
        <ToastContainer position="top-right" autoClose={3000} />
      </Suspense>

      <Suspense fallback={null}>
        <SpeedInsights />
      </Suspense>
    </>
  );
}

export default App;
