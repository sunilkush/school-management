import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { currentUser } from "./features/authSlice";
import { fetchMyPermissions } from "./features/roleUiSlice";
import { setSelectedAcademicYear } from "./features/academicYearSlice";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Loader from "./components/Loader/Loader";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { profile, accessToken } = useSelector(
    (state) => state.auth
  );
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear
  );

  // 1. Load current user (only if not loaded)
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
      navigate("/"); // ⚠️ fixed (no /login route)
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
      console.error("Invalid academicYear in localStorage",err);
    }
  }, [dispatch, selectedAcademicYear]);

  // ✅ 5. Save Academic Year to localStorage
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
      <Outlet />

      {/* ✅ Toast Config */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      {/* ✅ Performance Insights */}
      <SpeedInsights />
    </>
  );
}

export default App;