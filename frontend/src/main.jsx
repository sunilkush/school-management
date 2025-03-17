import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { RouterProvider,createBrowserRouter } from 'react-router-dom'
import AuthLayout from './components/AuthLayout.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/Login.jsx'
import SignUpPage from './pages/signUp.jsx'
const router = createBrowserRouter([{
  path:"/",
  element:<App/>,
  children:[
    {
      path:'/',
      element:(
      <AuthLayout authentication={false}>
      <Home/>
      </AuthLayout>
      )
    },
    {
      path:'/login',
      element:(
      <AuthLayout authentication={false}>
      <LoginPage/>
      </AuthLayout>
      )
    },
    {
      path:'/signup',
      element:(
      <AuthLayout authentication={false}>
      <SignUpPage/>
      </AuthLayout>
      )
    },

  ]

}])

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
       <RouterProvider router={router} ></RouterProvider>
  </Provider>
)
