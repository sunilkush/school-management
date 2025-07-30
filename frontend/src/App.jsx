import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { currentUser } from './features/auth/authSlice';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile } = useSelector(state => state.auth);
  console.log(profile)
  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.statusCode === 401) {
      navigate('/login');
    }
  }, [profile, navigate]);

  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}

export default App;
