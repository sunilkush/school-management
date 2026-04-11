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
  const location = useLocation();
  const { profile, user, accessToken, isAuthInitialized } = useSelector((state) => state.auth);

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

      try {
        await dispatch(initializeAuth()).unwrap();

        const token = getAccessToken();
        if (token) {
          await dispatch(currentUser()).unwrap();
        }
      } catch {
        // Keep existing persisted/login state. Avoid force-logout on transient init failures.
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

     if (profile?.statusCode === 401 && accessToken) {
      dispatch(forceLogout());

      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
   }, [dispatch, isAuthInitialized, profile, accessToken, navigate, location.pathname]);

  if (!isAuthInitialized) {
    return (
      <Suspense fallback={null}>
        <Loader />
      </Suspense>
    );
  }

  return (
    <>
      <Outlet />
      <ToastContainer />
      <SpeedInsights />
    </>
  );
}

export default App;
