import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { currentUser } from './features/authSlice';
import { setSelectedAcademicYear } from './features/academicYearSlice';
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { profile } = useSelector(state => state.auth);
  const { selectedAcademicYear } = useSelector(state => state.academicYear);

  // 1. Load current user
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  // 2. Redirect to login if not authenticated
  useEffect(() => {
    if (profile?.statusCode === 401) {
      navigate('/login');
    }
  }, [profile, navigate]);

  // 3. Persist and Sync Academic Year on App Load
  useEffect(() => {
    const savedYear = localStorage.getItem('academicYear');
    if (savedYear && !selectedAcademicYear?._id) {
      // sync from localStorage to redux
      dispatch(setSelectedAcademicYear(JSON.parse(savedYear)));
    }
  }, [dispatch, selectedAcademicYear]);

  // 4. Optional: Keep Redux changes in sync with localStorage
  useEffect(() => {
    if (selectedAcademicYear?._id) {
      localStorage.setItem('academicYear', JSON.stringify(selectedAcademicYear));
    }
  }, [selectedAcademicYear]);

  return (
    <>
      <Outlet />
      <ToastContainer />
      <SpeedInsights />
    </>
  );
}

export default App;
