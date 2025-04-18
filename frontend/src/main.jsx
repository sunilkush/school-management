import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import LoginPage from './pages/Login.jsx'
import SignUpPage from './pages/SignUp.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Teachers from './pages/Teachers.jsx'
import Page404 from './pages/Page404.jsx'
import ProtectedRoutes from './components/ProtectedRoutes.jsx'
import NotFound from './pages/NotFound.jsx'

const router = createBrowserRouter([{
  path: "/",
  element: <App />,
  children: [
    {
      path: '/',
      element: (
        <LoginPage />
      )
    },
    {
      path: '/login',
      element: (
        <LoginPage />
      )
    },
    {
      path: '/Page404',
      element: (
        <Page404 />
      )
    },
    
    {
      path: '/Dashboard',
      element: (<Dashboard />),
      children: [
        { path: "teachers", element: (<Teachers />) },
        { path: "signUp", element: (<SignUpPage />) },
      ]
    },
    { path: "*", element: <NotFound /> },


  ]

}])

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} ></RouterProvider>
  </Provider>
)
