import React, { useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";

import { currentUser, forceLogout, initializeAuth } from "./features/authSlice";
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
  const { profile, user, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      setAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await dispatch(initializeAuth()).unwrap();
        await dispatch(currentUser()).unwrap();
      } catch {
        dispatch(forceLogout());
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
    if (profile?.statusCode === 401) {
      dispatch(forceLogout());

      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
  }, [dispatch, profile, navigate, location.pathname]);

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
