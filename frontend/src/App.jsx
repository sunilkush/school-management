import React, { useEffect, lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";

import { refreshToken } from "./features/authSlice";
import { fetchMyPermissions } from "./features/roleUiSlice";


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

  const { user, isAuthInitialized } = useSelector(
    (state) => state.auth
  );


  /* ================= AUTH INIT ================= */

  useEffect(() => {
    dispatch(refreshToken());
  }, [dispatch]);

  /* ================= PERMISSIONS ================= */

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchMyPermissions());
    }
  }, [dispatch, user]);

 


  /* ================= WAIT AUTH ================= */

  if (!isAuthInitialized) {
    return <Loader />;
  }

  /* ================= UI ================= */

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