import React, { useEffect, lazy, Suspense } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";

import { currentUser } from "./features/authSlice";
import { fetchMyPermissions } from "./features/roleUiSlice";
import { setSelectedAcademicYear } from "./features/academicYearSlice";

// 🔥 Lazy Load Components
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

  const { profile, accessToken } = useSelector((state) => state.auth);
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear
  );

  // 1. Load current user
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  // 2. Load permissions
  useEffect(() => {
    if (accessToken) {
      dispatch(fetchMyPermissions());
    }
  }, [dispatch, accessToken]);

  // 3. Redirect if unauthorized
  useEffect(() => {
    if (profile?.statusCode === 401) {
      navigate("/");
    }
  }, [profile, navigate]);

  // 4. Load Academic Year from localStorage
  useEffect(() => {
    try {
      const savedYear = localStorage.getItem("academicYear");

      if (savedYear && !selectedAcademicYear?._id) {
        dispatch(setSelectedAcademicYear(JSON.parse(savedYear)));
      }
    } catch (err) {
      console.error("Invalid academicYear in localStorage", err);
    }
  }, [dispatch, selectedAcademicYear]);

  // 5. Save Academic Year
  useEffect(() => {
    if (selectedAcademicYear?._id) {
      localStorage.setItem(
        "academicYear",
        JSON.stringify(selectedAcademicYear)
      );
    }
  }, [selectedAcademicYear]);

  return (
    <>
      {/* 🔥 Routes */}
      <Suspense fallback={<Loader/>}>
        <Outlet />
      </Suspense>

      {/* 🔥 Toast */}
      <Suspense fallback={null}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
      </Suspense>

      {/* 🔥 Performance Insights */}
      <Suspense fallback={null}>
        <SpeedInsights />
      </Suspense>
    </>
  );
}

export default App;