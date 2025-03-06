import { createRoot } from 'react-dom/client'
import {Provider} from "react-redux";
import store from './store/store.js';
import './index.css';
import App from './App.jsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from './pages/login.jsx';
 
let router = createBrowserRouter([{
  path:"/",
  element:<App/>,
  children:[
    {
      path:'/',
      element:(<LoginPage/>)
    }]
}])

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
  <RouterProvider router={router}></RouterProvider>
  </Provider>
)
